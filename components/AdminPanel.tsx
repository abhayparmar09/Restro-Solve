import React from 'react';
import {
    LayoutDashboard, ChefHat, Utensils, Grid, History, DollarSign, TrendingUp, ShoppingBag, Table as TableIcon, Trash2, Plus, Link as LinkIcon, Copy, QrCode, Calendar, Receipt
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { Order, OrderStatus, MenuItem } from '../types';
import { restoreMenu } from '../utils/restoreMenu';

interface AdminPanelProps {
    adminTab: 'OVERVIEW' | 'LIVE_ORDERS' | 'MENU_MGMT' | 'TABLE_MGMT' | 'HISTORY';
    setAdminTab: (tab: 'OVERVIEW' | 'LIVE_ORDERS' | 'MENU_MGMT' | 'TABLE_MGMT' | 'HISTORY') => void;
    stats: {
        revenue: number;
        profit: number;
        totalOrders: number;
        activeTablesCount: number;
        dailyData: { name: string; sales: number }[];
    };
    orders: Order[];
    updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
    updatePaymentStatus: (orderId: string, status: 'Paid' | 'Unpaid') => void;
    menu: MenuItem[];
    setIsAddMenuModalOpen: (isOpen: boolean) => void;
    toggleItemAvailability: (id: string) => void;
    deleteMenuItem: (id: string) => void;
    tables: string[];
    systemBaseUrl: string;
    setSystemBaseUrl: (url: string) => void;
    addTable: () => void;
    setSelectedTableForQr: (table: string | null) => void;
    removeTable: (table: string) => void;
    historyDateFilter: string;
    setHistoryDateFilter: (date: string) => void;
    filteredHistoryOrders: Order[];
    setSelectedHistoryOrder: (order: Order | null) => void;
    historyHasMore?: boolean;
    loadMoreHistory?: () => void;
    historyLoading?: boolean;
    onCompleteCashOrder: (orderId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
    adminTab,
    setAdminTab,
    stats,
    orders,
    updateOrderStatus,
    updatePaymentStatus,
    menu,
    setIsAddMenuModalOpen,
    toggleItemAvailability,
    deleteMenuItem,
    tables,
    systemBaseUrl,
    setSystemBaseUrl,
    addTable,
    setSelectedTableForQr,
    removeTable,
    historyDateFilter,
    setHistoryDateFilter,
    filteredHistoryOrders,
    setSelectedHistoryOrder,
    historyHasMore,
    loadMoreHistory,
    historyLoading,
    historyStartDate,
    setHistoryStartDate,
    historyEndDate,
    setHistoryEndDate,
    onCompleteCashOrder,
}) => {
    return (
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 animate-fade-in text-slate-900 pb-32">
            <div className="flex overflow-x-auto no-scrollbar gap-4 mb-8 bg-white p-2 rounded-3xl border border-slate-100 sticky top-0 z-50">
                {[{ id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard size={18} /> }, { id: 'LIVE_ORDERS', label: 'Orders', icon: <ChefHat size={18} /> }, { id: 'MENU_MGMT', label: 'Menu', icon: <Utensils size={18} /> }, { id: 'TABLE_MGMT', label: 'Tables', icon: <Grid size={18} /> }, { id: 'HISTORY', label: 'History', icon: <History size={18} /> }].map(tab => (
                    <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${adminTab === tab.id ? 'bg-[#006638] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            {adminTab === 'OVERVIEW' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[{ label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <DollarSign className="text-emerald-500" />, color: 'bg-emerald-50' }, { label: 'Profit (40%)', value: `₹${stats.profit.toLocaleString()}`, icon: <TrendingUp className="text-blue-500" />, color: 'bg-blue-50' }, { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag className="text-amber-500" />, color: 'bg-amber-50' }, { label: 'Active Tables', value: stats.activeTablesCount, icon: <TableIcon className="text-indigo-500" />, color: 'bg-indigo-50' }].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between h-40 transition-transform hover:scale-[1.02]">
                                <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>{stat.icon}</div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p><h4 className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</h4></div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Weekly Sales Trend</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                    <YAxis hide /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                                    <Area type="monotone" dataKey="sales" stroke="#006638" strokeWidth={3} fillOpacity={1} fill="rgba(0,102,56,0.1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Recent Orders</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredHistoryOrders.slice(0, 5).map((order) => {
                                        // robust timestamp handling
                                        const dateObj = (order.timestamp as any)?.toDate
                                            ? (order.timestamp as any).toDate()
                                            : new Date(order.timestamp as any || Date.now());

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 text-xs font-bold text-slate-500">#{order.id.slice(-6)}</td>
                                                <td className="py-4 font-bold text-slate-900">{order.customerName || 'Guest'}</td>
                                                <td className="py-4 text-xs font-bold text-slate-400">
                                                    {dateObj.toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-right font-black text-[#006638]">₹{order.total}</td>
                                                <td className="py-4 text-center">
                                                    {order.isPaid ? (
                                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                                            PAID
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                            {order.status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredHistoryOrders.length === 0 && (
                                <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">No recent orders found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {adminTab === 'LIVE_ORDERS' && (() => {
                const statusConfig: Record<string, { label: string; next: OrderStatus; color: string; badgeClass: string }> = {
                    PENDING: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
                    CONFIRMED: { label: '👨‍🍳 START PREPARING', next: OrderStatus.PREPARING, color: 'bg-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-black' },
                    PREPARING: { label: '🔔 MARK AS READY', next: OrderStatus.READY, color: 'bg-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
                    READY: { label: '🏃 MARK AS SERVED', next: OrderStatus.SERVED, color: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                    SERVED: { label: '💰 COMPLETE BILL', next: OrderStatus.COMPLETED, color: 'bg-[#006638]', badgeClass: 'bg-[#006638]/10 text-[#006638] border-[#006638]/30' },
                };

                const liveOrders = orders.filter(o => {
                    const s = String(o?.status ?? '').toUpperCase();
                    // Show until COMPLETED *AND* PAID
                    // If it's COMPLETED but not paid, keep it here.
                    // If it's PENDING/CONFIRMED/PREPARING/READY/SERVED, keep it here.
                    const isCompleted = s === 'COMPLETED';
                    const isPaid = o.isPaid === true;

                    return !isCompleted || !isPaid;
                });

                if (liveOrders.length === 0) {
                    return (
                        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                            <div className="text-4xl mb-4">🍽️</div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">No Active Orders</h3>
                            <p className="text-xs text-slate-400 font-bold mt-2">Waiting for new orders...</p>
                        </div>
                    );
                }

                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveOrders
                            .map(o => {
                                const currentStatus = (o.status != null && o.status !== '') ? String(o.status).toUpperCase() : '';
                                const config = statusConfig[currentStatus];
                                const docId = o.firebaseDocId || o.id;
                                const isUnpaidCash = (o.paymentMethod === 'Cash' || o.paymentMethod === 'CASH') && o.paymentStatus === 'Unpaid';

                                return (
                                    <div key={o.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                                        {isUnpaidCash && (
                                            <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest text-center py-1 z-10">
                                                Unpaid Cash Order
                                            </div>
                                        )}
                                        <div className={`p-6 border-b border-slate-50 flex justify-between bg-slate-50/50 ${isUnpaidCash ? 'pt-8' : ''}`}>
                                            <div><p className="text-[10px] font-black text-[#006638] uppercase tracking-widest">Table {o.tableNumber}</p><h4 className="text-base font-black text-slate-900">{o.customerName}</h4></div>
                                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${config ? config.badgeClass : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{o.status}</div>
                                        </div>
                                        <div className="p-6 flex-1 space-y-3">
                                            {o.items.map((it, idx) => (<div key={idx} className="flex justify-between text-xs font-bold text-slate-600"><span>{it.quantity}x {it.name.en}</span><span>₹{it.price * it.quantity}</span></div>))}
                                            <div className="pt-4 border-t border-dashed border-slate-200 mt-4 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span><span className="text-lg font-black text-[#006638]">₹{o.total}</span></div>
                                        </div>
                                        <div className="p-4 bg-slate-50 flex flex-col gap-3">
                                            {/* Status Badge (Read-Only) */}
                                            <div className={`w-full py-3 ${config ? config.badgeClass : 'bg-slate-200 text-slate-500'} rounded-2xl text-[10px] font-black uppercase text-center border`}>
                                                Status: {o.status}
                                            </div>

                                            {/* Admin Action: Payment Only */}
                                            {isUnpaidCash ? (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Confirm CASH receipt of ₹{o.total}?`)) {
                                                            onCompleteCashOrder(docId);
                                                        }
                                                    }}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-emerald-700"
                                                >
                                                    💰 CONFIRM CASH RECEIPT (₹{o.total})
                                                </button>
                                            ) : (
                                                <div className="text-center py-2">
                                                    {o.paymentStatus === 'Paid' ? (
                                                        <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">
                                                            ✅ Payment Verified
                                                        </span>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 font-bold italic">
                                                            Waiting for Chef or Payment...
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Helper: Cancel (Keep strictly necessary) */}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Are you sure you want to CANCEL this order?")) {
                                                        updateOrderStatus(docId, OrderStatus.CANCELLED);
                                                    }
                                                }}
                                                className="w-full py-2 text-rose-400 hover:text-rose-600 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Trash2 size={12} /> Cancel Order
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                );
            })()}
            {adminTab === 'MENU_MGMT' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Menu Manager</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    if (window.confirm("Are you sure you want to restore the default 20 dishes to the menu database?")) {
                                        try {
                                            const count = await restoreMenu();
                                            alert(`Successfully restored ${count} default dishes!`);
                                        } catch (e) {
                                            console.error("Restoration failed:", e);
                                            alert("Failed to restore menu items.");
                                        }
                                    }
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                🔄 Restore Defaults
                            </button>
                            <button onClick={() => setIsAddMenuModalOpen(true)} className="bg-[#006638] text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Plus size={18} /> Add Dish</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {menu.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                                    <div><p className="font-black text-sm text-slate-800">{item.name.en}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{item.name.hi}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500">{item.category}</td>
                                            <td className="px-8 py-5 font-black text-slate-700">₹{item.price}</td>
                                            <td className="px-8 py-5 text-center">
                                                <button onClick={() => toggleItemAvailability(item.id)} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${item.isAvailable ? 'bg-emerald-50 text-[#006638] border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>{item.isAvailable ? 'Active' : 'Sold Out'}</button>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => deleteMenuItem(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {adminTab === 'TABLE_MGMT' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4"><div className="bg-emerald-50 p-3 rounded-2xl text-[#006638] shadow-sm"><LinkIcon size={24} /></div><div className="flex-1"><h3 className="font-black text-lg text-slate-900 tracking-tight">System Configuration</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Link for Order System</p></div></div>
                        <div className="flex gap-3">
                            <input type="text" placeholder="e.g. https://myrestaurant.com/menu" value={systemBaseUrl} onChange={(e) => setSystemBaseUrl(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-[#006638] transition-all" />
                            <button onClick={() => { navigator.clipboard.writeText(systemBaseUrl); alert('Copied base URL!'); }} className="p-4 bg-slate-50 text-slate-400 hover:text-[#006638] border-2 border-slate-100 rounded-2xl transition-all"><Copy size={20} /></button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center"><h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Restaurant Layout</h2><button onClick={addTable} className="bg-[#006638] text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-transform active:scale-95"><Plus size={18} /> Add Table</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tables.map((t) => (
                            <div key={t} className="bg-white rounded-[40px] border-2 border-slate-100 p-8 flex flex-col items-center group transition-all hover:border-[#006638] shadow-sm relative overflow-hidden">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[24px] flex items-center justify-center group-hover:bg-[#006638] group-hover:text-white mb-4 transition-colors"><TableIcon size={32} /></div>
                                <h4 className="text-xl font-black text-slate-900">Table {t}</h4>
                                <div className="mt-6 flex flex-col w-full gap-2">
                                    <button onClick={() => setSelectedTableForQr(t)} className="w-full py-3 bg-emerald-50 text-[#006638] rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#006638] hover:text-white transition-all shadow-sm"><QrCode size={16} /> Get QR Code</button>
                                    <button onClick={() => removeTable(t)} className="w-full py-3 text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><Trash2 size={14} /> Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {adminTab === 'HISTORY' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 p-3 rounded-2xl text-[#006638]"><History size={24} /></div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 tracking-tight">Order History </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Ledger</p>
                                </div>
                            </div>

                            {/* Date Range Picker */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={historyStartDate ? new Date(historyStartDate.getTime() - (historyStartDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const d = e.target.value ? new Date(e.target.value) : null;
                                            if (d) d.setHours(0, 0, 0, 0);
                                            setHistoryStartDate(d as any);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#006638] transition-all"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={historyEndDate ? new Date(historyEndDate.getTime() - (historyEndDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const d = e.target.value ? new Date(e.target.value) : null;
                                            if (d) d.setHours(23, 59, 59, 999);
                                            setHistoryEndDate(d as any);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#006638] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sales Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(() => {
                                // Calculate Metrics
                                const totalSales = filteredHistoryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
                                const totalProfit = totalSales * 0.25; // 25% Margin
                                const orderCount = filteredHistoryOrders.length;

                                return (
                                    <>
                                        {/* Card 1: Total Revenue */}

                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredHistoryOrders.map(o => (
                            <button key={o.id} onClick={() => setSelectedHistoryOrder(o)} className="w-full bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center group transition-all hover:border-emerald-200 hover:shadow-lg text-left">
                                <div className="flex items-center gap-5"><div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-[#006638] group-hover:text-white transition-colors"><Receipt size={24} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORD-{o.id.slice(-6)}</p><h4 className="text-base font-black text-slate-800">{o.customerName} (T-{o.tableNumber})</h4></div></div>
                                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Revenue</p><p className="text-lg font-black text-[#006638]">₹{o.total}</p></div>
                            </button>
                        ))}
                    </div>
                    {historyHasMore && (
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={loadMoreHistory}
                                disabled={historyLoading}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {historyLoading ? 'Loading...' : 'Load More Records'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
