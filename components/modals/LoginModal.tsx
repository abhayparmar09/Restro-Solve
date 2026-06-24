import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { StaffRole, ViewType } from '../../types';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    setStaffRole: (role: StaffRole) => void;
    setView: (view: ViewType) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, setStaffRole, setView }) => {
    const [pin, setPin] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[4000] flex items-center justify-center p-8" onClick={onClose}>
            <div className="bg-white rounded-[60px] w-full max-w-sm p-12 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-50 w-20 h-20 rounded-[32px] flex items-center justify-center text-[#006638] mx-auto mb-8"><Lock size={32} /></div>
                <h2 className="text-2xl font-black text-slate-900 text-center mb-10 uppercase tracking-tighter">Staff Auth</h2>
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(num => (
                        <button key={num} onClick={() => {
                            if (num === 'OK' && pin === '8888') {
                                setStaffRole('MANAGER');
                                setView('ADMIN');
                                onClose();
                                setPin('');
                            } else if (num === 'OK' && pin === '1234') {
                                setStaffRole('STAFF');
                                setView('KITCHEN');
                                onClose();
                                setPin('');
                            } else if (num === 'C') {
                                setPin('');
                            } else if (typeof num === 'number' && pin.length < 4) {
                                setPin(p => p + num);
                            }
                        }} className={`h-16 rounded-[24px] text-xl font-black shadow-sm ${num === 'OK' ? 'bg-[#006638] text-white' : num === 'C' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-800 active:bg-slate-100'}`}>{num}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
