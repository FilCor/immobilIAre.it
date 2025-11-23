import json
import random
from pathlib import Path

# Constants for generation
CITIES = {
    "Milano": ["Città Studi", "Brera", "Portello", "Navigli", "Isola", "Lambrate", "Porta Romana"],
    "Roma": ["Trastevere", "Monti", "Prati", "Testaccio", "Garbatella", "San Lorenzo"],
    "Torino": ["Centro", "Crocetta", "San Salvario", "Vanchiglia"],
    "Bologna": ["Centro Storico", "Bolognina", "Saragozza"]
}

STREET_NAMES = [
    "Via Roma", "Via Garibaldi", "Corso Italia", "Via Dante", "Via Mazzini", 
    "Via Verdi", "Viale della Repubblica", "Via Manzoni", "Corso Vittorio Emanuele",
    "Via dei Mille", "Via Gramsci", "Piazza del Popolo", "Via Cavour"
]

ADJECTIVES = [
    "Cozy", "Spacious", "Vintage", "Bright", "Charming", "Historic", "Quiet", 
    "Central", "Rustic", "Classic", "Traditional", "Authentic"
]

TYPES = ["Appartamento", "Loft", "Monolocale", "Bilocale", "Trilocale", "Attico"]

HEATING = ["Centralizzato", "Autonomo"]
AC = ["None", "Presente", "Predisposizione"]
FURNISHED = ["Arredato", "Non arredato", "Parzialmente arredato"]

DESCRIPTIONS = [
    "A classic apartment with high ceilings and original floors.",
    "Located in a historic building, needs some renovation but has great potential.",
    "Perfect for students or young professionals, close to public transport.",
    "Spacious rooms with plenty of natural light, facing the inner courtyard.",
    "Charming vintage vibe with original 1960s tiles.",
    "Quiet and peaceful, a true sanctuary in the city.",
    "Traditional layout with a separate kitchen and large entrance hall.",
    "Well-maintained but retains its old-school character.",
    "Great investment opportunity in a rising neighborhood.",
    "Authentic Italian home with a lovely balcony."
]

def generate_property(index):
    city = random.choice(list(CITIES.keys()))
    zone = random.choice(CITIES[city])
    prop_type = random.choice(TYPES)
    rooms = random.randint(1, 5)
    sqm = rooms * 20 + random.randint(-5, 15)
    price = sqm * random.randint(2000, 6000) // 100 * 100 # Round to nearest 100
    if city == "Milano": price = int(price * 1.2)
    
    # Pick a random image from the 10 variants we will generate
    img_variant = random.randint(1, 10)
    image_file = f"apt_{img_variant:02d}.jpg"

    return {
        "title": f"{random.choice(ADJECTIVES)} {prop_type} in {zone}",
        "price": price,
        "sqm": sqm,
        "rooms": rooms,
        "bathrooms": random.randint(1, 2),
        "floor": random.randint(0, 6),
        "total_floors": random.randint(4, 8),
        "elevator": random.choice([True, True, False]), # More likely to have elevator
        "zone": zone,
        "city": city,
        "address": f"{random.choice(STREET_NAMES)} {random.randint(1, 150)}, {city}",
        "specs": {
            "heating": random.choice(HEATING),
            "ac": random.choice(AC),
            "contract": "Vendita" if random.random() > 0.3 else "Affitto",
            "furnished": random.choice(FURNISHED),
            "type": prop_type
        },
        "description_original": random.choice(DESCRIPTIONS) + " " + random.choice(DESCRIPTIONS),
        "images": [image_file]
    }

def main():
    properties = [generate_property(i) for i in range(50)]
    
    output_path = Path("backend/real_data.json")
    with open(output_path, "w") as f:
        json.dump(properties, f, indent=4, ensure_ascii=False)
    
    print(f"Generated {len(properties)} properties in {output_path}")

if __name__ == "__main__":
    main()
