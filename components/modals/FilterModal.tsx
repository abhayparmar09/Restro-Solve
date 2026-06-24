import React from 'react';
import { X, CheckCircle, ArrowUpNarrowWide } from 'lucide-react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    vegOnly: boolean;
    setVegOnly: (veg: boolean) => void;
    sortBy: 'NONE' | 'LOW_TO_HIGH' | 'HIGH_TO_LOW';
    setSortBy: (sort: 'NONE' | 'LOW_TO_HIGH' | 'HIGH_TO_LOW') => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen, onClose, vegOnly, setVegOnly, sortBy, setSortBy
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 flex flex-col justify-end animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-t-[40px] w-full max-w-md mx-auto p-12 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-10 text-2xl font-black text-[#006638] tracking-tighter uppercase"><h3>Filters</h3><button onClick={onClose} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={28} /></button></div>
                <div className="space-y-4">
                    <button onClick={() => { setVegOnly(!vegOnly); onClose(); }} className={`w-full p-7 rounded-[32px] border-2 font-black uppercase tracking-widest transition-all text-xs flex justify-between items-center ${vegOnly ? 'border-[#006638] bg-emerald-50 text-[#006638]' : 'border-slate-50 text-slate-400 bg-slate-50/50'}`}>Pure Veg Only {vegOnly && <CheckCircle size={18} />}</button>
                    {[{ id: 'LOW_TO_HIGH', label: 'Price: Low to High' }, { id: 'HIGH_TO_LOW', label: 'Price: High to Low' }].map(opt => (<button key={opt.id} onClick={() => { setSortBy(opt.id as any); onClose(); }} className={`w-full p-7 rounded-[32px] border-2 font-black uppercase tracking-widest transition-all text-xs flex justify-between items-center ${sortBy === opt.id ? 'border-[#006638] bg-emerald-50 text-[#006638]' : 'border-slate-50 text-slate-400 bg-slate-50/50'}`}>{opt.label} {sortBy === opt.id && <ArrowUpNarrowWide size={18} />}</button>))}
                </div>
                <button onClick={() => { setSortBy('NONE'); setVegOnly(false); onClose(); }} className="w-full mt-10 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Clear Preferences</button>
            </div>
        </div>
    );
};

export default FilterModal;
