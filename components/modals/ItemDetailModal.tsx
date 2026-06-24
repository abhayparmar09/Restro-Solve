import React from 'react';
import { X, Clock, Flame } from 'lucide-react';
import { MenuItem, Language } from '../../types';

interface ItemDetailModalProps {
    item: MenuItem | null;
    onClose: () => void;
    lang: Language;
    addToCart: (item: MenuItem) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, lang, addToCart }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col justify-end z-[2000] animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-t-[48px] w-full max-w-md mx-auto h-[85vh] shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="h-[40%] relative overflow-hidden shrink-0">
                    <img
                        src={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800';
                        }}
                    />
                    <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-black/30 backdrop-blur-md rounded-2xl text-white active:scale-90 transition-all"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6 touch-pan-y">
                    <div className="flex items-center justify-between gap-4"><h2 className="text-[28px] font-black text-slate-900 leading-tight">{item.name[lang]}</h2><p className="text-2xl font-black text-[#006638]">₹{item.price}</p></div>
                    <p className="text-slate-500 font-medium text-[15px] leading-relaxed">{item.description[lang]}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex flex-col gap-1"><Clock size={16} className="text-slate-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span><span className="text-xs font-bold text-slate-800">15-20 Mins</span></div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex flex-col gap-1"><Flame size={16} className="text-rose-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spice Level</span><span className="text-xs font-bold text-slate-800">Medium</span></div>
                    </div>
                </div>
                <div className="p-8 pt-0 bg-white shrink-0"><button onClick={() => { addToCart(item); onClose(); }} className="w-full bg-[#006638] text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-3">Add to Selection</button></div>
            </div>
        </div>
    );
};

export default ItemDetailModal;
