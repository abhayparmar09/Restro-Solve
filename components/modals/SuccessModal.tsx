import React from 'react';
import { CheckCircle } from 'lucide-react';
import { CheckoutStep } from '../../types';

interface SuccessModalProps {
    step: CheckoutStep;
    closeSuccessAndTrack: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ step, closeSuccessAndTrack }) => {
    // [NEW] Auto-redirect after 3 seconds
    React.useEffect(() => {
        if (step === 'SUCCESS') {
            const timer = setTimeout(() => {
                closeSuccessAndTrack();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, closeSuccessAndTrack]);

    if (step !== 'SUCCESS') return null;

    return (
        <div className="fixed inset-0 z-[5000] bg-white animate-fade-in flex flex-col items-center justify-center text-center p-10"><div className="w-32 h-32 bg-emerald-100 rounded-[48px] flex items-center justify-center text-[#006638] mb-10 animate-scale-in shadow-xl shadow-emerald-200 border border-emerald-200"><CheckCircle size={64} strokeWidth={3} /></div><h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Order Placed</h2><p className="text-slate-500 font-bold mb-12 text-lg leading-relaxed">Your order has been sent to our master chefs.</p><button onClick={closeSuccessAndTrack} className="w-full max-w-xs bg-[#006638] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-xs">Track My Meal</button></div>
    );
};

export default SuccessModal;
