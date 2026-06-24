
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

import { subscribeToOrders, addOrder, updateOrderStatus as dbUpdateOrderStatus, fetchHistoryOrders, subscribeToMenu, addDish, deleteDish, updateDish, completeCashOrder, subscribeToStats } from './utils/firestore';
import { decodeBase64, decodeAudioData } from './utils/audio';
import {
  MenuItem, CartItem, Order, OrderStatus, Category, ViewType,

  StaffRole, Language, CheckoutStep, PaymentMethod
} from './types';
import { TRANSLATIONS } from './locales';
import { ShoppingBag, ArrowRight } from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import KitchenDisplay from './components/KitchenDisplay';
import CustomerView from './components/CustomerView';
import AdminPanel from './components/AdminPanel';


import CartModal from './components/modals/CartModal';
import ItemDetailModal from './components/modals/ItemDetailModal';
import LoginModal from './components/modals/LoginModal';
import HistoryModal from './components/modals/HistoryModal';
import AddMenuModal from './components/modals/AddMenuModal';
import QrModal from './components/modals/QrModal';
import FilterModal from './components/modals/FilterModal';
import CheckoutModal from './components/modals/CheckoutModal';
import SuccessModal from './components/modals/SuccessModal';
import InvoiceModal from './components/modals/InvoiceModal';

const App = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<ViewType>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [guestId, setGuestId] = useState<string>('');

  const [customerTab, setCustomerTab] = useState<'MENU' | 'MY_ORDERS'>('MENU');
  const [staffRole, setStaffRole] = useState<StaffRole>('NONE');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([]);

  // Admin states
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'LIVE_ORDERS' | 'MENU_MGMT' | 'TABLE_MGMT' | 'HISTORY'>('OVERVIEW');
  const [overviewStats, setOverviewStats] = useState({ revenue: 0, orders: 0, dailyData: [] as any[], totalCash: 0 });
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [tables, setTables] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [systemBaseUrl, setSystemBaseUrl] = useState<string>(window.location.origin + window.location.pathname);
  const [selectedTableForQr, setSelectedTableForQr] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const announcedOrderIds = useRef<Set<string>>(new Set());

  // History Pagination State
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [lastHistoryDoc, setLastHistoryDoc] = useState<any>(null); // keeping as any to avoid complex type import issues for now
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  const [historyStartDate, setHistoryStartDate] = useState<Date | null>(null);
  const [historyEndDate, setHistoryEndDate] = useState<Date | null>(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [sortBy, setSortBy] = useState<'NONE' | 'LOW_TO_HIGH' | 'HIGH_TO_LOW'>('NONE');

  const [vegOnly, setVegOnly] = useState(false);

  // Checkout & Auth
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('NONE');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('PhonePe');

  // [RESTORED] Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<any>(null);

  useEffect(() => {
    let id = localStorage.getItem('s3_guest_id');
    if (!id) {
      id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('s3_guest_id', id);
    }
    setGuestId(id);
  }, []);



  // 1. Admin/Kitchen/Guest Listener (Global or specific to GuestId)
  useEffect(() => {
    if (view === 'CUSTOMER') return; // Handled by dedicated customer listener below

    console.log(`[App] Subscribing to Global/Table orders. View: ${view}`);
    setIsLoading(true);

    // Admin/Kitchen see everything (pass undefined)
    const unsubscribe = subscribeToOrders(
      undefined,
      (updatedOrders, isLocal) => {
        setOrders(updatedOrders);
        setHasPendingWrites(isLocal);
        setIsLoading(false);
      },
      (err) => {
        console.error("Global Subscription Error:", err);
        setError("Failed to sync orders.");
        setIsLoading(false);
      },
      { includeMetadataChanges: true } // Enable latency compensation updates
    );
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    if (view !== 'ADMIN') return;

    // Using history dates as filter for Overview too, as per request to respect date filters
    // If user clears dates in History tab, it might affect Overview if we share state.
    // For now, assuming they are linked.
    const dateFilter = { start: historyStartDate, end: historyEndDate };

    const unsub = subscribeToStats((newStats) => {
      setOverviewStats(newStats);
    }, dateFilter, (err) => console.error(err));

    return () => unsub();
  }, [view, historyStartDate, historyEndDate]); // Re-fetch when dates change

  // 2. Customer Tracking Listener (Strict Phone Number based)
  useEffect(() => {
    if (view !== 'CUSTOMER') return;

    // Use phone number from state or local storage
    const trackingKey = phoneNumber || localStorage.getItem('s3_customer_phone');

    if (!trackingKey) {
      console.log("[App] No tracking key found for customer yet.");
      setCustomerOrders([]);
      setIsLoading(false);
      return;
    }

    console.log(`[App] Starting Customer Tracking for: ${trackingKey}`);
    setIsLoading(true);

    const unsubscribe = subscribeToOrders(
      trackingKey,
      (updated, isLocal) => {
        console.log(`[App] Customer Orders Updated: ${updated.length}`);
        setCustomerOrders(updated);
        // Also update main orders for compatibility if needed, but better to keep separate
        // setOrders(updated); 
        setHasPendingWrites(isLocal);
        setIsLoading(false);
      },
      (err) => {
        console.error("Tracking Error:", err);
        // If index error, it will show here
      },
      { includeMetadataChanges: true, isCustomerView: true }
    );
    return () => unsubscribe();
  }, [view, phoneNumber, checkoutStep]); // Re-run if phone changes or after checkout interaction

  useEffect(() => {
    if (view !== 'CUSTOMER' || customerOrders.length === 0) return;

    // Check every 1 minute
    const cleanupInterval = setInterval(async () => {
      const now = Date.now();
      const STALE_TIMEOUT = 10 * 60 * 1000; // 10 Minutes

      const staleOrders = customerOrders.filter(o =>
        o.status === OrderStatus.AWAITING_PAYMENT &&
        (now - (o.timestamp?.toMillis ? o.timestamp.toMillis() : (o.timestamp || 0))) > STALE_TIMEOUT
      );

      if (staleOrders.length > 0) {
        console.log("[App] Cleaning up stale orders:", staleOrders.length);
        const { updateOrderStatus } = await import('./utils/firestore');
        staleOrders.forEach(o => {
          if (o.firebaseDocId) updateOrderStatus(o.firebaseDocId, OrderStatus.CANCELLED_PAYMENT);
        });
      }
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, [customerOrders, view]);


  useEffect(() => {
    const unsubscribe = subscribeToMenu(
      (updatedMenu) => setMenu(updatedMenu),
      (err) => console.error("Menu subscription error:", err)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadLocalPrefs = () => {
      // Removed local menu loading
      const savedUrl = localStorage.getItem('s3_system_url');
      if (savedUrl) setSystemBaseUrl(savedUrl);
      const savedTables = localStorage.getItem('s3_tables');
      if (savedTables) setTables(JSON.parse(savedTables));
      const savedCart = localStorage.getItem('s3_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    };
    loadLocalPrefs();

    const params = new URLSearchParams(window.location.search);
    const tableFromUrl = params.get('table');
    if (tableFromUrl) setTableNumber(tableFromUrl);

    const savedName = localStorage.getItem('s3_customer_name');
    const savedPhone = localStorage.getItem('s3_customer_phone');
    if (savedName) setCustomerName(savedName);
    if (savedPhone) setPhoneNumber(savedPhone);

    // Handle the /track-order/:phone route without Router
    const path = window.location.pathname;
    if (path.includes('/track-order/')) {
      const phoneFromUrl = path.split('/track-order/')[1];
      if (phoneFromUrl) {
        console.log("Restoring session from URL:", phoneFromUrl);
        setPhoneNumber(phoneFromUrl);
        setCustomerTab('MY_ORDERS');
        setView('CUSTOMER');
      }
    }
  }, []);

  useEffect(() => {
    if (!isVoiceEnabled || (view !== 'KITCHEN' && view !== 'ADMIN')) return;
    const newOrders = orders.filter(o => o.status === OrderStatus.PENDING && !announcedOrderIds.current.has(o.id));
    if (newOrders.length > 0) {
      const order = newOrders[0];
      announcedOrderIds.current.add(order.id);
      announceOrder(order);
    }
  }, [orders, isVoiceEnabled, view]);

  const announceOrder = async (order: Order) => {
    try {
      const itemsList = order.items.map(i => `${i.quantity} ${i.name.hi || i.name.en}`).join(', ');
      const prompt = `Say clearly in Hindi: Table ${order.tableNumber} par ${itemsList} ka order aaya hai. Repeat: Table ${order.tableNumber}, ${itemsList}.`;

      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_API_KEY || "YOUR_KEY_HERE" });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decoded = decodeBase64(base64Audio);
        const buffer = await decodeAudioData(decoded, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (error) {
      console.error("Voice Announcement Error:", error);
    }
  };

  // Removed s3_menu_custom sync
  useEffect(() => { localStorage.setItem('s3_system_url', systemBaseUrl); }, [systemBaseUrl]);
  useEffect(() => { localStorage.setItem('s3_tables', JSON.stringify(tables)); }, [tables]);
  useEffect(() => { localStorage.setItem('s3_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [customerTab, adminTab]);

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const calculations = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    return { subtotal, tax, total };
  }, [cart]);

  const stats = useMemo(() => {
    // Active Tables (Live Orders only)
    const activeTablesCount = new Set(orders.filter(o => !['COMPLETED', 'CANCELLED', 'CANCELLED_PAYMENT'].includes(o.status)).map(o => o.tableNumber)).size;

    // Use fetched stats for Overview
    return {
      revenue: overviewStats.revenue,
      profit: overviewStats.revenue * 0.4, // Mock 40% profit margin
      totalOrders: overviewStats.orders,
      activeTablesCount,
      dailyData: overviewStats.dailyData.length > 0 ? overviewStats.dailyData : [
        { name: 'Mon', sales: 0 }, { name: 'Tue', sales: 0 }, { name: 'Wed', sales: 0 }, { name: 'Thu', sales: 0 }, { name: 'Fri', sales: 0 }, { name: 'Sat', sales: 0 }, { name: 'Sun', sales: 0 }
      ],
      totalCash: overviewStats.totalCash
    };
  }, [orders, overviewStats]);

  const loadMoreHistory = async (reset = false) => {
    setHistoryLoading(true);
    try {
      const startAfterDoc = reset ? null : lastHistoryDoc;
      const { orders: newOrders, lastDoc, empty } = await fetchHistoryOrders(
        startAfterDoc,
        20,
        historyStartDate,
        historyEndDate
      );

      if (reset) {
        setHistoryOrders(newOrders);
      } else {
        setHistoryOrders(prev => [...prev, ...newOrders]);
      }

      setLastHistoryDoc(lastDoc);
      setHistoryHasMore(!empty && newOrders.length === 20);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initial History Load
  useEffect(() => {
    if (view === 'ADMIN' && (adminTab === 'HISTORY' || adminTab === 'OVERVIEW')) {
      loadMoreHistory(true);
    }
  }, [view, adminTab, historyStartDate, historyEndDate]);

  const filteredHistoryOrders = useMemo(() => {
    return historyOrders.filter(o =>
      (o.status === 'COMPLETED' || o.status === 'Completed') && o.isPaid === true
    );
  }, [historyOrders]);


  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      console.log(`[App] Updating status for Doc ID: ${orderId} to ${nextStatus}`);
      await dbUpdateOrderStatus(orderId, nextStatus);
      // Subscription updates state automatically.
    } catch (e: any) {
      console.error("Failed to update status in App.tsx:", e);
      alert(`Failed to update status: ${e.message}`);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this dish?")) {
      await deleteDish(id);
    }
  };

  const toggleItemAvailability = async (id: string) => {
    const item = menu.find(m => m.id === id);
    if (item) {
      // My implementation in firestore.ts: menuItems.push({ ...doc.data(), id: doc.id });
      // So item.id IS the firestore document ID.
      await updateDish(id, { isAvailable: !item.isAvailable });
    }
  };

  const addTable = () => {
    const lastTable = tables.length > 0 ? Math.max(...tables.map(t => parseInt(t))) : 0;
    setTables(prev => [...prev, (lastTable + 1).toString()]);
  };

  const removeTable = (number: string) => {
    if (window.confirm(`Are you sure you want to remove Table ${number}?`)) {
      setTables(prev => prev.filter(t => t !== number));
    }
  };

  const handleInitialCheckout = () => {
    // Direct flow: Phone -> Payment
    if (!customerName || !phoneNumber) {
      setCheckoutStep('PHONE');
    } else {
      setCheckoutStep('PAYMENT');
    }
  };

  const handlePhoneSubmit = async () => {
    if (!customerName || phoneNumber.length < 10) return;
    // Save details
    localStorage.setItem('s3_customer_name', customerName);
    localStorage.setItem('s3_customer_phone', phoneNumber);
    // Skip OTP, go strictly to payment
    setCheckoutStep('PAYMENT');
  };

  // Removed handleVerifyOtp
  // Removed handleOtpInput


  const finalizeOrder = async () => {
    const isAppUpi = ['PhonePe', 'GPay', 'Paytm'].includes(selectedPayment);
    if (isAppUpi) {
      const success = await processOrder(true);
      if (success) {
        const upiUrl = `upi://pay?pa=paytmqr1n16zcz5fo@paytm&pn=Restaurant&am=${calculations.total}&cu=INR&tn=Table%20${tableNumber}`;

        try {
          // Short delay to ensure write flushes
          setTimeout(() => {
            try {
              window.location.href = upiUrl;
            } catch (e) {
              console.error("Failed to launch UPI:", e);
              alert("Could not launch UPI app. Please scan the QR code manually.");
            }
          }, 500);
        } catch (e) {
          console.error("UPI launch setup failed:", e);
        }
        setCheckoutStep('UPI_WAIT');
      }
    } else if (selectedPayment === 'QR') {
      await processOrder(); // Save order first
      setCheckoutStep('UPI_WAIT');
    } else {
      processOrder();
    }
  };

  const verifyPayment = async () => {
    setIsBusy(true);
    try {
      // Find the most recent AWAITING_PAYMENT order for this customer
      const pendingOrder = customerOrders.find(o => o.status === OrderStatus.AWAITING_PAYMENT);

      if (!pendingOrder) {
        alert("No pending payment found. Please wait a moment or try again.");
        setIsBusy(false);
        return;
      }

      console.log("Verifying payment for order:", pendingOrder.id);
      const docId = pendingOrder.firebaseDocId || pendingOrder.id;

      const { completeOnlineOrder } = await import('./utils/firestore');

      await completeOnlineOrder(docId, "pay_" + Math.random().toString(36).substr(2, 9));
      setCart([]);
      setCheckoutStep('SUCCESS');
      setIsBusy(false);

    } catch (e) {
      console.error("Payment verification failed:", e);
      setIsBusy(false);
      alert("Failed to verify payment. Please try again.");
    }
  };

  const processOrder = async (isRedirecting = false) => {
    // setIsCartOpen(false); // don't close immediately if redirecting?
    if (!isRedirecting) setIsCartOpen(false);

    // If redirecting (UPI), we stay on UPI_WAIT step, else PROCESSING
    // But finalizeOrder handles step setting for UPI_WAIT
    if (!isRedirecting) setCheckoutStep('PROCESSING');

    try {
      const newOrderId = "ORD" + Math.floor(100000 + Math.random() * 900000);
      const isPaidMethod = !['Cash'].includes(selectedPayment);
      const initialStatus = isPaidMethod ? OrderStatus.AWAITING_PAYMENT : OrderStatus.PENDING;

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
        customerPhone: phoneNumber || '',
        items: sanitizedItems,
        subtotal: Number(calculations.subtotal) || 0,
        tax: Number(calculations.tax) || 0,
        discount: 0,
        total: Number(calculations.total) || 0,
        status: initialStatus,
        timestamp: Date.now(), // Will be overwritten by serverTimestamp in utils
        paymentMethod: selectedPayment,
        paymentStatus: 'Unpaid', // Always starts Unpaid until verified
        userId: guestId // [NEW] Attach Guest ID
      };

      if (phoneNumber) {
        localStorage.setItem('s3_customer_phone', phoneNumber);
      }
      const savedPhone = localStorage.getItem('s3_customer_phone');
      if (!savedPhone && !view.includes('ADMIN')) { // Admin bypass
        alert("Error: Phone number not saved. Cannot track order.");
        setIsBusy(false);
        return false;
      }

      const firebaseDocId = await addOrder(newOrder);

      if (!isPaidMethod) {
        setCart([]);
        setCheckoutStep('SUCCESS');
      } else {
        // We moved to AWAITING_PAYMENT.
        // Cart remains populated so if they back out, they can retry or add items.
        // setCheckoutStep handled by caller or kept at processing/UPI_WAIT.
        console.log("Order created, waiting for payment:", newOrderId);
      }

      // Update local tracking state immediately for responsiveness
      if (view === 'CUSTOMER') {
        const orderWithId = { ...newOrder, firebaseDocId };
        setCustomerOrders(prev => [orderWithId, ...prev]);
      }

      return true;
    } catch (e: any) {
      console.error("Order processing failed:", e);
      setIsBusy(false); // [FIX] Ensure busy state is cleared
      alert(`Order Error: ${e.message || "Unknown error"}. Please try again.`);
      setCheckoutStep('PAYMENT'); // Go back to payment selection on error
      return false;
    }
  };

  const closeSuccessAndTrack = () => {
    setCart([]);
    localStorage.removeItem('s3_cart');
    setCheckoutStep('NONE');
    setCustomerTab('MY_ORDERS');
  };

  const filteredMenu = useMemo(() => {
    let result = menu.filter(item => {
      const matchesSearch = item.name[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name[lang === 'en' ? 'hi' : 'en'].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesVeg = !vegOnly || item.isVeg === true;
      return matchesSearch && matchesCategory && matchesVeg;
    });
    if (sortBy === 'LOW_TO_HIGH') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'HIGH_TO_LOW') result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [menu, selectedCategory, searchQuery, lang, sortBy, vegOnly]);

  const activeCustomerOrders = useMemo(() => {
    return customerOrders;
  }, [customerOrders]);
  const handleLongPressStart = () => { longPressTimer.current = setTimeout(() => { setShowLoginModal(true); }, 2000); };

  const handleLongPressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Header
        view={view}
        lang={lang}
        setLang={setLang}
        setView={setView}
        setStaffRole={setStaffRole}
        tableNumber={tableNumber}
        handleLongPressStart={handleLongPressStart}
        handleLongPressEnd={handleLongPressEnd}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest z-[10000] shadow-md animate-slide-down">
          ⚠️ {error}
        </div>
      )}

      {/* Cloud Sync Status Indicator */}
      <div className={`fixed top-4 right-4 z-[9999] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${hasPendingWrites ? 'bg-amber-100 text-amber-600 translate-y-0' : 'bg-emerald-100 text-emerald-600 -translate-y-20 opacity-0 pointer-events-none'}`}>
        {hasPendingWrites ? '🟡 Syncing...' : '🟢 Synced'}
      </div>



      <main ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative w-full touch-pan-y pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0">
        {view === 'KITCHEN' && (
          <KitchenDisplay
            orders={orders}
            isVoiceEnabled={isVoiceEnabled}
            setIsVoiceEnabled={setIsVoiceEnabled}
            updateOrderStatus={updateOrderStatus}
            onCompleteCashOrder={completeCashOrder}
          />
        )}

        {view === 'CUSTOMER' && (
          <CustomerView
            customerTab={customerTab}
            tableNumber={tableNumber}
            customerName={customerName}
            phoneNumber={phoneNumber}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isFilterModalOpen={isFilterModalOpen}
            setIsFilterModalOpen={setIsFilterModalOpen}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredMenu={filteredMenu}
            cart={cart}
            addToCart={addToCart}
            setSelectedDetailItem={setSelectedDetailItem}
            lang={lang}
            onViewBill={setSelectedInvoiceOrder}
          />
        )}

        {view === 'ADMIN' && (
          <AdminPanel
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            stats={stats}
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            updatePaymentStatus={async (orderId, status) => {
              await import('./utils/firestore').then(mod => mod.updatePaymentStatus(orderId, status));
            }}
            menu={menu}
            setIsAddMenuModalOpen={setIsAddMenuModalOpen}
            toggleItemAvailability={toggleItemAvailability}
            deleteMenuItem={deleteMenuItem}
            tables={tables}
            systemBaseUrl={systemBaseUrl}
            setSystemBaseUrl={setSystemBaseUrl}
            addTable={addTable}
            setSelectedTableForQr={setSelectedTableForQr}
            removeTable={removeTable}
            historyStartDate={historyStartDate}
            setHistoryStartDate={setHistoryStartDate}
            historyEndDate={historyEndDate}
            setHistoryEndDate={setHistoryEndDate}

            filteredHistoryOrders={filteredHistoryOrders}
            setSelectedHistoryOrder={setSelectedHistoryOrder}
            loadMoreHistory={() => loadMoreHistory(false)}
            historyLoading={historyLoading}
            historyHasMore={historyHasMore}
            onCompleteCashOrder={async (orderId) => {
              console.log("App: Admin requested cash completion for", orderId);
              try {
                await completeCashOrder(orderId);
                alert("Only Cash Payment Received! Order Completed.");
              } catch (e) {
                console.error("Cash completion failed", e);
                alert("Failed to update order. Check console.");
              }
            }}
          />

        )}
      </main>

      <Footer
        view={view}
        customerTab={customerTab}
        setCustomerTab={setCustomerTab}
        lang={lang}
        activeOrderIds={activeOrderIds}
      />

      {view === 'CUSTOMER' && customerTab === 'MENU' && cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-[110] animate-slide-up-full pointer-events-none">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-[#006638] text-white p-5 rounded-[28px] shadow-2xl flex justify-between items-center group relative z-50 pointer-events-auto active:scale-95 transition-all">
            <div className="flex items-center gap-4"><div className="bg-white/20 p-2 rounded-xl relative"><div className="w-5 h-5 bg-white text-[#006638] rounded-full text-[10px] font-black flex items-center justify-center absolute -top-1.5 -right-1.5">{cart.length}</div><ShoppingBag size={20} /></div><div className="text-left"><p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1">Cart Total</p><p className="text-lg font-black leading-none tracking-tight">₹{calculations.total}</p></div></div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] bg-white/10 px-4 py-2 rounded-xl">View Cart <ArrowRight size={16} /></div>
          </button>
        </div>
      )}

      <div className="no-print">
        <ItemDetailModal
          item={selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          lang={lang}
          addToCart={addToCart}
        />

        <CartModal
          isOpen={isCartOpen && view === 'CUSTOMER'}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          lang={lang}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          calculations={calculations}
          handleInitialCheckout={handleInitialCheckout}
        />

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          setStaffRole={setStaffRole}
          setView={setView}
        />

        <HistoryModal
          order={selectedHistoryOrder}
          onClose={() => setSelectedHistoryOrder(null)}
        />

        <AddMenuModal
          isOpen={isAddMenuModalOpen}
          onClose={() => setIsAddMenuModalOpen(false)}
          onAddDish={async (item) => { await addDish(item); setIsAddMenuModalOpen(false); }}
        />

        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />

        <QrModal
          tableNumber={selectedTableForQr}
          onClose={() => setSelectedTableForQr(null)}
          systemBaseUrl={systemBaseUrl}
        />

        <FilterModal
          isOpen={isFilterModalOpen && view === 'CUSTOMER'}
          onClose={() => setIsFilterModalOpen(false)}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        <CheckoutModal
          step={checkoutStep}
          customerName={customerName}
          setCustomerName={setCustomerName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          onPhoneSubmit={handlePhoneSubmit}


          otpArray={[]}
          handleOtpInput={() => { }}
          otpRefs={{ current: [] }}

          isBusy={isBusy}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          total={calculations.total}
          tableNumber={tableNumber}
          finalizeOrder={finalizeOrder}
          processOrder={verifyPayment}
          setStep={setCheckoutStep}
          cart={cart}
          guestId={guestId}
          onPaymentSuccess={closeSuccessAndTrack}
        />

        <SuccessModal
          step={checkoutStep}
          closeSuccessAndTrack={closeSuccessAndTrack}
        />
      </div>

      <div id="recaptcha-container-removed"></div>

    </div>
  );
};

export default App;