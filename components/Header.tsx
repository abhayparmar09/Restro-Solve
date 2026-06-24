import React from 'react';
import { Utensils, LogOut } from 'lucide-react';
import { ViewType, Language, StaffRole } from '../types';

interface HeaderProps {
    view: ViewType;
    lang: Language;
    setLang: (lang: Language) => void;
    setView: (view: ViewType) => void;
    setStaffRole: (role: StaffRole) => void;
    tableNumber: string;
    handleLongPressStart: () => void;
    handleLongPressEnd: () => void;
}

const Header: React.FC<HeaderProps> = ({
    view,
    lang,
    setLang,
    setView,
    setStaffRole,
    tableNumber,
    handleLongPressStart,
    handleLongPressEnd,
}) => {
    return (
        <header className="flex-none text-white px-5 py-4 shadow-lg flex items-center justify-between h-[64px] bg-[#006638] z-[100] no-print">
            <div className="flex items-center gap-4">
                <Utensils size={24} className="text-white" />
                <h1 className="text-xl font-bold tracking-tight"> Restaurant & Cafe</h1>
            </div>
            <div className="flex items-center gap-3">
                {view === 'CUSTOMER' && (
                    <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-transform active:scale-95">{lang}</button>
                )}
                {view !== 'CUSTOMER' ? (
                    <button onClick={() => { setView('CUSTOMER'); setStaffRole('NONE'); }} className="bg-white/10 p-2.5 rounded-xl text-white hover:bg-white/20 transition-all active:scale-90"><LogOut size={20} /></button>
                ) : (
                    <div onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd} onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} className="bg-white text-[#006638] px-3 py-1.5 rounded-xl font-black text-sm shadow-sm cursor-help select-none active:bg-emerald-50 transition-colors">T-{tableNumber}</div>
                )}
            </div>
        </header>
    );
};

export default Header;
