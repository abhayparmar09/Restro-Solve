import React, { useMemo } from 'react';
import { Order } from '../types';

interface ThermalReceiptProps {
    order: Order;
}

const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order }) => {
    // Calculations
    const calculations = useMemo(() => {
        const subtotal = order.subtotal || order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        // Recalculate total ensuring it matches the sum of parts for display accuracy, 
        // OR rely on order.total if it's the source of truth. 
        // Given strict mapping instructions: "Grand Total: {order.total}"
        return {
            subtotal,
            cgst,
            sgst,
            total: order.total
        };
    }, [order]);

    const formatDate = (timestamp: any) => {
        const date = new Date(typeof timestamp === 'number' ? timestamp : Date.now());
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div id="printable-receipt" className="font-mono text-black bg-white p-4 max-w-[320px] mx-auto border border-slate-200 shadow-inner">
            {/* Header */}
            <div className="text-center mb-2">
                <h1 className="text-xl font-black uppercase tracking-tight"> Restro Cafe</h1>
                <p className="text-[10px] font-medium mt-1">Ab Road Dewas. 455001</p>
                <p className="text-[10px] font-medium">GSTIN: 23GYRPS0789BB1ZZ</p>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-2" />

            {/* Metadata Grid */}
            <div className="text-[10px] space-y-1 font-medium">
                <div className="flex justify-between">
                    <span>Date: {formatDate(order.timestamp)}</span>
                    <span>Table: {order.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">Cust: {order.customerName || 'Guest'}</span>
                    <span>Bill No: {order.id.slice(-5)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Phone: {order.customerPhone}</span>
                    <span className="font-bold uppercase">Mode: {order.paymentType || order.paymentMethod}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-2" />

            {/* Items Table Headers */}
            <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="w-[40%] text-left">Item</span>
                <span className="w-[15%] text-center">Qty</span>
                <span className="w-[20%] text-right">Price</span>
                <span className="w-[25%] text-right">Amount</span>
            </div>

            {/* Items List */}
            <div className="space-y-1 mb-2">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-[11px] items-start">
                        <span className="w-[40%] text-left leading-tight">{item.name.en}</span>
                        <span className="w-[15%] text-center">{item.quantity}</span>
                        <span className="w-[20%] text-right">{item.price}</span>
                        <span className="w-[25%] text-right">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-black my-2" />

            {/* Calculation Section */}
            <div className="space-y-1 text-[11px] font-medium">
                <div className="flex justify-between">
                    <span className="text-right flex-1 pr-4">Total Qty:</span>
                    <span className="w-[25%] text-right">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-right flex-1 pr-4">Sub Total:</span>
                    <span className="w-[25%] text-right">{calculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-right flex-1 pr-4">CGST (2.5%):</span>
                    <span className="w-[25%] text-right">{calculations.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-right flex-1 pr-4">SGST (2.5%):</span>
                    <span className="w-[25%] text-right">{calculations.sgst.toFixed(2)}</span>
                </div>
            </div>

            {/* Grand Total */}
            <div className="border-y-2 border-black my-2 py-1 flex justify-between items-center">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-lg font-bold">{calculations.total.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
                <p className="font-bold text-xs uppercase">Thanks</p>
                {/* <p className="text-[9px] mt-1">Visit Again</p> */}
            </div>
        </div>
    );
};

export default ThermalReceipt;
