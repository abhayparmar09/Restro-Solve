import React, { useRef, useEffect } from 'react';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

import {
    Shield,
    Smartphone as MobileIcon,
    Smartphone,
    SmartphoneNfc,
    QrCode,
    CreditCard,
    Banknote,
    RefreshCcw,
    Utensils,
    CheckCircle,
    X,
    ArrowRight
} from 'lucide-react';

import { CheckoutStep, PaymentMethod, CartItem, Order, OrderStatus } from '../../types';
import { addOrder, updateOrderStatus, updatePaymentStatus } from '../../utils/firestore';

interface CheckoutModalProps {
    step: CheckoutStep;
    customerName: string;
    setCustomerName: (name: string) => void;
    phoneNumber: string;
    setPhoneNumber: (phone: string) => void;
    onPhoneSubmit: () => void;
    otpArray: string[];
    handleOtpInput: (index: number, val: string) => void;
    otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    isBusy: boolean;
    selectedPayment: PaymentMethod;
    setSelectedPayment: (method: PaymentMethod) => void;
    total: number;
    tableNumber: string;
    finalizeOrder: () => void;
    processOrder: () => void;
    setStep: (step: CheckoutStep) => void;
    cart: CartItem[];
    guestId: string;
    onPaymentSuccess: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    step,
    customerName,
    setCustomerName,
    phoneNumber,
    setPhoneNumber,
    onPhoneSubmit,
    otpArray,
    handleOtpInput,
    otpRefs,
    isBusy,
    selectedPayment,
    setSelectedPayment,
    total,
    tableNumber,
    finalizeOrder,
    processOrder,
    setStep,
    cart,
    guestId,
    onPaymentSuccess
}) => {
    // ... existing code ...

    useEffect(() => {
        if (step === 'PAYMENT' && !(window as any).Razorpay) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => console.log("Razorpay SDK Loaded");
            script.onerror = () => console.error("Razorpay SDK failed to load");
            document.body.appendChild(script);
        }
    }, [step]);
    const initiatePayment = async () => {
        try {
            // 1. Check if SDK is loaded
            if (!(window as any).Razorpay) {
                alert("Payment SDK is still loading. Please wait a moment and try again.");
                return;
            }

            // 2. Secure Calculation
            const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const tax = Number((subtotal * 0.05).toFixed(2));
            const calculatedTotal = Number((subtotal + tax).toFixed(2));

            // Prevent tampering
            if (Math.abs(calculatedTotal - total) > 0.5) {
                alert("Price mismatch detected. Please refresh.");
                return;
            }

            // 3. Create Order Object (Status: AWAITING_PAYMENT / CREATED)
            const newOrderId = "ORD" + Math.floor(100000 + Math.random() * 900000);
            const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '').slice(-10) : '';

            // Sanitize items
            const sanitizedItems = cart.map(item => ({
                ...item,
                id: item.id || 'unknown',
                name: { en: item.name?.en || 'Unknown', hi: item.name?.hi || '' },
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1
            }));

            const newOrder: Order = {
                id: newOrderId,
                tableNumber: tableNumber || '1',
                customerName: customerName || 'Guest',
                customerPhone: cleanPhone,
                items: sanitizedItems,
                subtotal: subtotal,
                tax: tax,
                discount: 0,
                total: calculatedTotal,
                status: OrderStatus.AWAITING_PAYMENT, // Created but not paid
                timestamp: Date.now(), // firestore will overwrite
                paymentMethod: 'Razorpay' as PaymentMethod,
                paymentStatus: 'Unpaid',
                userId: guestId,
                paymentType: 'ONLINE'
            };

            // 4. Save to Firestore BEFORE Payment
            const docId = await addOrder(newOrder);
            console.log("Order Created for Payment:", docId, newOrderId);

            const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
            if (!razorpayKey) {
                console.error("VITE_RAZORPAY_KEY_ID is missing");
                alert("Payment System Error: Key missing.");
                return;
            }

            // Verify Options Key (Force Test Mode Check)
            if (razorpayKey.startsWith('rzp_live')) {
                console.warn("Using Live Key in simulated environment?");
            }

            const options = {
                key: razorpayKey,
                amount: Math.round(calculatedTotal * 100), // Amount in paise
                currency: "INR",
                name: "S3 Restaurant",
                description: `Order #${newOrderId}`,
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80",
                order_id: "",

                handler: async (response: any) => {
                    console.log("SUCCESS_HANDLER_START", docId);
                    console.log("Razorpay Success Handler Triggered");
                    console.log("Using Order Doc ID:", docId);
                    console.log("Razorpay Response:", response);

                    if (!docId) {
                        alert("Critical Error: Order ID lost. Please contact support.");
                        return;
                    }

                    if (!response.razorpay_payment_id) {
                        alert("Payment ID missing. Order not confirmed.");
                        return;
                    }

                    // 5. Update Firestore on Success (Direct Update)
                    try {
                        console.log("Updating Firestore for docId:", docId);

                        if (!db) {
                            console.error("CRITICAL: 'db' object is undefined. Check firebase/config.");
                            alert("System Error: Database not connected.");
                            return;
                        }

                        const orderRef = doc(db, "orders", docId);
                        // [CRITICAL] Update ALL status fields to ensure Admin Panel sees it
                        await updateDoc(orderRef, {
                            paymentStatus: 'Paid',
                            isPaid: true,
                            status: 'CONFIRMED',      // Critical for Admin Panel
                            orderStatus: 'CONFIRMED', // Critical for Admin Panel
                            razorpayPaymentId: response.razorpay_payment_id,
                            updatedAt: serverTimestamp(),
                            paymentType: 'ONLINE'
                        });

                        console.log("Firestore updated, executing redirect...");


                        // Clear Cart State IMMEDIATELY via prop
                        // Cleanup Storage ONLY
                        try {
                            localStorage.removeItem('s3_cart');
                        } catch (e) {
                            console.error("LS Cleanup Error", e);
                        }

                        // 3. Force Direct Redirect
                        const redirectUrl = `${window.location.origin}/track-order/${cleanPhone || newOrderId}`;
                        console.log("BYPASSING_CART_DIRECT_TO_TRACKING: " + redirectUrl);

                        // Use replace to prevent back navigation to cart
                        window.location.replace(redirectUrl);

                    } catch (err) {
                        console.error("Failed to update order after payment:", err);
                        alert("Payment successful but order update failed. Please contact staff with Order #" + newOrderId);
                    }
                },
                prefill: {
                    name: customerName,
                    email: "guest@example.com",
                    contact: cleanPhone
                },
                notes: {
                    address: "Restaurant Table " + tableNumber
                },
                theme: {
                    color: "#006638"
                },
                modal: {
                    onDismiss: function () {
                        console.log('Checkout closed');
                    }
                },
            };

            const paymentObject = new (window as any).Razorpay(options);

            paymentObject.on('payment.failed', function (response: any) {
                console.error("Payment Failed:", response.error);
                alert("Payment Failed: " + response.error.description);
            });

            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Initiation Error:", error);
            alert("Error initializing payment: " + error.message);
        }
    };


    if (step === 'NONE' || step === 'SUCCESS') return null;

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-900/80 backdrop-blur-xl flex flex-col justify-end animate-fade-in no-print" onClick={() => !isBusy && setStep('NONE')}>
            <div className="bg-white rounded-t-[48px] w-full max-w-md mx-auto p-10 shadow-2xl min-h-[60vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {step === 'PHONE' && (
                        <div className="animate-fade-in flex flex-col"><h2 className="text-3xl font-black text-[#006638] mb-2 tracking-tighter uppercase">Guest Info</h2><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Establish your identity</p><div className="space-y-4 mb-auto"><input type="text" placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 px-8 font-black text-lg outline-none focus:border-[#006638] transition-all shadow-inner" /><input type="tel" maxLength={10} placeholder="Mobile Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 px-8 font-black text-lg outline-none focus:border-[#006638] transition-all shadow-inner" /></div><button disabled={!customerName || phoneNumber.length < 10} onClick={onPhoneSubmit} className="w-full py-6 rounded-3xl bg-[#006638] text-white font-black uppercase tracking-[0.2em] shadow-xl disabled:bg-slate-100 mt-10 active:scale-95 transition-all border border-emerald-700">Proceed</button></div>
                    )}
                    {step === 'OTP' && (
                        <div className="animate-fade-in text-center flex flex-col items-center"><div className="bg-emerald-50 w-20 h-20 rounded-[32px] flex items-center justify-center text-[#006638] mb-8 shadow-inner"><Shield size={40} strokeWidth={2.5} /></div><h2 className="text-3xl font-black text-[#006638] mb-4 tracking-tighter uppercase">Verify Code</h2><p className="text-slate-400 font-bold mb-10 text-sm">Demo Security Pin: 1234</p><div className="grid grid-cols-6 gap-3 w-full mb-10">{[0, 1, 2, 3, 4, 5].map(i => (<input key={i} ref={el => { otpRefs.current[i] = el; }} type="tel" maxLength={1} value={otpArray[i]} onChange={e => handleOtpInput(i, e.target.value)} className="w-full h-20 rounded-[32px] border-2 border-slate-100 bg-slate-50 text-center text-4xl font-black focus:border-[#006638] outline-none transition-all shadow-inner" />))}</div></div>
                    )}
                    {step === 'PAYMENT' && (
                        <div className="animate-fade-in flex flex-col pb-10"><h2 className="text-2xl font-black mb-1 tracking-tighter uppercase text-[#006638]">Settlement</h2><p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-6">Choose your preferred payment method</p>



                            <div className="space-y-4">
                                {/* Option A: Cash Payment */}
                                <button
                                    disabled={isBusy}
                                    onClick={async () => {
                                        if (isBusy) return;
                                        // Set Busy locally to prevent double clicks (managed by parent or we add local state if needed)
                                        // Actually isBusy comes from props, we might need a local busy or assume processOrder handles it.
                                        // The instruction says "Disable both buttons immediately after the first click".
                                        // We will rely on isBusy prop if parent updates it, OR set a local flag if we can't update prop.
                                        // But processOrder sets isBusy=true in App.tsx. 
                                        // However, for Cash we are calling addOrder directly here according to instructions or calling processOrder?
                                        // "Action: Immediately call addOrder to Firestore."
                                        // So we will implement handleCashPayment here.

                                        try {
                                            // 1. Prepare Cash Order
                                            const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                                            const tax = Number((subtotal * 0.05).toFixed(2));
                                            const calculatedTotal = Number((subtotal + tax).toFixed(2));
                                            const newOrderId = "ORD" + Math.floor(100000 + Math.random() * 900000);
                                            const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '').slice(-10) : '';

                                            const sanitizedItems = cart.map(item => ({
                                                ...item,
                                                id: item.id || 'unknown',
                                                name: { en: item.name?.en || 'Unknown', hi: item.name?.hi || '' },
                                                price: Number(item.price) || 0,
                                                quantity: Number(item.quantity) || 1
                                            }));

                                            const cashOrder: Order = {
                                                id: newOrderId,
                                                tableNumber: tableNumber || '1',
                                                customerName: customerName || 'Guest',
                                                customerPhone: cleanPhone,
                                                items: sanitizedItems,
                                                subtotal: subtotal,
                                                tax: tax,
                                                discount: 0,
                                                total: calculatedTotal,
                                                status: 'CONFIRMED' as OrderStatus,
                                                timestamp: Date.now(),
                                                paymentMethod: 'Cash',
                                                paymentStatus: 'Unpaid',
                                                userId: guestId,
                                                paymentType: 'CASH',
                                            };

                                            // 2. Add to Firestore
                                            // Show spinner by setting step or using a local busy state? 
                                            // We can use setStep('PROCESSING') to show existing spinner UI.
                                            setStep('PROCESSING');

                                            // Simulate 1s delay for generic "Order Placing..."
                                            setTimeout(async () => {
                                                try {
                                                    await addOrder(cashOrder);

                                                    // 3. Redirect
                                                    // Clear cart via localStorage as done in Online flow
                                                    try {
                                                        localStorage.removeItem('s3_cart');
                                                    } catch (e) { console.error(e); }

                                                    console.log("CASH_ORDER_PLACED_REDIRECTING");
                                                    window.location.replace(`${window.location.origin}/track-order/${cleanPhone || newOrderId}`);

                                                } catch (err) {
                                                    console.error("Cash Order Failed:", err);
                                                    alert("Failed to place order. Please try again.");
                                                    setStep('PAYMENT');
                                                }
                                            }, 1000);

                                        } catch (e) {
                                            console.error("Cash setup failed:", e);
                                        }
                                    }}
                                    className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white shadow-lg flex items-center justify-between transition-all active:scale-95 hover:border-[#006638] group disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006638] group-hover:bg-[#006638] group-hover:text-white transition-colors">
                                            <Banknote size={28} strokeWidth={2} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pay at Counter</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash / Card via Staff</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#006638] group-hover:bg-[#006638] group-hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </div>
                                </button>

                                {/* Option B: Online Payment */}
                                <button
                                    disabled={isBusy}
                                    onClick={() => {
                                        if (isBusy) return;
                                        // Trigger Razorpay directly
                                        initiatePayment();
                                    }}
                                    className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white shadow-lg flex items-center justify-between transition-all active:scale-95 hover:border-[#006638] group disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Smartphone size={28} strokeWidth={2} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pay Online</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UPI / Netbanking / Wallets</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#006638] group-hover:bg-[#006638] group-hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                    {step === 'UPI_WAIT' && (
                        <div className="animate-fade-in flex flex-col items-center justify-center text-center pb-10"><div className="bg-[#006638] p-10 rounded-[48px] shadow-2xl mb-12 animate-scale-in border-4 border-emerald-100"><QrCode size={180} className="text-white" /></div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Waiting for Payment</h3><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12">Amount to pay: ₹{total}</p><div className="w-full space-y-4"><div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-[#006638]"><RefreshCcw size={20} className="animate-spin shrink-0" /><p className="text-[10px] font-black uppercase text-left">We are waiting for the bank to confirm your payment... Do not close this window.</p></div><button onClick={processOrder} className="w-full bg-[#1A1A1A] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-xs border border-slate-700">I have completed payment</button><button onClick={() => setStep('PAYMENT')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500">Cancel & Change Method</button></div></div>
                    )}
                    {step === 'PROCESSING' && (
                        <div className="animate-fade-in flex flex-col items-center justify-center text-center h-[50vh]"><div className="relative"><div className="w-24 h-24 border-8 border-slate-50 border-t-[#006638] rounded-full animate-spin shadow-inner"></div><div className="absolute inset-0 flex items-center justify-center"><Utensils size={32} className="text-[#006638] animate-pulse" /></div></div><h2 className="text-2xl font-black mt-8 mb-2 tracking-tighter uppercase text-[#006638]">Order Sync</h2><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating kitchen logs for Table {tableNumber}...</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
