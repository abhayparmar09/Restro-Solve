import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const MENU_COLLECTION_NAME = 'menu';

export const restoreMenu = async () => {
    console.log('[Firestore] Restoration started...');

    const dishes = [
        { name: { en: "Paneer Tikka", hi: "पनीर टिक्का" }, price: 240, type: "veg", category: "Starters", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500", description: { en: "Classic grilled paneer", hi: "मसालों के साथ ग्रिल्ड पनीर" }, isAvailable: true },
        { name: { en: "Butter Chicken", hi: "बटर चिकन" }, price: 380, type: "non-veg", category: "Main Course", image: "https://images.unsplash.com/photo-1603894584134-f132f1783bb3?w=500", description: { en: "Rich creamy tomato gravy", hi: "मलाईदार टमाटर करी" }, isAvailable: true },
        { name: { en: "Veg Biryani", hi: "वेज बिरयानी" }, price: 260, type: "veg", category: "Main Course", image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=500", description: { en: "Aromatic basmati rice with veggies", hi: "सब्जियों के साथ सुगंधित चावल" }, isAvailable: true },
        { name: { en: "Chicken 65", hi: "चिकन 65" }, price: 290, type: "non-veg", category: "Starters", image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500", description: { en: "Spicy deep-fried chicken", hi: "मसालेदार डीप-फ्राइड चिकन" }, isAvailable: true },
        { name: { en: "Dal Makhani", hi: "दाल मखनी" }, price: 220, type: "veg", category: "Main Course", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500", description: { en: "Slow cooked black lentils", hi: "मक्खन वाली काली दाल" }, isAvailable: true },
        { name: { en: "Garlic Naan", hi: "गार्लिक नान" }, price: 60, type: "veg", category: "Breads", image: "https://images.unsplash.com/photo-1601050633647-81a35d37765a?w=500", description: { en: "Soft bread with garlic and butter", hi: "लहसुन और मक्खन वाला नान" }, isAvailable: true },
        { name: { en: "Chilli Chicken", hi: "चिल्ली चिकन" }, price: 310, type: "non-veg", category: "Chinese", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500", description: { en: "Indo-Chinese spicy chicken", hi: "इंडो-चाइनीज मसालेदार चिकन" }, isAvailable: true },
        { name: { en: "Crispy Corn", hi: "क्रिस्पी कॉर्न" }, price: 180, type: "veg", category: "Starters", image: "https://images.unsplash.com/photo-1514516369414-7977730277b5?w=500", description: { en: "Deep fried spicy sweet corn", hi: "मसालेदार कुरकुरे मकई" }, isAvailable: true },
        { name: { en: "Veg Manchurian", hi: "वेज मंचूरियन" }, price: 210, type: "veg", category: "Chinese", image: "https://images.unsplash.com/photo-1512058560366-cd2427ff086d?w=500", description: { en: "Veggie balls in spicy gravy", hi: "मसालेदार ग्रेवी में वेजी बॉल्स" }, isAvailable: true },
        { name: { en: "Mutton Rogan Josh", hi: "मटन रोगन जोश" }, price: 450, type: "non-veg", category: "Main Course", image: "https://images.unsplash.com/photo-1589187151003-0dd30df6f387?w=500", description: { en: "Kashmiri style mutton curry", hi: "कश्मीरी शैली की मटन करी" }, isAvailable: true },
        { name: { en: "Gulab Jamun", hi: "गुलाब जामुन" }, price: 80, type: "veg", category: "Dessert", image: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=500", description: { en: "Sweet milk solid balls in syrup", hi: "चाशनी में डूबे गुलाब जामुन" }, isAvailable: true },
        { name: { en: "Masala Chai", hi: "मसाला चाय" }, price: 40, type: "veg", category: "Beverages", image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500", description: { en: "Traditional Indian spiced tea", hi: "पारंपरिक भारतीय मसाला चाय" }, isAvailable: true },
        { name: { en: "Hakke Noodles", hi: "हक्का नूडल्स" }, price: 190, type: "veg", category: "Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500", description: { en: "Stir fried noodles with veggies", hi: "सब्जियों के साथ fried noodles" }, isAvailable: true },
        { name: { en: "Chicken Biryani", hi: "चिकन बिरयानी" }, price: 340, type: "non-veg", category: "Main Course", image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=500", description: { en: "Classic chicken biryani", hi: "लाजवाब चिकन बिरयानी" }, isAvailable: true },
        { name: { en: "Mix Veg", hi: "मिक्स वेज" }, price: 200, type: "veg", category: "Main Course", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500", description: { en: "Assorted vegetables in gravy", hi: "मसालेदार मिक्स वेज" }, isAvailable: true },
        { name: { en: "Cold Coffee", hi: "कोल्ड कॉफी" }, price: 120, type: "veg", category: "Beverages", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500", description: { en: "Creamy iced coffee", hi: "क्रीमी कोल्ड कॉफी" }, isAvailable: true },
        { name: { en: "French Fries", hi: "फ्रेंच फ्राइज़" }, price: 130, type: "veg", category: "Starters", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", description: { en: "Crispy salted fries", hi: "कुरकुरे आलू फ्राइज़" }, isAvailable: true },
        { name: { en: "Tandoori Chicken", hi: "तंदूरी चिकन" }, price: 320, type: "non-veg", category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500", description: { en: "Roasted chicken with spices", hi: "तंदूरी मसाला रोस्ट चिकन" }, isAvailable: true },
        { name: { en: "Malai Kofta", hi: "मलाई कोफ्ता" }, price: 280, type: "veg", category: "Main Course", image: "https://images.unsplash.com/photo-1601050633647-81a35d37765a?w=500", description: { en: "Creamy paneer balls in gravy", hi: "मलाईदार कोफ्ता करी" }, isAvailable: true },
        { name: { en: "Lassi", hi: "लस्सी" }, price: 90, type: "veg", category: "Beverages", image: "https://images.unsplash.com/photo-1571115177098-24ec42ed2bb4?w=500", description: { en: "Thick sweet yogurt drink", hi: "मीठी ठंडी लस्सी" }, isAvailable: true }
    ];

    let count = 0;
    for (const dish of dishes) {
        try {
            await addDoc(collection(db, MENU_COLLECTION_NAME), {
                ...dish,
                imageUrl: dish.image,
                isVeg: dish.type === 'veg',
                createdAt: serverTimestamp()
            });
            count++;
            console.log(`[Firestore] Added: ${dish.name.en}`);
        } catch (e) {
            console.error(`[Firestore] Failed to add ${dish.name.en}:`, e);
        }
    }
    console.log(`[Firestore] Restoration Complete! Added ${count} items.`);
    return count;
};
