import requests
import uuid
import os
import json
import traceback
import asyncio
from io import BytesIO
# IMPORTANTE: Questa riga risolve l'errore "NameError: name 'Optional' is not defined"
from typing import List, Optional

from PIL import Image
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Google GenAI Imports
from google import genai
from google.genai import types

# Datapizza Imports
from datapizza.clients.openai import OpenAIClient
from datapizza.agents import Agent

# Import Tools and Models
from tools import sql_db, get_property_details
from models import ChatRequest, RenovateRequest, RenovateResponse, ContractorQuote

# 1. Setup
load_dotenv("../secret.env")
app = FastAPI(title="Immobiliare.ai Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("generated_images", exist_ok=True)
app.mount("/generated_images", StaticFiles(directory="generated_images"), name="generated")

client = OpenAIClient(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-5-mini")

# --- AGENT SETUP ---
chat_history_buffer = []

SYSTEM_PROMPT = """You are a Real Estate Concierge for Immobiliare.ai.
Your goal is to assist users in a natural, conversational way.

BEHAVIORAL RULES (STRICT):
1. **GREETINGS:** If the user says "Ciao" or "Hello", reply ONLY with a polite greeting and ask how you can help. DO NOT SEARCH. DO NOT LIST OPTIONS.
2. **SHORT ANSWERS:** Keep text responses concise (max 2-3 sentences). Don't create walls of text.
3. **DISCOVERY:** Before searching, ensure you know: Zone AND Budget. If missing, ask nicely. those are information necessary but don't limit to them.ask about family, children, pets, etc those are not mandatory but increase the sense of personalization.if the user already gave you those informations don't ask for confirmations or ask again, go for the query

DATABASE SCHEMA:
- Table `properties`: id, title, city, zone, address, price, rooms, bathrooms, sqm, floor, elevator, specs (JSONB), description_ai.
- Table `property_images`: property_id, storage_url, is_main.

SQL QUERY RULES (Only run when you have specific criteria):
1. **UUID CAST:** ALWAYS use `p.id::text`.
2. **AGGREGATION:** Use `array_agg(pi.storage_url)` to get ALL images.
3. **MAIN IMAGE:** Select a single image for the cover.

SQL QUERY INSTRUCTIONS:
Always select specific technical details to populate the UI cards.
Pattern:
```sql
SELECT
p.id::text as id,
p.title, p.city, p.zone, p.address, p.price, 
p.rooms, p.bathrooms, p.sqm, p.floor, p.total_floors, p.elevator,
p.specs, p.description_ai,
(SELECT storage_url FROM property_images WHERE property_id = p.id LIMIT 1) as main_image,
array_agg(pi.storage_url) as all_images
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
WHERE ... (filters) ...
GROUP BY p.id
LIMIT 5;
RESPONSE FORMAT:

1. First, provide a short, engaging text summary in Italian (e.g., "Ho trovato 3 soluzioni in zona Isola...").
2. Then, ONLY IF properties are found, append the data inside a STRICT Markdown JSON block.

Example Output Structure:
"Ho trovato ottime soluzioni per te. Ecco i dettagli."
```json
[
  {
    "id": "uuid",
    "title": "Title",
    "city": "Milano",
    "zone": "Zone",
    "address": "Full Address",
    "price": 1000,
    "main_image": "url",
    "images": ["url1", "url2"],
    "rooms": 3,
    "bathrooms": 2,
    "sqm": 100,
    "floor": 1,
    "total_floors": 5,
    "elevator": true,
    "specs": {"heating": "Autonomo", "state": "Buono", "contract": "Vendita"},
    "description_ai": "AI description..."
  }
]
CRITICAL: If all_images is null, put main_image inside images. """

real_estate_agent = Agent(
    name="real_estate_sql_agent",
    system_prompt=SYSTEM_PROMPT,
    client=client,
    tools=[sql_db.list_tables, sql_db.get_table_schema, sql_db.run_sql_query, get_property_details],
    max_steps=10,
    terminate_on_text=True,
)

def run_agent(user_message: str) -> str:
    global chat_history_buffer
    try:
        print(f"🤖 Agent received: {user_message}")
        
        context_str = ""
        if chat_history_buffer:
            # Clean history to avoid confusion
            history_lines = [f"- {m['role']}: {m['content'].split('```json')[0].strip()}" for m in chat_history_buffer[-6:]]
            context_str = "HISTORY:\n" + "\n".join(history_lines)

        augmented = f"{context_str}\nUSER: {user_message}\n(Reply naturally. If searching, use p.id::text cast. Append JSON if results found)."
        
        result = real_estate_agent.run(augmented)
        
        chat_history_buffer.append({"role": "user", "content": user_message})
        chat_history_buffer.append({"role": "assistant", "content": result.text})
        return result.text
    except Exception as e:
        print(f"Error: {e}")
        # Stampa l'errore completo in console per debug
        traceback.print_exc()
        return "Si è verificato un errore tecnico. Riprova tra poco."

# --- HELPER: Elaborazione Singola Immagine (UPDATED FOR GEMINI 3 PRO) ---
def process_renovation_sync(image_url: str, style: str) -> Optional[str]:
    """
    Scarica, genera e salva una singola immagine usando Google GenAI (Gemini 3 Pro).
    """
    try:
        # 1. Download dell'immagine originale
        img_response = requests.get(image_url, timeout=10)
        img_response.raise_for_status()
        input_image = Image.open(BytesIO(img_response.content))

        client_gen = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

        # Prompt Ottimizzato per Interior Design
        full_prompt = f"""
        Act as a professional interior designer. 
        Renovate this room in a **{style}** style.
        Preserve the structural elements (windows, ceiling, general layout) but completely replace furniture, flooring, and decor to match the {style} aesthetic.
        High quality, photorealistic 4k render.
        """

        # 2. Configurazione Modello (Gemini 3 Pro Image Preview)
        model_name = "gemini-3-pro-image-preview"
        
        try:
            print(f"🎨 Generating with {model_name}...")
            response = client_gen.models.generate_content(
                model=model_name,
                contents=[full_prompt, input_image],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"], # Ci interessa solo l'immagine
                    image_config=types.ImageConfig(
                        aspect_ratio="4:3", # Standard per foto immobiliari
                        image_size="2K"     # Alta qualità
                    )
                ),
            )
        except Exception as e:
            print(f"⚠️ Primary model failed: {e}")
            print("🔄 Falling back to Gemini 2.5 Pro...")
            # Fallback a 2.5 Pro se il 3.0 Preview non è disponibile per la chiave API
            response = client_gen.models.generate_content(
                model="gemini-2.5-pro",
                contents=[full_prompt, input_image],
            )

        # 3. Salvataggio Immagine Generata
        renovated_filename = f"renovated_{uuid.uuid4()}.png"
        save_path = os.path.join("generated_images", renovated_filename)
        
        image_saved = False
        if hasattr(response, "parts"):
            for part in response.parts:
                if hasattr(part, "as_image"):
                    # Metodo diretto SDK
                    part.as_image().save(save_path)
                    image_saved = True
                    break
                elif hasattr(part, "inline_data"):
                    # Metodo Base64
                    import base64
                    with open(save_path, "wb") as f:
                        f.write(base64.b64decode(part.inline_data.data))
                    image_saved = True
                    break
        
        if image_saved:
            print(f"✅ Image saved: {renovated_filename}")
            # URL per il frontend
            return f"http://localhost:8000/generated_images/{renovated_filename}"
        else:
            print("❌ No image found in response parts.")
            
    except Exception as e:
        print(f"⚠️ Error processing {image_url[-15:]}: {e}")
        traceback.print_exc()
    
    return None


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Immobiliare.ai API"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    return PlainTextResponse(run_agent(request.message))

@app.post("/api/renovate", response_model=RenovateResponse)
async def renovate(request: RenovateRequest):
    print(f"🎨 Renovation Request: {request.style} (Mode: {request.mode})")
    
    # 1. Cost Calculation
    base_price_mq = 600 if request.style == "Industrial" else 800 if request.style == "Modern" else 1000
    area_to_calculate = request.sqm if request.mode == 'house' else 25
    total_est = base_price_mq * area_to_calculate

    contractors = [
        ContractorQuote(name="EdilMilano Pro", price=int(total_est * 0.9), rating=4.8),
        ContractorQuote(name="RistrutturaFacile", price=int(total_est * 0.85), rating=4.5),
        ContractorQuote(name="Luxury Design Studio", price=int(total_est * 1.2), rating=4.9),
    ]

    # 2. Image Generation Logic
    main_renovated_url = ""
    gallery_urls = []

    # Se modalità CASA e abbiamo altre immagini, usiamo il parallelismo
    if request.mode == 'house' and request.gallery_images:
        print(f"🚀 Starting PARALLEL generation for {len(request.gallery_images)} images...")
        
        # Limitiamo a max 4 immagini per sicurezza demo (evitare rate limits)
        images_to_process = request.gallery_images[:4] 
        
        # Creiamo i task asincroni wrappando la funzione sincrona in thread
        tasks = [
            asyncio.to_thread(process_renovation_sync, url, request.style) 
            for url in images_to_process
        ]
        
        # Eseguiamo tutto in parallelo
        results = await asyncio.gather(*tasks)
        
        # Filtriamo eventuali errori (None)
        gallery_urls = [res for res in results if res is not None]
        
        if gallery_urls:
            main_renovated_url = gallery_urls[0]
        else:
            # Fallback se la generazione fallisce
            main_renovated_url = "[https://via.placeholder.com/800x600?text=Generation+Error](https://via.placeholder.com/800x600?text=Generation+Error)"

    else:
        # Generazione Singola Stanza
        print("🚀 Starting SINGLE generation...")
        result = await asyncio.to_thread(process_renovation_sync, request.image_url, request.style)
        main_renovated_url = result if result else "[https://via.placeholder.com/800x600?text=Error](https://via.placeholder.com/800x600?text=Error)"
        gallery_urls = [main_renovated_url]

    return {
        "renovated_image_url": main_renovated_url,
        "renovated_gallery": gallery_urls,
        "estimated_cost_min": int(total_est * 0.9),
        "estimated_cost_max": int(total_est * 1.1),
        "contractors": contractors
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)