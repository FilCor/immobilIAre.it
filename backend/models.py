from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str

class RenovateRequest(BaseModel):
    image_url: str
    # Nuovi campi per la modalità "Intera Casa"
    gallery_images: List[str] = [] 
    mode: str = "room"  # 'room' | 'house'
    
    # Rendiamo prompt opzionale con default vuoto per evitare errori 422
    prompt: Optional[str] = "" 
    style: str = "Modern"
    sqm: int = 80

class ContractorQuote(BaseModel):
    name: str
    price: int
    rating: float

class RenovateResponse(BaseModel):
    renovated_image_url: str
    # Campo necessario per la galleria
    renovated_gallery: List[str] = [] 
    estimated_cost_min: int
    estimated_cost_max: int
    contractors: List[ContractorQuote]