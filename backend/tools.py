import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from datapizza.tools import tool
from datapizza.tools.SQLDatabase import SQLDatabase

# Carica le variabili d'ambiente
load_dotenv("../secret.env")

# 1. Setup Supabase Client (Per caricamento immagini e operazioni specifiche)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# 2. Setup SQL Database Tool (Per l'Agente AI)
# È CRUCIALE usare la DATABASE_URL (postgresql://...) e non la SUPABASE_URL (https://...)
db_uri = os.getenv("DATABASE_URL")
if not db_uri:
    raise ValueError("DATABASE_URL mancante nel file .env")

# Inizializza il tool nativo di Datapizza
sql_db = SQLDatabase(db_uri=db_uri)

# 3. Tool ausiliario per dettagli specifici (opzionale, ma utile per formattazione precisa)
@tool
def get_property_details(property_id: str) -> str:
    """
    Retrieves full details for a specific property ID, including all images.
    Useful when you need to show the final card to the user.
    """
    print(f"🔍 Getting details for property: {property_id}")
    
    try:
        response = supabase.table("properties")\
            .select("*, property_images(storage_url, room_type, is_main)")\
            .eq("id", property_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            prop = response.data[0]
            return json.dumps(prop, default=str)
            
        return json.dumps({"error": "Property not found"})
        
    except Exception as e:
        print(f"Supabase error: {e}")
        return json.dumps({"error": str(e)})