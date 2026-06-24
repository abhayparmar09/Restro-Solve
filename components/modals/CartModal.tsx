import React from 'react';
import { ShoppingBag, X, Minus, Plus, ArrowRight } from 'lucide-react';
import { CartItem, Language } from '../../types';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    lang: Language;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    calculations: { total: number };
    handleInitialCheckout: () => void;
}

const CartModal: React.FC<CartModalProps> = ({
    isOpen,
    onClose,
    cart,
    lang,
    addToCart,
    removeFromCart,
    calculations,
    handleInitialCheckout,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col justify-end z-[2000] animate-fade-in" onClick={onClose}>
            <div className="bg-[#F8FAFC] rounded-t-[48px] w-full max-w-md mx-auto h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 shrink-0"><div><h3 className="text-xl font-black text-[#006638] uppercase">Cart Items</h3><p className="text-[10px] font-bold text-slate-300 uppercase mt-0.5">{cart.length} delicacies</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:bg-rose-50 transition-all"><X size={24} /></button></div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 touch-pan-y">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                            <img
                                src={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800'}
                                className="w-16 h-16 rounded-2xl object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800';
                                }}
                            />
                            <div className="flex-1"><h4 className="font-black text-[11px] text-slate-800 line-clamp-1 uppercase">{item.name[lang]}</h4><p className="text-[#006638] font-black text-sm mt-1">₹{item.price * item.quantity}</p></div>
                            <div className="flex items-center gap-2.5 bg-emerald-50 p-1.5 rounded-2xl"><button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-white text-[#006638] flex items-center justify-center rounded-xl shadow-sm"><Minus size={14} /></button><span className="w-4 text-center font-black text-[#006638]">{item.quantity}</span><button onClick={() => addToCart(item)} className="w-8 h-8 bg-[#006638] text-white flex items-center justify-center rounded-xl shadow-md"><Plus size={14} /></button></div>
                        </div>
                    ))}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col items-center mt-4"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Grand Total</p><h4 className="text-3xl font-black text-[#006638]">₹{calculations.total}</h4></div>
                </div>
                <div className="p-6 bg-white border-t border-slate-100 shrink-0"><button onClick={handleInitialCheckout} className="w-full bg-[#006638] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-xs">Proceed to Order</button></div>
            </div>
        </div>
    );
};

export default CartModal;
