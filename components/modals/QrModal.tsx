import React from 'react';
import { QrCode, Download as DownloadIcon } from 'lucide-react';

interface QrModalProps {
    tableNumber: string | null;
    onClose: () => void;
    systemBaseUrl: string;
}

const QrModal: React.FC<QrModalProps> = ({ tableNumber, onClose, systemBaseUrl }) => {
    if (!tableNumber) return null;

    const generateQrUrl = (tableNum: string) => {
        const url = new URL(systemBaseUrl);
        url.searchParams.set('table', tableNum);
        return url.toString();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6 z-[3000] animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[60px] w-full max-w-sm p-10 shadow-2xl animate-scale-in text-center flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#006638] mb-6"><QrCode size={32} /></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Table {tableNumber} QR</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Scan this code to order from this table</p>
                <div className="bg-white p-6 rounded-[48px] border-4 border-slate-50 shadow-inner mb-10 group relative"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generateQrUrl(tableNumber))}&color=006638&bgcolor=FFFFFF&margin=1`} alt={`QR for Table ${tableNumber}`} className="w-48 h-48 rounded-2xl" /></div>
                <div className="w-full space-y-3"><button onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(generateQrUrl(tableNumber))}`, '_blank')} className="w-full py-5 bg-[#006638] text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><DownloadIcon size={18} /> Download QR</button><button onClick={onClose} className="w-full py-5 bg-slate-50 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">Close</button></div>
            </div>
        </div>
    );
};

export default QrModal;
