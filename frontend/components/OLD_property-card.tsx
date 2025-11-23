"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bed, Bath, Maximize, ThermometerSun, Wind, X, MapPin, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types/property";

export function PropertyCard({ property }: { property: Property }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = property.images && property.images.length > 0 ? property.images : [property.main_image];
    const [renovatedImages, setRenovatedImages] = useState<Record<number, string>>({});
    const [isLoadingRenovation, setIsLoadingRenovation] = useState(false);
    const [showRenovated, setShowRenovated] = useState(false);

    const currentOriginalImage = images[currentImageIndex] || "/placeholder-property.jpg";
    const currentDisplayImage = showRenovated && renovatedImages[currentImageIndex] ? renovatedImages[currentImageIndex] : currentOriginalImage;

    const handleRenovate = async () => {
        if (renovatedImages[currentImageIndex]) {
            setShowRenovated(!showRenovated);
            return;
        }
        setIsLoadingRenovation(true);
        try {
            const response = await fetch("http://localhost:8000/api/renovate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: currentOriginalImage, prompt: "Modern minimalist renovation, bright, open space, italian design" }),
            });
            const data = await response.json();
            const imageUrl = data.renovated_image_url.startsWith('http') ? data.renovated_image_url : `http://localhost:3000${data.renovated_image_url}`;
            const img = new Image();
            img.onload = () => {
                setRenovatedImages(prev => ({ ...prev, [currentImageIndex]: imageUrl }));
                setShowRenovated(true);
                setIsLoadingRenovation(false);
            };
            img.src = imageUrl;
        } catch (error) { setIsLoadingRenovation(false); }
    };

    return (
        <>
            {/* CHAT CARD */}
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-zinc-900 cursor-pointer group rounded-[20px]" onClick={() => setIsExpanded(true)}>
                    <div className="relative h-60 w-full overflow-hidden">
                        <img src={property.main_image || "/placeholder-property.jpg"} alt={property.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        <Badge className="absolute top-4 left-4 bg-white/90 text-black font-bold backdrop-blur-md border-0 shadow-sm">Match 98%</Badge>
                        <div className="absolute bottom-4 left-4 text-white pr-4">
                            <h3 className="text-lg font-bold leading-tight line-clamp-1">{property.title}</h3>
                            <p className="text-sm opacity-90 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {property.zone}, {property.city}</p>
                        </div>
                    </div>
                    <CardContent className="p-4 flex justify-between items-center bg-white dark:bg-zinc-900">
                        <div className="text-2xl font-bold text-[#E31B23]">€{property.price.toLocaleString()}</div>
                        <div className="flex gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{property.rooms}</span>
                            <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{property.sqm}m²</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* MODAL */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsExpanded(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-[#0a0a0a] rounded-[32px] w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50 bg-white/10 text-white hover:bg-white/20 rounded-full backdrop-blur-md" onClick={() => setIsExpanded(false)}><X className="w-6 h-6" /></Button>

                            {/* LEFT: IMAGES */}
                            <div className="w-full md:w-2/3 h-[40vh] md:h-full relative bg-black group">
                                <motion.img key={`${currentImageIndex}-${showRenovated}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={currentDisplayImage} className="w-full h-full object-contain" />
                                {images.length > 1 && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length); setShowRenovated(false); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % images.length); setShowRenovated(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
                                    </>
                                )}
                                <div className="absolute bottom-8 inset-x-0 flex justify-center">
                                    <Button size="lg" onClick={handleRenovate} disabled={isLoadingRenovation} className={`rounded-full px-8 py-6 text-md font-semibold shadow-2xl transition-all ${showRenovated ? "bg-white text-black hover:bg-zinc-100" : "bg-[#E31B23] text-white hover:bg-red-600 border-2 border-transparent hover:border-white/20"}`}>
                                        {isLoadingRenovation ? <span className="flex gap-2 animate-pulse"><Wand2 className="w-5 h-5 animate-spin" /> Sognando...</span> : showRenovated ? "Mostra Originale" : <span className="flex gap-2"><Wand2 className="w-5 h-5" /> Visualizza Ristrutturato</span>}
                                    </Button>
                                </div>
                            </div>

                            {/* RIGHT: INFO */}
                            <div className="w-full md:w-1/3 p-8 overflow-y-auto bg-white dark:bg-[#0a0a0a]">
                                <div className="space-y-1 mb-6">
                                    <div className="text-sm font-medium text-[#E31B23] uppercase tracking-wider flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.city}</div>
                                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{property.title}</h2>
                                </div>
                                <div className="text-4xl font-bold text-[#E31B23] mb-8">€{property.price.toLocaleString()}</div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <div className="text-zinc-400 text-xs font-bold uppercase">Superficie</div>
                                        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{property.sqm} m²</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <div className="text-zinc-400 text-xs font-bold uppercase">Locali</div>
                                        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{property.rooms}</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <h4 className="text-[#E31B23] font-bold text-xs uppercase mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E31B23] animate-pulse" /> L'Opinione dell'AI</h4>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{property.description_ai || property.description_original}</p>
                                    </div>
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-3">
                                        <h3 className="font-semibold">Caratteristiche</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <span className="flex items-center gap-2"><ThermometerSun className="w-4 h-4" /> {property.specs?.heating || "N/A"}</span>
                                            <span className="flex items-center gap-2"><Wind className="w-4 h-4" /> {property.specs?.ac || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}