"""
Data Ingestion Pipeline for Immobiliare.ai (Production Grade)
Populates Supabase database with properties from real_data.json
Uses Google GenAI SDK v2 (Gemini 2.0 Flash) for automated image analysis & synthesis.
"""

import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image

# Nuova SDK Google
from google import genai
from google.genai import types

# Supabase
from supabase import create_client, Client

# Load environment variables
load_dotenv("../../secret.env")

# 1. Initialize Clients
# Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Google GenAI (SDK v2)
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Model Configuration
# Gemini 2.0 Flash Experimental è il più veloce e accurato per la visione.
# Se non disponibile, usa "gemini-1.5-flash".
VISION_MODEL = "gemini-2.0-flash-exp" 

def analyze_image_with_flash(image_path: str) -> dict:
    """
    Analyze a property image using Gemini Flash Vision.
    Enforces native JSON output.
    """
    print(f"  📸 Analyzing image: {Path(image_path).name}...")
    
    try:
        # Load image with PIL
        img = Image.open(image_path)
        
        prompt = """
        You are a real estate vision expert. Analyze this photo.
        
        Extract these fields:
        1. room_type: (Living Room, Kitchen, Bedroom, Bathroom, Exterior, Plan, etc.)
        2. condition_score: Integer 1-10 (10 = new/luxury, 1 = ruins)
        3. vibe_tags: Array of strings (e.g. ["bright", "modern", "dated", "cozy"])
        4. brief_caption: A short sentence describing visual highlights (e.g. "Terrazzo flooring with large windows").
        """
        
        # Chiamata con Structured Output (JSON Mode)
        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[prompt, img],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "room_type": {"type": "STRING"},
                        "condition_score": {"type": "INTEGER"},
                        "vibe_tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "brief_caption": {"type": "STRING"}
                    }
                }
            )
        )
        
        # Il parsing è ora sicuro e diretto
        return json.loads(response.text)
        
    except Exception as e:
        print(f"    ⚠️  Analysis failed: {e}")
        # Fallback sicuro
        return {
            "room_type": "Unknown",
            "condition_score": 5,
            "vibe_tags": ["standard"],
            "brief_caption": "Standard interior"
        }

def generate_summary_description(property_title: str, room_data: list) -> str:
    """
    Takes all the analyzed data from images and generates a cohesive listing description.
    """
    print("  ✍️  Synthesizing AI Description...")
    
    prompt = f"""
    Write a captivating real estate description (max 3 sentences) for a property named "{property_title}".
    
    Base it strictly on these visual observations collected from the photos:
    {json.dumps(room_data, indent=2)}
    
    Focus on the "Vibe", the light, and the condition. 
    Do not list rooms mechanistically. Make it sound like a premium listing.
    """
    
    try:
        response = client.models.generate_content(
            model=VISION_MODEL, # Flash va benissimo anche per il testo
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"A beautiful property in {property_title}."

def upload_to_supabase_storage(file_path: str, property_id: str) -> str:
    """
    Upload image to Supabase Storage and return public URL
    """
    try:
        bucket_name = "listings"
        filename = f"{property_id}/{Path(file_path).name}"
        
        # Upload with upsert=true to overwrite if exists
        with open(file_path, 'rb') as f:
            supabase.storage.from_(bucket_name).upload(
                filename,
                f,
                file_options={"content-type": "image/jpeg", "x-upsert": "true"}
            )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
        
    except Exception as e:
        print(f"    ⚠️  Upload failed: {e}")
        return "https://via.placeholder.com/800x600?text=Upload+Error"

def seed_database():
    """
    Main seeding orchestration
    """
    print("\n🚀 STARTING IMMOBILIARE.AI DATA INGESTION\n")
    
    # Locate data
    base_path = Path(__file__).parent.parent
    data_file = base_path / "real_data.json"
    assets_dir = base_path / "assets"
    
    if not data_file.exists():
        print("❌ Error: real_data.json not found in backend folder.")
        return

    with open(data_file, 'r') as f:
        properties_data = json.load(f)
    
    print(f"📊 Found {len(properties_data)} properties to process.\n")
    
    for idx, prop_data in enumerate(properties_data, 1):
        print(f"[{idx}/{len(properties_data)}] Processing: {prop_data['title']}...")
        
        # 1. Insert Property Core Data
        try:
            # Prepare the insert payload matching your SQL Schema
            insert_payload = {
                "title": prop_data["title"],
                "price": prop_data["price"],
                "sqm": prop_data["sqm"],
                "rooms": prop_data.get("rooms"),
                "bathrooms": prop_data.get("bathrooms"),
                "floor": prop_data.get("floor"),
                "total_floors": prop_data.get("total_floors"),
                "elevator": prop_data.get("elevator"),
                "zone": prop_data["zone"],
                "city": prop_data.get("city", "Milano"), # Default a Milano se manca nel JSON
                "address": prop_data.get("address"),
                "description_original": prop_data.get("description_original"),
                "specs": prop_data.get("features", {}) # Maps JSON 'features' to SQL 'specs'
            }
            
            res = supabase.table("properties").insert(insert_payload).execute()
            
            # Gestione sicura della risposta Supabase (può variare in base alla versione lib)
            if hasattr(res, 'data') and res.data:
                property_id = res.data[0]["id"]
            else:
                # Fallback per versioni diverse della lib
                property_id = res[0]["id"] if isinstance(res, list) else None
                
            print(f"  ✓ Property Created (ID: {property_id})")
            
        except Exception as e:
            print(f"  ❌ Critical Error inserting property: {e}")
            continue
        
        # 2. Process Images & Collect Data for AI
        collected_ai_data = [] 
        all_tags = set()
        
        images_list = prop_data.get("images", [])
        
        for img_idx, img_filename in enumerate(images_list):
            img_path = assets_dir / img_filename
            
            if not img_path.exists():
                print(f"    ⚠️  File not found: {img_filename}")
                continue
            
            # A. Upload
            public_url = upload_to_supabase_storage(str(img_path), property_id)
            
            # B. Analyze (AI Vision)
            analysis = analyze_image_with_flash(str(img_path))
            
            # C. Insert into property_images
            try:
                supabase.table("property_images").insert({
                    "property_id": property_id,
                    "storage_url": public_url,
                    # Non salviamo local_filename nello schema SQL, rimosso per sicurezza
                    "room_type": analysis.get("room_type"),
                    "renovation_potential": "High" if analysis.get("condition_score", 10) < 6 else "Low",
                    # Nello schema SQL avevi 'renovation_potential', non 'ai_caption'. 
                    # Se vuoi 'ai_caption' devi aggiungerlo allo schema SQL.
                    # Per ora mappiamo caption dentro renovation_potential se serve o lo ignoriamo.
                    # Manteniamo la coerenza con lo schema SQL fornito:
                    "is_main": (img_idx == 0)
                }).execute()
                print(f"    ✓ Image Processed: {analysis.get('room_type')} ({analysis.get('condition_score')}/10)")
                
                # Collect data for final synthesis
                collected_ai_data.append(analysis)
                for tag in analysis.get("vibe_tags", []):
                    all_tags.add(tag.lower())
                    
            except Exception as e:
                print(f"    ❌ DB Error saving image: {e}")

        # 3. Final AI Synthesis (Update Property)
        if collected_ai_data:
            # Generate the cohesive description
            final_description = generate_summary_description(prop_data["title"], collected_ai_data)
            
            # Update the property row
            try:
                supabase.table("properties").update({
                    "description_ai": final_description,
                    "ai_vibe_tags": list(all_tags)
                }).eq("id", property_id).execute()
                print(f"  ✨ AI Description Generated & Saved.")
            except Exception as e:
                print(f"  ⚠️ Could not update AI description: {e}")

        print("  --------------------------------------------------")
    
    print("\n✅ SEEDING COMPLETE. Database is ready for the Demo.")

if __name__ == "__main__":
    seed_database()