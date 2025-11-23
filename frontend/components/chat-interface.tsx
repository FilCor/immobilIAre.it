"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Sparkles, MapPin, X, ChevronLeft, ChevronRight,
    Wand2, Send, CheckCircle, Calculator, Building, ArrowUpDown,
    Thermometer, Phone, Mail, User, Calendar as CalendarIcon, Clock,
    Eye, Home, Square, ChevronDown
} from 'lucide-react';

// --- TYPES ---
type Property = {
    id: string;
    title: string;
    city: string;
    zone: string;
    address?: string;
    price: number;
    main_image: string;
    images: string[];
    rooms: number;
    bathrooms: number;
    sqm: number;
    floor?: number;
    total_floors?: number;
    elevator?: boolean;
    specs?: {
        heating?: string;
        contract?: string;
        furnished?: string;
        type?: string;
    };
    description_ai?: string;
    description_original?: string;
};

// --- PARSER ---
function parseMessageContent(fullContent: string): { text: string; properties: Property[] } {
    let text = fullContent;
    let properties: Property[] = [];
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = fullContent.match(codeBlockRegex);
    if (match) {
        try {
            properties = JSON.parse(match[1]);
            text = fullContent.replace(match[0], "").trim();
        } catch (e) { console.error("JSON Parse Error (Block)", e); }
    } else {
        const firstOpen = fullContent.indexOf('[');
        const lastClose = fullContent.lastIndexOf(']');
        if (firstOpen !== -1 && lastClose > firstOpen) {
            try {
                const potentialJson = fullContent.substring(firstOpen, lastClose + 1);
                properties = JSON.parse(potentialJson);
                text = fullContent.substring(0, firstOpen).trim();
                text = text.replace(/(?:Ecco|Here is)?\s*(?:il)?\s*(?:JSON|dati|data)[:\s-]*$/i, "").trim();
            } catch (e) { console.error("JSON Parse Error (Fallback)", e); }
        }
    }
    return { text, properties };
}

// --- COMPONENTS ---

const FeatureBadge = ({ icon: Icon, label, value }: any) => (
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-100">
        <Icon size={20} className="text-[#00579E] mb-1" />
        <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
);

// --- MODAL 1: BOOKING ---
const BookingModal = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const dates = Array.from({ length: 4 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + i + 1);
        return { day: d.getDate(), week: d.toLocaleDateString('it-IT', { weekday: 'short' }) };
    });

    return (
        <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X size={20} /></button>
                {step === 1 ? (
                    <>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Richiedi visita</h3>
                        <p className="text-sm text-gray-500 mb-6">Scegli come visitare l'immobile</p>
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button className="flex-1 py-2 bg-white text-[#00579E] shadow-sm rounded-md text-sm font-bold flex items-center justify-center gap-2"><User size={16} /> DI PERSONA</button>
                            <button className="flex-1 py-2 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:text-gray-700"><Phone size={16} /> A DISTANZA</button>
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-3">Seleziona disponibilità</p>
                        <div className="flex gap-2 mb-6">
                            <div className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all bg-[#00579E] text-white border-[#00579E]`}>
                                <span className="text-xs opacity-90 uppercase mb-1">URGENTE</span><span className="text-sm font-bold text-center">Prima<br />Possibile</span>
                            </div>
                            {dates.map((d, i) => (
                                <div key={i} onClick={() => setSelectedDate(i)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${selectedDate === i ? 'border-[#00579E] bg-blue-50 ring-1 ring-[#00579E]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <span className="text-xs text-gray-500 uppercase mb-1">{d.week}</span><span className="text-xl font-bold text-gray-800">{d.day}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)} className="w-full py-3 bg-[#E31B23] text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2">PROSEGUI <ArrowRight size={18} /></button>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-600" /></motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Richiesta Inviata!</h3>
                        <p className="text-gray-500 mb-8 text-sm">L'agenzia Immobiliare Milano ti contatterà a breve.</p>
                        <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Chiudi</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODAL 2: FEEDBACK ---
const ContactFeedbackModal = ({ type, onClose }: { type: 'phone' | 'email', onClose: () => void }) => (
    <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-[#E31B23]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#E31B23]">{type === 'phone' ? <Phone size={32} /> : <Mail size={32} />}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{type === 'phone' ? 'Numero Copiato!' : 'Messaggio Inviato'}</h3>
            <button onClick={onClose} className="w-full py-3 bg-[#00579E] text-white rounded-lg font-bold mt-4">Ottimo</button>
        </div>
    </div>
);

// --- RENOVATION PANEL (REAL GENERATION) ---
const RenovationPanel = ({ property, image, onClose }: { property: Property, image: string, onClose: () => void }) => {
    const [style, setStyle] = useState("Modern");
    const [mode, setMode] = useState<'room' | 'house'>('room');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // State for browsing generated gallery
    const [selectedRenovatedImage, setSelectedRenovatedImage] = useState<string | null>(null);
    const [expandedQuote, setExpandedQuote] = useState<number | null>(null);
    const [isComparing, setIsComparing] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        setSelectedRenovatedImage(null);

        // Se intera casa, prendiamo tutte le immagini, altrimenti solo quella attuale
        const galleryImages = property.images && property.images.length > 0 ? property.images : [property.main_image];

        try {
            const res = await fetch("http://localhost:8000/api/renovate", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: image,
                    gallery_images: galleryImages,
                    style: style,
                    prompt: style, // Importante inviarlo per matchare il modello Pydantic (anche se opzionale)
                    sqm: property.sqm,
                    mode: mode
                })
            });

            if (!res.ok) {
                // Debug in console se ancora errore
                console.error("Server Error:", await res.text());
                throw new Error("Failed to renovate");
            }

            const data = await res.json();

            // Fix URL relativi
            if (data.renovated_image_url.startsWith('/')) data.renovated_image_url = "http://localhost:8000" + data.renovated_image_url;
            if (data.renovated_gallery) {
                data.renovated_gallery = data.renovated_gallery.map((url: string) =>
                    url.startsWith('/') ? "http://localhost:8000" + url : url
                );
            }

            setResult(data);
            setSelectedRenovatedImage(data.renovated_image_url);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Determine what image to show
    // If comparing -> show original input image
    // Else -> show selected renovated image or default result
    const displayImage = isComparing
        ? image // Note: Ideally we should map original to renovated index, but for MVP showing the input is fine
        : (selectedRenovatedImage || image);

    return (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col md:flex-row animate-in fade-in duration-200">

            {/* LEFT: CANVAS */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden select-none">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60"><X size={20} /></button>

                {/* Mode Switcher */}
                <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-lg p-1 flex shadow-lg border border-white/20">
                    <button onClick={() => setMode('room')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'room' ? 'bg-[#00579E] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Square size={16} /> Solo Stanza</button>
                    <button onClick={() => setMode('house')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'house' ? 'bg-[#00579E] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Home size={16} /> Intera Casa</button>
                </div>

                {loading ? (
                    <div className="text-center">
                        <Wand2 className="w-16 h-16 text-[#E31B23] animate-spin mb-4 mx-auto" />
                        <p className="text-white font-medium animate-pulse">
                            {mode === 'house' ? 'Generazione simultanea ambienti...' : 'Ristrutturazione in corso...'}
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={displayImage} className="w-full h-full object-contain" alt="Renovation" draggable="false" />

                        {/* Compare Button */}
                        {result && (
                            <button
                                onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)}
                                onMouseLeave={() => setIsComparing(false)} onTouchStart={() => setIsComparing(true)} onTouchEnd={() => setIsComparing(false)}
                                className="absolute bottom-28 bg-white/20 backdrop-blur-md border border-white/40 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/30 active:scale-95 transition-all shadow-lg cursor-pointer select-none"
                            >
                                <Eye size={20} /> Tieni premuto per confrontare
                            </button>
                        )}

                        {/* Style Selector */}
                        {!result && (
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                                {['Modern', 'Industrial', 'Boho', 'Minimal'].map(s => (
                                    <button key={s} onClick={() => setStyle(s)} className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105 ${style === s ? 'bg-[#E31B23] text-white' : 'bg-white text-gray-800'}`}>{s}</button>
                                ))}
                            </div>
                        )}

                        {/* Generated Gallery (Real Images) */}
                        {result && result.renovated_gallery && result.renovated_gallery.length > 1 && (
                            <div className="absolute bottom-6 flex gap-2 overflow-x-auto px-4 max-w-full pb-2 scrollbar-hide">
                                {result.renovated_gallery.map((img: string, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedRenovatedImage(img)}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden shadow-lg cursor-pointer transition-all hover:scale-105 ${selectedRenovatedImage === img ? 'border-[#E31B23] scale-105' : 'border-white'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT: CONTROLS */}
            <div className="w-full md:w-[400px] border-l border-gray-200 bg-white p-6 flex flex-col overflow-y-auto">
                <div className="mb-6"><h3 className="text-xl font-bold text-[#00579E] flex items-center gap-2"><Wand2 size={20} /> Design & Preventivo</h3><p className="text-gray-500 text-sm">Stima basata su {mode === 'house' ? `intera superficie (${property.sqm}mq)` : 'singolo ambiente (~25mq)'}.</p></div>

                {!result ? (
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                            <span className="text-xs font-bold text-[#00579E] uppercase">Foto selezionata</span>
                            <img src={image} className="w-full h-32 object-cover rounded-lg mt-2 opacity-80" />
                        </div>
                        <button onClick={handleGenerate} className="w-full py-3 bg-[#E31B23] text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-all">Genera Preventivo {mode === 'house' ? 'Completo' : 'Stanza'}</button>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right">
                        <div className="bg-green-50 border border-green-100 p-5 rounded-xl mb-6">
                            <div className="flex items-center gap-2 text-green-800 font-bold uppercase text-xs tracking-wider mb-2"><Calculator size={14} /> Stima {mode === 'house' ? 'Chiavi in mano' : 'Parziale'}</div>
                            <div className="text-3xl font-bold text-gray-900">€{result.estimated_cost_min.toLocaleString()} - {result.estimated_cost_max.toLocaleString()}</div>
                            <p className="text-xs text-gray-500 mt-1">Stile {style} • {mode === 'house' ? 'Tutta la casa' : 'Solo questa stanza'}</p>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-[#00579E]">Preventivi Imprese Partner</h4>
                        <div className="space-y-3 mb-6">
                            {result.contractors.map((c: any, i: number) => (
                                <div key={i} className="border rounded-lg overflow-hidden bg-white transition-all hover:border-[#00579E]">
                                    <div onClick={() => setExpandedQuote(expandedQuote === i ? null : i)} className="flex justify-between items-center p-4 cursor-pointer bg-white hover:bg-gray-50">
                                        <div><div className="font-bold text-sm text-gray-800">{c.name}</div><div className="text-xs text-yellow-500 flex items-center gap-1">★★★★★ {c.rating}</div></div>
                                        <div className="flex items-center gap-3"><div className="font-bold text-sm text-[#E31B23]">€{c.price.toLocaleString()}</div><ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedQuote === i ? 'rotate-180' : ''}`} /></div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedQuote === i && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-gray-50 px-4 pb-4 text-xs text-gray-600 border-t border-gray-100">
                                                <div className="pt-3 space-y-2">
                                                    <div className="flex justify-between"><span>Tempistiche:</span> <span className="font-bold text-gray-800">{mode === 'house' ? '6-8 Settimane' : '1-2 Settimane'}</span></div>
                                                    <div className="flex justify-between"><span>Materiali:</span> <span className="font-bold text-gray-800">Inclusi (Capitolato {style})</span></div>
                                                    <div className="flex justify-between"><span>Garanzia:</span> <span className="font-bold text-gray-800">10 Anni</span></div>
                                                    <button className="w-full mt-3 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-100">Richiedi Sopralluogo Gratuito</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setResult(null)} className="w-full py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50">Nuova Simulazione</button>
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
    const [aiMessage, setAiMessage] = useState("Ciao! Dimmi cosa stai cercando oggi.");
    const [isLoading, setIsLoading] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Modal States
    const [showRenovation, setShowRenovation] = useState(false);
    const [showBooking, setShowBooking] = useState(false);
    const [contactFeedback, setContactFeedback] = useState<'phone' | 'email' | null>(null);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setCurrentImageIndex(0); }, [selectedProperty]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch(e as any);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setViewState('results');
        setIsLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });
            if (!response.ok) throw new Error("Server Error");
            const rawText = await response.text();
            const { text, properties: fetchedProps } = parseMessageContent(rawText);
            setAiMessage(text);
            setInput("");
            if (fetchedProps && fetchedProps.length > 0) {
                setProperties(fetchedProps);
            }
        } catch (error) {
            console.error(error);
            setAiMessage("C'è stato un piccolo problema tecnico, ma puoi riprovare.");
        } finally {
            setIsLoading(false);
        }
    };

    const activeImages = selectedProperty ? (selectedProperty.images && selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.main_image]) : [];
    const currentImageUrl = activeImages[currentImageIndex] || "/placeholder.jpg";

    return (
        <div className="relative w-full h-screen bg-slate-50 text-gray-900 font-sans flex flex-col overflow-hidden selection:bg-blue-100">
            {/* NAVBAR */}
            <nav className="w-full px-4 md:px-8 py-4 flex justify-between items-center bg-white shadow-sm z-30 relative border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="flex items-center font-bold text-2xl md:text-3xl tracking-tight text-[#00579E]">
                        <span>Immobil</span>
                        <span className="bg-[#00579E] text-white px-1 mx-0.5 rounded flex items-center justify-center">IA</span>
                        <span>re.it</span>
                    </div>
                </div>
                <div className="hidden md:flex gap-4 text-sm font-semibold text-gray-600">
                    <span className="cursor-pointer hover:text-[#00579E]">Pubblica annunci</span>
                    <span className="cursor-pointer hover:text-[#00579E]">Accedi</span>
                </div>
            </nav>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col relative pt-10 pb-32 overflow-y-auto scrollbar-hide">
                {/* AI BUBBLE */}
                <div className="px-4 mb-6 w-full max-w-2xl mx-auto z-20">
                    <motion.div layout className="bg-white border border-gray-200 shadow-xl rounded-2xl rounded-bl-none p-6 relative">
                        <div className="absolute -top-3 left-6 flex items-center gap-1 bg-[#00579E] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                            <Sparkles size={10} /> Assistant
                        </div>
                        {isLoading ? (
                            <div className="flex items-center gap-2 h-6">
                                <span className="text-sm font-medium text-gray-500">Sto cercando per te</span>
                                <div className="flex gap-1">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[#E31B23] rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#E31B23] rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#E31B23] rounded-full" />
                                </div>
                            </div>
                        ) : (
                            <p className="text-lg text-gray-700 leading-relaxed font-medium">{aiMessage}</p>
                        )}
                    </motion.div>
                </div>

                {/* EMPTY STATE */}
                {viewState === 'idle' && (
                    <div className="flex-1 flex flex-col items-center mt-10 opacity-30 pointer-events-none">
                        <Building size={60} className="text-gray-400 mb-4" />
                        <p className="text-xl font-bold text-gray-400">Cerca la tua prossima casa</p>
                    </div>
                )}

                {/* RESULTS SLIDER */}
                {viewState === 'results' && properties.length > 0 && (
                    <div className="w-full pl-4 md:pl-0 md:max-w-6xl md:mx-auto overflow-x-auto pb-10 pt-4 snap-x snap-mandatory flex gap-5 scrollbar-hide">
                        {properties.map((prop) => (
                            <motion.div
                                key={prop.id}
                                layoutId={`card-${prop.id}`}
                                onClick={() => setSelectedProperty(prop)}
                                whileHover={{ y: -8 }}
                                className="min-w-[85vw] md:min-w-[320px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer snap-center shrink-0 group hover:shadow-2xl transition-all"
                            >
                                <div className="h-56 relative overflow-hidden">
                                    <img src={prop.main_image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute top-3 left-3 bg-[#E31B23] text-white text-xs font-bold px-2 py-1 rounded shadow-sm">€ {prop.price.toLocaleString()}</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 line-clamp-2 text-lg leading-tight mb-2 h-14">{prop.title}</h3>
                                    <div className="flex text-sm text-gray-500 gap-3"><span>{prop.rooms} locali</span><span>{prop.sqm} mq</span><span>{prop.bathrooms} bagni</span></div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{prop.zone} <ArrowRight size={16} className="text-[#00579E]" /></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* INPUT AREA */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-40">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex items-end shadow-lg rounded-3xl bg-white border border-gray-300 focus-within:border-[#00579E] focus-within:ring-2 focus-within:ring-blue-50 transition-all overflow-hidden">
                        <textarea ref={textareaRef} rows={1} value={input} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Scrivi qui... (es. 'Attico zona Isola con terrazzo')" className="flex-1 py-4 pl-6 pr-14 outline-none text-gray-800 placeholder:text-gray-400 text-lg resize-none max-h-32 scrollbar-hide" style={{ minHeight: '60px' }} />
                        <button onClick={handleSearch} className="absolute right-2 bottom-2 p-3 bg-[#E31B23] text-white rounded-full hover:bg-red-700 transition-colors shadow-md mb-1"><Send size={20} /></button>
                    </div>
                </div>
            </div>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {selectedProperty && (
                    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-6 overflow-hidden">
                        <motion.div layoutId={`card-${selectedProperty.id}`} className="bg-white w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                            <button onClick={() => setSelectedProperty(null)} className="absolute top-4 right-4 z-[55] bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 text-gray-800"><X size={20} /></button>
                            {showRenovation && <RenovationPanel property={selectedProperty} image={currentImageUrl} onClose={() => setShowRenovation(false)} />}
                            {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
                            {contactFeedback && <ContactFeedbackModal type={contactFeedback} onClose={() => setContactFeedback(null)} />}

                            <div className="w-full md:w-[60%] h-[40vh] md:h-full relative bg-gray-100 group">
                                <img src={currentImageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                {activeImages.length > 1 && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i - 1 + activeImages.length) % activeImages.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md rounded-full"><ChevronLeft size={24} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % activeImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md rounded-full"><ChevronRight size={24} /></button>
                                    </>
                                )}
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div className="text-white"><p className="text-sm opacity-90">{currentImageIndex + 1} / {activeImages.length}</p></div>
                                    <button onClick={() => setShowRenovation(true)} className="bg-white text-[#00579E] px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-[#00579E] hover:text-white transition-all transform hover:scale-105">
                                        <Wand2 size={18} className="text-[#E31B23]" /> Ristruttura Foto
                                    </button>
                                </div>
                            </div>

                            <div className="w-full md:w-[40%] h-full bg-white flex flex-col overflow-y-auto">
                                <div className="p-6 md:p-8 border-b border-gray-100">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">{selectedProperty.title}</h1>
                                    <div className="flex items-center text-gray-500 mb-4"><MapPin size={16} className="mr-1" /> {selectedProperty.address || selectedProperty.city} • {selectedProperty.zone}</div>
                                    <div className="text-3xl font-bold text-[#E31B23]">€ {selectedProperty.price.toLocaleString()}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
                                    <div className="text-center"><div className="text-2xl font-bold text-gray-800">{selectedProperty.rooms}</div><div className="text-xs text-gray-400 uppercase font-semibold">Locali</div></div>
                                    <div className="text-center border-l border-gray-100"><div className="text-2xl font-bold text-gray-800">{selectedProperty.sqm}</div><div className="text-xs text-gray-400 uppercase font-semibold">Mq</div></div>
                                    <div className="text-center border-l border-gray-100"><div className="text-2xl font-bold text-gray-800">{selectedProperty.bathrooms}</div><div className="text-xs text-gray-400 uppercase font-semibold">Bagni</div></div>
                                </div>
                                <div className="p-6 bg-white">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Caratteristiche</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FeatureBadge icon={ArrowUpDown} label="Piano" value={selectedProperty.floor ? `${selectedProperty.floor}°` : "N.D."} />
                                        <FeatureBadge icon={Building} label="Ascensore" value={selectedProperty.elevator ? "Sì" : "No"} />
                                        <FeatureBadge icon={Thermometer} label="Riscaldamento" value={selectedProperty.specs?.heating || "Autonomo"} />
                                        <FeatureBadge icon={CheckCircle} label="Stato" value={selectedProperty.specs?.contract || "Buono"} />
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-50 border-t border-b border-blue-100">
                                    <div className="flex items-center gap-2 mb-2 text-[#00579E] font-bold text-xs uppercase tracking-wider"><Sparkles size={14} /> Descrizione AI</div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{selectedProperty.description_ai || selectedProperty.description_original}</p>
                                </div>
                                <div className="mt-auto p-6 bg-white border-t border-gray-200 sticky bottom-0 space-y-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><User className="text-gray-500" size={20} /></div>
                                        <div><div className="text-xs text-gray-500 uppercase font-bold">Inserzionista</div><div className="font-bold text-gray-900 text-sm">Agenzia Immobiliare Milano</div></div>
                                    </div>
                                    <button onClick={() => setShowBooking(true)} className="w-full py-3 bg-[#00579E]/10 text-[#00579E] border border-[#00579E]/20 font-bold rounded-lg hover:bg-[#00579E]/20 transition-colors flex items-center justify-center gap-2"><CalendarIcon size={18} /> RICHIEDI VISITA (Calendario)</button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setContactFeedback('phone')} className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#E31B23] text-[#E31B23] font-bold rounded-lg hover:bg-red-50 transition-colors"><Phone size={18} /> Mostra Tel</button>
                                        <button onClick={() => setContactFeedback('email')} className="flex items-center justify-center gap-2 py-3 bg-[#E31B23] text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"><Mail size={18} /> Contatta</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}