import React from 'react';
import { Utensils, Navigation } from 'lucide-react';
import { ViewType } from '../types';
import { TRANSLATIONS } from '../locales';

interface FooterProps {
    view: ViewType;
    customerTab: 'MENU' | 'MY_ORDERS';
    setCustomerTab: (tab: 'MENU' | 'MY_ORDERS') => void;
    lang: 'en' | 'hi';
    activeOrderIds: string[];
}

const Footer: React.FC<FooterProps> = ({
    view,
    customerTab,
    setCustomerTab,
    lang,
    activeOrderIds,
}) => {
    const t = TRANSLATIONS[lang];

    return (
        <footer className="fixed bottom-0 left-0 w-full md:static md:w-auto flex-none bg-white border-t border-slate-100 h-[80px] flex justify-around items-center px-12 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[999] no-print pb-safe backdrop-blur-md bg-white/95">


            {view === 'CUSTOMER' ? (
                <>
                    <button onClick={() => setCustomerTab('MENU')} className={`flex flex-col items-center gap-1.5 transition-all active:scale-95 focus:outline-none focus:ring-0 active:outline-none ${customerTab === 'MENU' ? 'text-[#006638]' : 'text-slate-300'}`}>
                        <div className={`p-2 rounded-xl transition-colors ${customerTab === 'MENU' ? 'bg-emerald-50' : ''}`}><Utensils size={24} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{t.menu}</span>
                    </button>
                    <button onClick={() => setCustomerTab('MY_ORDERS')} className={`flex flex-col items-center gap-1.5 relative transition-all active:scale-95 focus:outline-none focus:ring-0 active:outline-none ${customerTab === 'MY_ORDERS' ? 'text-[#006638]' : 'text-slate-300'}`}>
                        <div className={`p-2 rounded-xl transition-colors ${customerTab === 'MY_ORDERS' ? 'bg-emerald-50' : ''}`}><Navigation size={24} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Track</span>
                        {activeOrderIds.length > 0 && <div className="absolute top-0 right-0 w-4 h-4 bg-[#006638] rounded-full text-[8px] flex items-center justify-center font-black text-white border border-white">{activeOrderIds.length}</div>}
                    </button>
                </>
            ) : (
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Staff Interface Active</div>
            )}
        </footer>














    );
};

export default Footer;
