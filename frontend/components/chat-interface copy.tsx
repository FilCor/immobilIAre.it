"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Sparkles, MapPin, Wind, ChevronLeft, ChevronRight,
    Maximize2, X, Thermometer, Wifi, Sun, Bed, Bath, Maximize,
    Wand2, Send, Calendar, CheckCircle, Briefcase, Calculator
} from 'lucide-react';
import { Property } from "@/types/property";

// --- PARSER (Fix JSON) ---
function parseMessageContent(fullContent: string): { text: string; properties: Property[] } {
    let text = fullContent;
    let properties: Property[] = [];
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = fullContent.match(codeBlockRegex);
    if (match) {
        try {
            properties = JSON.parse(match[1]);
            text = fullContent.replace(match[0], "").trim();
        } catch (e) { }
    } else {
        const firstOpen = fullContent.indexOf('[');
        const lastClose = fullContent.lastIndexOf(']');
        if (firstOpen !== -1 && lastClose > firstOpen) {
            try {
                properties = JSON.parse(fullContent.substring(firstOpen, lastClose + 1));
                text = fullContent.substring(0, firstOpen).trim();
            } catch (e) { }
        }
    }
    return { text: text.replace(/JSON\s*$/i, "").trim(), properties };
}

// --- BOOKING MODAL (Calendario) ---
const BookingModal = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const dates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + i + 1);
        return { day: d.getDate(), week: d.toLocaleDateString('it-IT', { weekday: 'short' }) };
    });

    return (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>

                {step === 1 ? (
                    <>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Richiedi visita</h3>
                        <p className="text-sm text-gray-500 mb-6">Scegli quando visitare l'immobile</p>

                        {/* Type Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button className="flex-1 py-2 bg-white text-[#E31B23] shadow-sm rounded-md text-sm font-bold">Di Persona</button>
                            <button className="flex-1 py-2 text-gray-500 text-sm font-medium">Video Visita</button>
                        </div>

                        {/* Calendar */}
                        <div className="flex justify-between gap-2 mb-6 overflow-x-auto pb-2">
                            {dates.map((d, i) => (
                                <div key={i} className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer min-w-[60px] transition-all ${i === 1 ? 'border-[#E31B23] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <span className="text-xs text-gray-500 uppercase">{d.week}</span>
                                    <span className={`text-xl font-bold ${i === 1 ? 'text-[#E31B23]' : 'text-gray-700'}`}>{d.day}</span>
                                </div>
                            ))}
                        </div>

                        {/* Time Slots */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {['09:00', '11:30', '14:00', '16:30', '18:00'].map(t => (
                                <button key={t} onClick={() => setStep(2)} className="py-2 border rounded-lg text-sm hover:border-[#E31B23] hover:text-[#E31B23] transition-colors">{t}</button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Richiesta Inviata!</h3>
                        <p className="text-gray-500 mt-2 mb-6">L'agenzia ha ricevuto la tua richiesta per Venerdì alle 11:30.</p>
                        <button onClick={onClose} className="w-full py-3 bg-[#E31B23] text-white rounded-xl font-bold">Torna alla ricerca</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// --- RENOVATION PANEL (Advanced) ---
const RenovationPanel = ({ property, image, onClose }: { property: Property, image: string, onClose: () => void }) => {
    const [style, setStyle] = useState("Modern");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/renovate", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: image, prompt: style, style: style, sqm: property.sqm })
            });
            const data = await res.json();
            // Fix URL
            if (data.renovated_image_url.startsWith('/')) data.renovated_image_url = "http://localhost:8000" + data.renovated_image_url;
            setResult(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    return (
        <div className="absolute inset-0 z-[50] bg-black/90 backdrop-blur-md flex md:flex-row flex-col">
            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white"><X size={24} /></button>

            {/* Image Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                {loading ? (
                    <div className="text-center">
                        <Wand2 className="w-12 h-12 text-[#E31B23] animate-spin mb-4 mx-auto" />
                        <p className="text-white font-light animate-pulse">Generazione progetto {style}...</p>
                    </div>
                ) : result ? (
                    <img src={result.renovated_image_url} className="w-full h-full object-contain" />
                ) : (
                    <img src={image} className="w-full h-full object-contain opacity-50 grayscale" />
                )}
            </div>

            {/* Controls Area */}
            <div className="w-full md:w-[400px] bg-white p-8 flex flex-col overflow-y-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2"><Wand2 className="text-[#E31B23]" /> Ristrutturazione AI</h3>
                <p className="text-gray-500 text-sm mb-8">Visualizza il potenziale e stima i costi.</p>

                {!result ? (
                    <>
                        <div className="mb-8">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Scegli Stile</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Modern', 'Industrial', 'Scandinavian', 'Classic Luxury'].map(s => (
                                    <button key={s} onClick={() => setStyle(s)} className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${style === s ? 'border-[#E31B23] bg-red-50 text-[#E31B23]' : 'border-gray-200 hover:border-gray-300'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleGenerate} className="w-full py-4 bg-[#E31B23] text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-auto">
                            Genera Progetto
                        </button>
                    </>
                ) : (
                    <div className="animate-in slide-in-from-bottom duration-500">
                        <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6">
                            <div className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">Stima Costi</div>
                            <div className="text-2xl font-bold text-gray-900">€{result.estimated_cost_min.toLocaleString()} - €{result.estimated_cost_max.toLocaleString()}</div>
                            <p className="text-xs text-gray-500 mt-1">Basato su {property.sqm}mq, stile {style}</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Ditte Consigliate</label>
                            <div className="space-y-3">
                                {result.contractors.map((c: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                                            <div className="text-xs text-yellow-500 flex items-center gap-1">★ {c.rating}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">€{c.price.toLocaleString()}</div>
                                            <div className="text-[10px] text-[#E31B23] font-bold uppercase">Richiedi</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setResult(null)} className="w-full py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Nuova Simulazione</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export function ChatInterface() {
    const [input, setInput] = useState("");
    const [viewState, setViewState] = useState<'idle' | 'results'>('idle');
    const [activeIndex, setActiveIndex] = useState(0);
    const [aiMessage, setAiMessage] = useState("Ciao! Sono la tua AI immobiliare.");
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Modal States
    const [showBooking, setShowBooking] = useState(false);
    const [showRenovation, setShowRenovation] = useState(false);

    // Carousel Logic
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    useEffect(() => { setCurrentImageIndex(0); }, [selectedProperty]); // Reset index on open

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Reset view on new search
        setViewState('results');
        setAiMessage("Analizzo il mercato...");

        try {
            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });
            const rawText = await response.text();
            const { text, properties: fetchedProps } = parseMessageContent(rawText);

            setAiMessage(text);
            setInput("");

            if (fetchedProps.length > 0) {
                setProperties(fetchedProps);
                setActiveIndex(0);
            }
        } catch (error) { setAiMessage("Errore di connessione."); }
    };

    const handleNavigate = (newIndex: number) => {
        if (newIndex < 0 || newIndex >= properties.length) return;
        setActiveIndex(newIndex);
    };

    // Image Navigation Helpers
    const currentImages = selectedProperty?.images?.length ? selectedProperty.images : [selectedProperty?.main_image];
    const currentImage = currentImages?.[currentImageIndex] || "";

    return (
        <div className="relative w-full h-screen bg-white text-gray-900 font-sans flex flex-col overflow-hidden">

            {/* NAVBAR */}
            <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/90 backdrop-blur-sm border-b border-gray-100 z-30 absolute top-0">
                <div className="text-2xl font-bold text-gray-900 tracking-tight">
                    Immobil<span className="text-[#E31B23]">IA</span>re.it
                </div>
                <div className="hidden md:block text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">BETA</div>
            </nav>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col relative pt-20 pb-24"> {/* Padding for Nav and Input */}

                {/* AI BUBBLE */}
                <div className="px-4 mb-6 w-full max-w-3xl mx-auto z-20">
                    <motion.div layout className="bg-white border border-gray-100 shadow-xl rounded-[24px] rounded-bl-sm p-6 relative">
                        <Sparkles className="w-6 h-6 text-[#E31B23] mb-2" />
                        <p className="text-lg text-gray-700 leading-relaxed">{aiMessage}</p>
                    </motion.div>
                </div>

                {/* IDLE STATE */}
                {viewState === 'idle' && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 pointer-events-none">
                        <p className="text-4xl font-bold text-gray-200">Cerca la tua casa</p>
                    </div>
                )}

                {/* RESULTS DECK */}
                {viewState === 'results' && properties.length > 0 && (
                    <div className="flex-1 relative w-full max-w-6xl mx-auto overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center preserve-3d">
                            {properties.map((prop, index) => {
                                const offset = index - activeIndex;
                                const isActive = offset === 0;
                                if (Math.abs(offset) > 2) return null;

                                return (
                                    <motion.div
                                        key={prop.id}
                                        onClick={() => isActive ? null : handleNavigate(index)}
                                        animate={{
                                            x: offset * 340,
                                            scale: isActive ? 1 : 0.9,
                                            opacity: isActive ? 1 : 0.4,
                                            zIndex: isActive ? 20 : 10,
                                            filter: isActive ? "blur(0px)" : "blur(4px)",
                                        }}
                                        className="absolute w-[320px] md:w-[380px] h-[480px] bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden cursor-pointer"
                                    >
                                        <div className="h-2/3 relative">
                                            <img src={prop.main_image || "/placeholder.jpg"} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-4 left-4 text-white">
                                                <div className="text-lg font-bold">{prop.zone}</div>
                                                <div className="text-xs opacity-80">{prop.city}</div>
                                            </div>
                                        </div>
                                        <div className="h-1/3 p-5 flex flex-col justify-between">
                                            <h3 className="font-medium text-gray-900 line-clamp-2">{prop.title}</h3>
                                            <div className="flex justify-between items-end">
                                                <div className="text-[#E31B23] font-bold text-2xl">€{prop.price.toLocaleString()}</div>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedProperty(prop); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                                                    <Maximize2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Navigation */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 pb-4">
                            <button onClick={() => handleNavigate(activeIndex - 1)} className="p-3 bg-white shadow-lg rounded-full border border-gray-100"><ChevronLeft /></button>
                            <button onClick={() => handleNavigate(activeIndex + 1)} className="p-3 bg-white shadow-lg rounded-full border border-gray-100"><ChevronRight /></button>
                        </div>
                    </div>
                )}
            </main>

            {/* PERSISTENT INPUT (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="relative flex items-center shadow-xl shadow-gray-200/50 rounded-full bg-white border border-gray-200 focus-within:border-[#E31B23] focus-within:ring-2 focus-within:ring-red-50 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Scrivi qui... (es. 'Mostrami solo case con terrazzo')"
                            className="flex-1 py-4 px-6 rounded-full outline-none text-gray-900 placeholder:text-gray-400"
                        />
                        <button type="submit" className="absolute right-2 p-3 bg-[#E31B23] text-white rounded-full hover:bg-red-700 transition-colors">
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* FULL SCREEN DETAIL MODAL */}
            <AnimatePresence>
                {selectedProperty && (
                    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">

                            {/* Overlays */}
                            {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
                            {showRenovation && <RenovationPanel property={selectedProperty} image={currentImage} onClose={() => setShowRenovation(false)} />}

                            <button onClick={() => setSelectedProperty(null)} className="absolute top-4 left-4 z-30 p-2 bg-white/90 rounded-full hover:bg-white shadow-md"><X size={20} /></button>

                            {/* Left: Image Carousel */}
                            <div className="w-full md:w-2/3 h-1/2 md:h-full relative bg-gray-100 group">
                                <img src={currentImage || "/placeholder.jpg"} className="w-full h-full object-cover" />

                                {/* Carousel Nav */}
                                {currentImages.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentImageIndex((i) => (i - 1 + currentImages.length) % currentImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft /></button>
                                        <button onClick={() => setCurrentImageIndex((i) => (i + 1) % currentImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight /></button>
                                    </>
                                )}

                                <div className="absolute bottom-6 inset-x-0 flex justify-center">
                                    <button onClick={() => setShowRenovation(true)} className="px-6 py-3 bg-white text-black font-bold rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform border border-gray-100">
                                        <Wand2 size={18} className="text-[#E31B23]" /> Ristruttura con AI
                                    </button>
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div className="w-full md:w-1/3 h-1/2 md:h-full p-8 overflow-y-auto bg-white">
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-[#E31B23] uppercase tracking-wider mb-2">Dettagli</div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedProperty.title}</h2>
                                    <p className="text-gray-500 flex items-center gap-1"><MapPin size={14} /> {selectedProperty.address}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-y border-gray-100 py-6 mb-6 text-center">
                                    <div><span className="block text-xl font-bold">{selectedProperty.rooms}</span><span className="text-[10px] text-gray-400 uppercase">Locali</span></div>
                                    <div className="border-l border-gray-100"><span className="block text-xl font-bold">{selectedProperty.sqm}</span><span className="text-[10px] text-gray-400 uppercase">Mq</span></div>
                                    <div className="border-l border-gray-100"><span className="block text-xl font-bold">{selectedProperty.bathrooms || 1}</span><span className="text-[10px] text-gray-400 uppercase">Bagni</span></div>
                                </div>

                                <div className="bg-gray-50 p-5 rounded-xl mb-8">
                                    <h4 className="text-gray-900 font-bold text-xs uppercase mb-2 flex items-center gap-2"><Sparkles size={12} /> AI Insight</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{selectedProperty.description_ai || selectedProperty.description_original}</p>
                                </div>

                                <div className="mt-auto">
                                    <div className="text-3xl font-bold text-[#E31B23] mb-4">€{selectedProperty.price.toLocaleString()}</div>
                                    <button onClick={() => setShowBooking(true)} className="w-full py-4 bg-[#E31B23] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg uppercase tracking-wider text-sm">
                                        Richiedi Visita
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}