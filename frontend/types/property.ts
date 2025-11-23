export interface PropertySpecs {
    heating?: string;
    ac?: string;
    contract?: string;
    furnished?: string;
    type?: string;
}

export interface PropertyImage {
    url: string;
    room_type?: string;
    is_main: boolean;
}

export interface Property {
    id: string;
    title: string;
    zone: string;
    price: number;
    rooms: number;
    sqm: number;
    bathrooms?: number;
    floor?: number;
    total_floors?: number;
    elevator?: boolean;
    address?: string;
    specs: PropertySpecs;
    description?: string;
    description_ai?: string;
    description_original?: string;
    main_image?: string;
    vibe_tags?: string[];
    images?: PropertyImage[];
}
