import json
import random
import os

# --- CONFIGURAZIONE ---
# Percorso dove sono salvate le tue 5000 foto
IMG_SOURCE_DIR = "../picture_dataset"

# Nome del file JSON di output
OUTPUT_DB_FILE = "properties.json" 

# Numero di annunci da generare
NUM_LISTINGS = 50 

# --- DATI GENERATORE ---
zones = [
    {"name": "Brera", "zip": "20121"},
    {"name": "Isola", "zip": "20159"},
    {"name": "Navigli", "zip": "20143"},
    {"name": "Città Studi", "zip": "20133"},
    {"name": "Porta Romana", "zip": "20135"},
    {"name": "NoLo", "zip": "20127"},
    {"name": "Corvetto", "zip": "20139"},
    {"name": "City Life", "zip": "20145"}
]

adjectives = ["Luminoso", "Ampio", "Prestigioso", "Tranquillo", "Storico", "Moderno", "Ristrutturato", "Panoramico"]
types = ["Bilocale", "Trilocale", "Quadrilocale", "Attico", "Loft"]
streets = ["Via Roma", "Corso Italia", "Via Dante", "Viale Monza", "Via Torino", "Corso Buenos Aires", "Via Savona"]

descriptions = [
    "Splendido appartamento in contesto signorile, finiture di pregio.",
    "Soluzione moderna in stabile di recente costruzione, classe A.",
    "Ottimo investimento, zona servitissima e collegata con il centro.",
    "Ampia metratura da personalizzare, vista mozzafiato sullo skyline.",
    "Immobile silenzioso con affaccio interno, portineria tutto il giorno."
]

def scan_images(directory):
    """
    Scansiona la directory e divide le immagini in categorie basate sul prefisso.
    """
    categories = {
        "living": [],
        "kitchen": [],
        "bed": [],
        "bath": [],
        "din": []
    }

    if not os.path.exists(directory):
        print(f"❌ ERRORE: La cartella '{directory}' non esiste. Controlla il percorso.")
        return None

    print(f"📂 Scansiono la cartella: {directory} ...")
    
    count = 0
    for filename in os.listdir(directory):
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
            
        # Identifica la categoria dal prefisso
        prefix = filename.split('_')[0] # es. "bath" da "bath_123.jpg"
        
        if prefix in categories:
            categories[prefix].append(filename)
            count += 1
            
    print(f"✅ Trovate {count} immagini totali.")
    for cat, imgs in categories.items():
        print(f"   - {cat}: {len(imgs)} foto")
        
    return categories

def generate_listing(index, image_buckets):
    """
    Crea un annuncio pescando una foto per ogni categoria disponibile.
    """
    zone = random.choice(zones)
    listing_type = random.choice(types)
    adj = random.choice(adjectives)
    
    rooms = random.randint(2, 5)
    sqm = rooms * random.randint(18, 30)
    price = sqm * random.randint(3500, 9000)
    price = round(price / 1000) * 1000 # Arrotonda
    
    # --- SELEZIONE FOTO ---
    # Ordine logico per un sito web: Sala -> Cucina/Pranzo -> Letto -> Bagno
    listing_images = []
    
    # Funzione helper per prendere una foto random senza rimuoverla (possono ripetersi tra annunci diversi)
    def pick_img(category):
        if image_buckets.get(category) and len(image_buckets[category]) > 0:
            return random.choice(image_buckets[category])
        return None

    # Costruiamo la galleria dell'annuncio
    # 1. Living (obbligatorio)
    img = pick_img("living")
    if img: listing_images.append(img)
    
    # 2. Kitchen (obbligatorio)
    img = pick_img("kitchen")
    if img: listing_images.append(img)
    
    # 3. Dining (opzionale, 50% probabilità)
    if random.random() > 0.5:
        img = pick_img("din")
        if img: listing_images.append(img)
        
    # 4. Bed (tante camere quanti sono i locali - 1, ma almeno 1)
    num_bedrooms = max(1, rooms - 1) 
    # (semplifichiamo prendendo 1 o 2 foto diverse di letti)
    for _ in range(min(num_bedrooms, 2)):
        img = pick_img("bed")
        if img and img not in listing_images: # Evitiamo duplicati esatti nello stesso annuncio
            listing_images.append(img)
            
    # 5. Bath (obbligatorio)
    img = pick_img("bath")
    if img: listing_images.append(img)

    title = f"{adj} {listing_type} in {zone['name']}"

    return {
        "id": index + 1,
        "title": title,
        "price": price,
        "sqm": sqm,
        "rooms": rooms,
        "bathrooms": random.randint(1, 3),
        "floor": random.randint(1, 10),
        "total_floors": 10,
        "elevator": True,
        "zone": zone['name'],
        "city": "Milano",
        "address": f"{random.choice(streets)} {random.randint(1, 150)}, Milano",
        "specs": {
            "heating": random.choice(["Autonomo", "Centralizzato"]),
            "ac": random.choice(["Presente", "Predisposizione"]),
            "contract": "Vendita",
            "furnished": random.choice(["Arredato", "Vuoto"]),
            "type": listing_type
        },
        "description_original": random.choice(descriptions),
        "images": listing_images
    }

def main():
    # 1. Carica le immagini
    image_buckets = scan_images(IMG_SOURCE_DIR)
    
    if not image_buckets:
        return # Esci se errore cartella

    # Controllo se abbiamo abbastanza foto
    total_imgs = sum(len(v) for v in image_buckets.values())
    if total_imgs == 0:
        print("❌ Nessuna immagine trovata con i prefissi corretti (bed_, bath_, etc).")
        return

    # 2. Genera database
    database = []
    print(f"\n🚀 Generazione di {NUM_LISTINGS} annunci in corso...")
    
    for i in range(NUM_LISTINGS):
        item = generate_listing(i, image_buckets)
        database.append(item)

    # 3. Salva JSON
    with open(OUTPUT_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=4, ensure_ascii=False)

    print(f"\n🎉 Finito! File salvato: {OUTPUT_DB_FILE}")
    print(f"📝 Nota: Assicurati che il tuo frontend possa leggere le immagini da: {IMG_SOURCE_DIR}")

if __name__ == "__main__":
    main()