import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    query,
    serverTimestamp,
    where,
    orderBy,
    setDoc,
    addDoc,
    limit,
    getDocs,
    startAfter,
    QueryDocumentSnapshot,
    QuerySnapshot,
    DocumentData,
    deleteDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Order, OrderStatus, PaymentMethod } from "../types";

const COLLECTION_NAME = "orders";
const MENU_COLLECTION_NAME = "menu";

export const subscribeToStats = (
    callback: (stats: { revenue: number; orders: number; dailyData: any[] }) => void,
    dateFilter: { start: Date | null; end: Date | null } | null,
    onError?: (error: Error) => void
) => {
    // Basic query: isPaid == true
    let constraints: any[] = [where('isPaid', '==', true)];

    // Apply Date Filter if provided
    if (dateFilter?.start) {
        constraints.push(where('timestamp', '>=', dateFilter.start));
    }
    if (dateFilter?.end) {
        constraints.push(where('timestamp', '<=', dateFilter.end));
    }

    // Note: Composite index might be required for isPaid + timestamp
    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    return onSnapshot(q, (snapshot) => {
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalCash = 0;
        const dailyMap = new Map<string, number>();

        snapshot.forEach((doc) => {
            const data = doc.data();
            const orderTotal = parseFloat(data.total) || 0;
            totalRevenue += orderTotal;
            totalOrders++;

            // Cash Calculation
            const pm = (data.paymentMethod || '').toLowerCase();
            if (pm === 'cash') {
                totalCash += orderTotal;
            }

            // Daily Data Aggregation
            const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now());
            const date = new Date(timestamp);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

            // Simple aggregation by day name (for weekly view) - logic can be improved for specific dates
            // If we want a trend over time, we might need full date keys.
            // For now, matching the existing chart which uses "Mon", "Tue" etc.
            dailyMap.set(dayName, (dailyMap.get(dayName) || 0) + orderTotal);
        });

        // Fixed Days order for Chart
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dailyData = days.map(name => ({
            name,
            sales: dailyMap.get(name) || 0
        }));

        callback({ revenue: totalRevenue, orders: totalOrders, dailyData, totalCash });
    }, (error) => {
        console.error("Stats subscription error:", error);
        if (onError) onError(error);
    });
};


export const subscribeToOrders = (
    filterUserId: string | undefined,
    callback: (orders: Order[], isLocal: boolean) => void,
    onError?: (error: Error) => void,
    options: { includeMetadataChanges: boolean; isCustomerView?: boolean } = { includeMetadataChanges: true }
) => {
    if (filterUserId === undefined && options.isCustomerView) {
        console.warn("[Firestore] Skipping subscription: isCustomerView but filterUserId is undefined");
        return () => { };
    }

    let q;

    try {
        if (filterUserId) {
            const isPhoneNumber = /^\d{10,}$/.test(filterUserId);

            if (isPhoneNumber) {
                console.log("[Firestore] Subscribing to customerPhone:", filterUserId);
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("customerPhone", "==", filterUserId)
                );
            } else {
                console.log("[Firestore] Subscribing to userId (Guest):", filterUserId);
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", filterUserId)
                );
            }
        } else {
            const activeStatuses = [
                "PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED",
                "Pending", "Confirmed", "Preparing", "Ready", "Served"
            ];

            q = query(
                collection(db, COLLECTION_NAME),
                where("status", "in", activeStatuses),
                limit(100)
            );
        }
    } catch (e) {
        console.error("[Firestore] Query Creation Error:", e);
        if (onError) onError(e as Error);
        return () => { };
    }

    return onSnapshot(
        q,
        { includeMetadataChanges: options.includeMetadataChanges },
        (snapshot: QuerySnapshot<DocumentData>) => {
            const uniqueOrders = new Map<string, Order>();

            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data() as Order;
                const orderId = data?.id ?? docSnap.id;
                if (!orderId) return;
                // Always attach Firestore document ID so updateOrderStatus(docId) works; required for updateDoc
                const order: Order = { ...data, id: orderId, firebaseDocId: docSnap.id };
                uniqueOrders.set(orderId, order);
            });

            const orders = Array.from(uniqueOrders.values()).sort((a, b) => {
                // Handle both Firestore Timestamp and number
                const getMillis = (t: any) => t?.toMillis ? t.toMillis() : (t || 0);
                return getMillis(b.timestamp) - getMillis(a.timestamp);
            });

            const fromCache = snapshot.metadata.fromCache;
            const hasPendingWrites = snapshot.metadata.hasPendingWrites;
            const isLocal = hasPendingWrites || fromCache;

            console.log("[Firestore] Snapshot Update:", {
                count: orders.length,
                isLocal
            });
            console.log("Fetched Orders:", orders.length);

            callback(orders, isLocal);
        },
        (error) => {
            console.error("Error subscribing to orders:", error);
            if (onError) onError(error);
        }
    );
};

export const fetchHistoryOrders = async (
    lastDoc: QueryDocumentSnapshot | null = null,
    limitCount = 20,
    startDate: Date | null = null,
    endDate: Date | null = null
) => {
    try {
        const constraints: any[] = [
            orderBy("timestamp", "desc")
        ];

        if (startDate) {
            constraints.push(where("timestamp", ">=", startDate));
        }
        if (endDate) {
            constraints.push(where("timestamp", "<=", endDate));
        }

        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, COLLECTION_NAME), ...constraints);

        const snapshot = await getDocs(q);
        const orders: Order[] = [];
        snapshot.forEach((doc) => orders.push({ ...(doc.data() as any), firebaseDocId: doc.id } as Order));

        return {
            orders,
            lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
            empty: snapshot.empty
        };
    } catch (e) {
        console.error("Error fetching history:", e);
        throw e;
    }
};

export const addOrder = async (order: Order) => {
    try {
        console.log("[Firestore] addOrder -> write to cloud (Auto-ID)", {
            displayId: order.id,
            tableNumber: order.tableNumber,
            total: order.total,
        });

        const cleanPhone = order.customerPhone ? order.customerPhone.replace(/\D/g, '').slice(-10) : '';
        const initialStatus = order.status ? order.status.toUpperCase() : 'PENDING';

        const orderData = {
            ...order,
            customerPhone: cleanPhone,
            timestamp: serverTimestamp(),
            status: initialStatus,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), orderData);

        console.log("[Firestore] addOrder successful", {
            firebaseDocId: docRef.id,
            displayId: order.id
        });

        // Return the auto-generated ID
        return docRef.id;

    } catch (e) {
        console.error("Error adding order: ", e);
        throw e;
    }
};

export const updateOrderStatus = async (docId: string, status: OrderStatus) => {
    try {
        console.log("[Firestore] updateOrderStatus", { docId, status });
        console.log("Firestore Updated:", status);
        const orderRef = doc(db, COLLECTION_NAME, docId);

        await updateDoc(orderRef, {
            status: status,
            orderStatus: status, // Backward compatibility
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error updating order status: ", e);
        throw e;
    }
};

export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: "Paid" | "Unpaid",
    paymentMethod?: PaymentMethod
) => {
    try {
        console.log("[Firestore] updatePaymentStatus", {
            orderId,
            paymentStatus,
            paymentMethod,
        });

        const orderRef = doc(db, COLLECTION_NAME, orderId);
        const updateData: any = { paymentStatus };
        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }
        await updateDoc(orderRef, updateData);
    } catch (e) {
        console.error("Error updating payment status: ", e);
        throw e;
    }
};



export const subscribeToMenu = (
    callback: (menu: any[]) => void, // using any[] to allow mapping
    onError?: (error: Error) => void
) => {
    console.log("[Firestore] Fetching Menu Collection...");
    const q = query(collection(db, MENU_COLLECTION_NAME));

    return onSnapshot(
        q,
        (snapshot) => {
            console.log("[Firestore] Menu items found:", snapshot.size);
            const menuItems: any[] = [];
            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                let name = data.name;

                // Handle string vs object name
                if (typeof name === 'string') {
                    name = { en: name, hi: name };
                } else if (!name) {
                    name = { en: 'Untitled Item', hi: 'Untitled Item' };
                } else if (typeof name === 'object' && !name.en && !name.hi) {
                    // data.name existed but wasn't {en, hi} - unlikely but safe
                    name = { en: JSON.stringify(name), hi: '' };
                }

                // Push with ID
                menuItems.push({
                    ...data,
                    id: docSnap.id,
                    name,
                    price: Number(data.price) || 0,
                    // If isAvailable undefined, default true
                    isAvailable: data.isAvailable !== false,
                    category: data.category || 'Main Course',
                    isVeg: data.isVeg === true,
                    // imageUrl fallback
                    imageUrl: data.imageUrl || data.image || '',
                });
            });
            callback(menuItems);
        },
        (error) => {
            console.error("Error fetching menu:", error);
            if (onError) onError(error);
        }
    );
};

export const addDish = async (dish: any) => {
    try {
        console.log("[Firestore] Adding Dish:", dish);
        // Ensure price is number
        const data: any = { ...dish, price: Number(dish.price), createdAt: serverTimestamp() };
        delete data.id; // Let firestore generate ID

        await addDoc(collection(db, MENU_COLLECTION_NAME), data);
    } catch (e) {
        console.error("Error adding dish:", e);
        throw e;
    }
};

export const updateDish = async (id: string, updates: any) => {
    try {
        console.log("[Firestore] Updating Dish:", id, updates);
        const docRef = doc(db, MENU_COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    } catch (e) {
        console.error("Error updating dish:", e);
        throw e;
    }
};

export const deleteDish = async (id: string) => {
    try {
        console.log("[Firestore] Deleting Dish:", id);
        const docRef = doc(db, MENU_COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Error deleting dish:", e);
        throw e;
    }
};

export const completeCashOrder = async (docId: string) => {
    try {
        console.log("[Firestore] completeCashOrder", { docId });
        const orderRef = doc(db, COLLECTION_NAME, docId);
        await updateDoc(orderRef, {
            status: 'COMPLETED',
            isPaid: true,
            paymentStatus: 'Paid',
            completedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error completing cash order:", e);
        throw e;
    }
};

export const completeOnlineOrder = async (docId: string, paymentId?: string) => {
    try {
        console.log("[Firestore] completeOnlineOrder", { docId, paymentId });
        const orderRef = doc(db, COLLECTION_NAME, docId);
        await updateDoc(orderRef, {
            status: 'COMPLETED',
            isPaid: true,
            paymentStatus: 'Paid',
            razorpayPaymentId: paymentId || 'online_simulated',
            completedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Error completing online order:", e);
        throw e;
    }
};
