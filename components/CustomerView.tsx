import React, { useEffect, useState } from 'react';
import { User, Sparkles, Search, Filter, History, Printer } from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { MenuItem, Order, Category, CartItem, Language } from '../types';
import { CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../locales';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const VegIcon = () => (
    <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-0.5 rounded-sm shrink-0">
        <div className="w-full h-full bg-emerald-600 rounded-full"></div>
    </div>
);

interface CustomerViewProps {
    customerTab: 'MENU' | 'MY_ORDERS';
    tableNumber: string;
    customerName: string;
    phoneNumber?: string;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    isFilterModalOpen: boolean;
    setIsFilterModalOpen: (isOpen: boolean) => void;
    selectedCategory: Category | 'All';
    setSelectedCategory: (c: Category | 'All') => void;
    filteredMenu: MenuItem[];
    cart: CartItem[];
    addToCart: (item: MenuItem) => void;
    setSelectedDetailItem: (item: MenuItem) => void;
    lang: Language;
    onViewBill: (order: Order) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({
    customerTab,
    tableNumber,
    customerName,
    phoneNumber,
    searchQuery,
    setSearchQuery,
    setIsFilterModalOpen,
    selectedCategory,
    setSelectedCategory,
    filteredMenu,
    cart,
    addToCart,
    setSelectedDetailItem,
    lang,
    onViewBill
}) => {
    const t = TRANSLATIONS[lang];
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const effectivePhone = phoneNumber || localStorage.getItem('s3_customer_phone');

        if (!effectivePhone) {
            setOrders([]);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'orders'),
            where('customerPhone', '==', effectivePhone)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order)).sort((a, b) => {
                const getMillis = (t: any) => t?.toMillis ? t.toMillis() : (t || 0);
                return getMillis(b.timestamp) - getMillis(a.timestamp);
            });
            setOrders(fetchedOrders);
            setLoading(false);
        }, (err) => {
            console.error("Firestore Error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [phoneNumber]);

    return (
        <div className="max-w-md mx-auto min-h-full bg-[#F8FAFC] no-print pb-40">
            {customerTab === 'MENU' ? (
                <>
                    <div className="bg-white px-5 py-6 flex items-center justify-between border-b border-slate-100 shadow-sm">

                        <div className="flex items-center gap-3">
                            <div className="bg-[#006638] p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-200"><User size={22} /></div>
                            <div>
                                <p className="text-[11px] font-black text-[#006638] uppercase tracking-wide">Dining at S3</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Table {tableNumber} • {customerName || 'Welcome'}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl"><Sparkles size={18} className="text-[#006638]" /></div>
                    </div>
                    <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[90] shadow-sm border-b border-slate-50 px-4 pt-4 pb-2">
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 bg-slate-50 rounded-2xl px-5 flex items-center gap-3 border border-slate-100 focus-within:border-[#006638] transition-colors group">
                                <Search size={18} className="text-slate-400 group-focus-within:text-[#006638]" />
                                <input placeholder={t.searchMenu} className="bg-transparent text-sm font-bold w-full h-12 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <button onClick={() => setIsFilterModalOpen(true)} className="p-3 rounded-2xl border bg-slate-50 border-slate-100 text-slate-600 active:scale-95 transition-transform"><Filter size={20} /></button>
                        </div>
                        <div className="pb-4 overflow-x-auto no-scrollbar flex items-center gap-2">
                            <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${selectedCategory === 'All' ? 'bg-[#006638] text-white border-[#006638]' : 'bg-white text-slate-400 border-slate-100'}`}>{t.allCategories}</button>
                            {CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedCategory === cat ? 'bg-[#006638] text-white border-[#006638]' : 'bg-white text-slate-400 border-slate-100'}`}>{cat}</button>))}
                        </div>
                    </div>
                    <div className="px-4 py-6 grid grid-cols-2 gap-4">
                        {filteredMenu.map(item => {
                            const inCart = cart.find(i => i.id === item.id);
                            const isVeg = item.dietType === 'veg' || item.dietType === 'vegan' || item.isVeg;
                            const isEgg = item.dietType === 'egg';

                            return (
                                <div key={item.id} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col active:scale-[0.98] transition-all hover:shadow-md cursor-pointer" onClick={() => setSelectedDetailItem(item)}>
                                    <div className="h-36 bg-slate-100 relative group">
                                        <img
                                            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800'}
                                            alt={typeof item.name === 'object' ? item.name.en : item.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800';
                                            }}
                                        />
                                        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100">
                                            {/* Diet Icon */}
                                            <div className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-sm shrink-0 ${isVeg ? 'border-emerald-600' : isEgg ? 'border-amber-500' : 'border-rose-600'}`}>
                                                <div className={`w-full h-full rounded-full ${isVeg ? 'bg-emerald-600' : isEgg ? 'bg-amber-500' : 'bg-rose-600'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <h3 className="text-[13px] font-black leading-tight text-slate-800 line-clamp-2 min-h-[2.5rem]">
                                                {typeof item.name === 'object' ? (item.name[lang] || item.name['en']) : item.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate">
                                                {typeof item.name === 'object' ? (item.name[lang === 'en' ? 'hi' : 'en']) : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm font-black text-[#006638]">₹{item.price}</p>
                                            <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${inCart ? 'bg-emerald-50 text-[#006638] border-emerald-100' : 'bg-slate-50 text-slate-800 border-slate-100'}`}>
                                                {inCart ? `${inCart.quantity} ${t.added}` : t.add}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="p-6 pt-10 text-center bg-[#F8FAFC]">
                    <h2 className="text-3xl font-black mb-8 tracking-tight text-[#006638]">Your Orders</h2>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center animate-pulse">
                            <div className="w-8 h-8 border-2 border-[#006638] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-12 flex flex-col items-center animate-fade-in">
                            <History size={48} className="mb-4 text-slate-200" />
                            <p className="font-black uppercase tracking-widest text-xs text-slate-400 mb-2">No active orders</p>
                            <p className="text-[10px] text-slate-300 max-w-[200px] mb-6">Start ordering delicious food!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.filter(o => o.status !== 'AWAITING_PAYMENT' && o.status !== 'Awaiting Payment').map(o => {
                                const steps = [
                                    { status: 'PENDING', label: 'PENDING', color: 'bg-orange-500' },
                                    { status: 'PREPARING', label: 'PREPARING', color: 'bg-blue-500' },
                                    { status: 'READY', label: 'READY', color: 'bg-emerald-500' },
                                    { status: 'SERVED', label: 'SERVED', color: 'bg-green-600' }
                                ];

                                let activeIndex = 0;
                                const currentStatus = (o.status || '').toUpperCase();

                                if (currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') activeIndex = 0;
                                if (currentStatus === 'PREPARING') activeIndex = 1;
                                if (currentStatus === 'READY') activeIndex = 2;
                                if (currentStatus === 'SERVED' || currentStatus === 'COMPLETED') activeIndex = 3;

                                const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'CANCELLED PAYMENT';
                                const isPaymentFailed = o.paymentStatus === 'Failed';

                                return (
                                    <div key={o.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left animate-scale-in">
                                        {/* Header */}
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest">#{o.id.slice(-6).toUpperCase()}</span>
                                            <span className="bg-slate-900 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase">
                                                Table {o.tableNumber}
                                            </span>
                                        </div>

                                        {!isCancelled && !isPaymentFailed ? (
                                            <>
                                                {/* Stepper */}
                                                <div className="flex items-center justify-between relative mb-8 px-2">
                                                    <div className="absolute top-1.5 left-0 right-0 h-[2px] bg-slate-100 z-0 mx-2"></div>

                                                    {steps.map((step, idx) => {
                                                        const isCompleted = idx <= activeIndex;
                                                        const isActive = idx === activeIndex;

                                                        return (
                                                            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isCompleted ? step.color : 'bg-slate-200'
                                                                    } ${isActive ? 'ring-4 ring-offset-1 ring-slate-100 animate-pulse scale-125' : ''}`}></div>

                                                                {isActive && (
                                                                    <span className="absolute top-6 text-[9px] font-black uppercase tracking-widest text-slate-800 whitespace-nowrap">
                                                                        {step.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Footer: Payment & Bill */}
                                                <div className="flex items-end justify-between border-t border-slate-50 pt-4 mt-2">
                                                    <div>
                                                        {(o.paymentMethod?.toUpperCase() === 'CASH') && !o.isPaid ? (
                                                            <div className="flex items-center gap-2 text-rose-500">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                                                <span className="text-[10px] font-black uppercase tracking-wide">Payment Pending (Cash)</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-emerald-600">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                                                <span className="text-[10px] font-black uppercase tracking-wide">Payment Completed</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Smart Unlock Logic: Unlock if status is COMPLETED OR if it's already Paid */}
                                                    {(o.isPaid || currentStatus === 'COMPLETED') ? (
                                                        <button
                                                            onClick={() => onViewBill(o)}
                                                            className="text-[10px] font-black text-slate-900 border-b border-slate-900 pb-0.5 uppercase tracking-widest hover:text-[#006638] hover:border-[#006638] transition-all"
                                                        >
                                                            View Bill • ₹{o.total}
                                                        </button>
                                                    ) : (
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide text-right max-w-[150px] leading-tight">
                                                            Bill available after payment
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-rose-50 rounded-xl p-3 text-center">
                                                <p className="text-rose-500 font-black uppercase tracking-widest text-[10px]">
                                                    {isPaymentFailed ? '❌ Payment Failed' : '❌ Order Cancelled'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div >
                    )
                    }
                </div >
            )}
        </div >

    );
};

export default CustomerView;
