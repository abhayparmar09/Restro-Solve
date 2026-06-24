import React, { useState, useEffect } from 'react';
import { ChefHat, Volume2, VolumeX } from 'lucide-react';
import { Order, OrderStatus } from '../types';

const KitchenOrderTimer = ({ timestamp }: { timestamp: number }) => {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const update = () => {
            const diff = Math.floor((Date.now() - timestamp) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            setElapsed(`${m}:${s.toString().padStart(2, '0')}`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [timestamp]);
    return <span className="font-mono text-sm">{elapsed}</span>;
};

interface KitchenDisplayProps {
    orders: Order[];
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (enabled: boolean) => void;
    updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
    onCompleteCashOrder: (orderId: string) => void;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
    orders,
    isVoiceEnabled,
    setIsVoiceEnabled,
    updateOrderStatus,
    onCompleteCashOrder
}) => {
    const statusConfig: Record<string, { label: string; next: OrderStatus; color: string; badgeClass: string }> = {
        PENDING: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
        CONFIRMED: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        PREPARING: { label: '🔔 MARK AS READY', next: OrderStatus.READY, color: 'bg-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
        READY: { label: '🏃 MARK AS SERVED', next: OrderStatus.SERVED, color: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        SERVED: { label: '💰 RECEIVE CASH & COMPLETE', next: OrderStatus.COMPLETED, color: 'bg-[#006638]', badgeClass: 'bg-[#006638]/10 text-[#006638] border-[#006638]/30' },
    };

    const activeOrders = orders.filter(o => {
        const s = String(o?.status ?? '').toUpperCase();
        return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'].includes(s);
    });

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in pb-32">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-[#006638] flex items-center gap-3"><ChefHat size={28} /> Kitchen Display</h2>
                    <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isVoiceEnabled ? 'bg-emerald-100 text-[#006638]' : 'bg-slate-100 text-slate-400'}`}>
                        {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {isVoiceEnabled ? 'Voice Alerts On' : 'Voice Alerts Off'}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeOrders.map(o => {
                    const currentStatus = (o.status != null && o.status !== '') ? String(o.status).toUpperCase() : 'PENDING';
                    // Dynamic Config mainly for SERVED state
                    let config = statusConfig[currentStatus];
                    const docId = o.firebaseDocId || o.id;
                    const isCashUnpaid = currentStatus === 'SERVED' && (o.paymentMethod === 'Cash' || o.paymentMethod === 'CASH') && !o.isPaid;
                    const isOnlinePaid = (o.paymentMethod !== 'Cash' && o.paymentMethod !== 'CASH');

                    // Override label for Cash Lock
                    if (isCashUnpaid && config) {
                        config = { ...config, label: `💰 RECEIVE ₹${o.total} CASH` };
                    }

                    return (
                        <div key={o.id} className={`bg-white rounded-[40px] border-2 border-slate-100 p-6 flex flex-col shadow-sm animate-scale-in ${isCashUnpaid ? 'ring-4 ring-rose-500/20 animate-pulse' : ''}`}>
                            {isCashUnpaid && (
                                <div className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-1 absolute top-0 left-0 right-0 rounded-t-[38px] z-10">
                                    Collet Cash Before Completing
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4 mt-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-3xl font-black text-[#006638]">T-{o.tableNumber}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${o.paymentMethod === 'CASH' || o.paymentMethod === 'Cash' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {o.paymentMethod}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.customerName}</p>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ORD-{o.id.slice(-4)}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${config ? config.badgeClass : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{o.status}</span>
                                    <KitchenOrderTimer timestamp={o.timestamp} />
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="flex-1 space-y-3 mb-6 border-t border-dashed border-slate-100 pt-4">
                                {o.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <div className="flex gap-3 items-center">
                                            <span className="font-black text-[#006638] w-6 h-6 bg-emerald-50 flex items-center justify-center rounded-lg">{it.quantity}x</span>
                                            <span className="font-bold text-slate-800">{it.name.en}</span>
                                        </div>
                                        <span className="font-bold text-slate-500">₹{it.price * it.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Financials Trigger */}
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    <span>Subtotal</span>
                                    <span>₹{o.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    <span>Tax (5%)</span>
                                    <span>₹{o.tax}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-1">
                                    <span>Total</span>
                                    <span>₹{o.total}</span>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex flex-col gap-3 mt-auto">
                                {(() => {
                                    const nextStep: Record<string, { label: string; next: OrderStatus; color: string }> = {
                                        PENDING: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-amber-500' },
                                        CONFIRMED: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-emerald-600' },
                                        PREPARING: { label: '🔔 MARK AS READY', next: OrderStatus.READY, color: 'bg-blue-600' },
                                        READY: { label: '🏃 MARK AS SERVED', next: OrderStatus.SERVED, color: 'bg-emerald-500' },
                                        SERVED: { label: '✅ COMPLETE ORDER', next: OrderStatus.COMPLETED, color: 'bg-[#006638]' }
                                    };

                                    const step = nextStep[currentStatus];
                                    const isCashOrder = (o.paymentMethod === 'Cash' || o.paymentMethod === 'CASH');
                                    const isUnpaid = !o.isPaid;
                                    const isServed = currentStatus === 'SERVED';

                                    // 1. Food Status Button (Standard Flow)
                                    if (step) {
                                        // Lock "Complete" if Unpaid Cash
                                        const isLocked = isServed && isCashOrder && isUnpaid;

                                        return (
                                            <button
                                                onClick={() => {
                                                    if (isLocked) {
                                                        alert("Please collect cash payment before completing the order.");
                                                        return;
                                                    }
                                                    console.log('Updating order:', o.id, 'to status:', step.next);
                                                    updateOrderStatus(docId, step.next);
                                                }}
                                                disabled={isLocked}
                                                className={`w-full py-4 ${isLocked ? 'bg-slate-300 cursor-not-allowed' : step.color} text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 hover:opacity-90`}
                                            >
                                                {isLocked ? '⚠️ Awaiting Payment' : step.label}
                                            </button>
                                        );
                                    }

                                    // Fallback for unknown status
                                    return (
                                        <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-xs text-center border border-slate-200">
                                            {o.status}
                                        </div>
                                    );
                                })()}

                                {/* 2. Separate Cash Button (Only for Unpaid Cash Orders) */}
                                {((o.paymentMethod === 'Cash' || o.paymentMethod === 'CASH') && !o.isPaid) && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Confirm CASH receipt of ₹${o.total}?`)) {
                                                onCompleteCashOrder(docId);
                                            }
                                        }}
                                        className="w-full py-3 bg-white text-rose-500 border-2 border-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm animate-pulse flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"
                                    >
                                        💰 RECEIVE CASH (₹{o.total})
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KitchenDisplay;
