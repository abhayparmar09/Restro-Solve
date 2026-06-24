import React from 'react';
import { Printer } from 'lucide-react';
import ThermalReceipt from '../ThermalReceipt';
import { Order } from '../../types';

interface HistoryModalProps {
    order: Order | null;
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ order, onClose }) => {
    if (!order) return null;

    const handlePrintReceipt = () => { window.print(); };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[3000] animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm flex flex-col items-center animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-full">
                    <ThermalReceipt order={order} />
                </div>
                <div className="mt-8 flex gap-4 w-full no-print">
                    <button onClick={onClose} className="flex-1 bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm">Close</button>
                    <button onClick={handlePrintReceipt} className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Printer size={18} /> Print</button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
