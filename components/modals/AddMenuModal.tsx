import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { MenuItem, Category } from '../../types';
import { CATEGORIES } from '../../constants';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompression';

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDish: (item: MenuItem) => void;
}

const AddMenuModal: React.FC<AddMenuModalProps> = ({ isOpen, onClose, onAddDish }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: { en: '', hi: '' },
    description: { en: '', hi: '' },
    price: 0,
    category: 'Main Course',
    isVeg: true,
    dietType: 'veg',
    isAvailable: true,
    image: ''
  });

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const previewUrl = URL.createObjectURL(file);
      setNewItem(prev => ({ ...prev, image: previewUrl }));
    }
  };

  const handleSubmit = async () => {
    // Validate English Name and Price
    if (!newItem.name?.en || !newItem.price) {
      alert("Please enter Name (English) and Price.");
      return;
    }

    setIsUploading(true); // Start Loading

    try {
      let finalImageUrl = "";

      if (selectedFile) {
        const compressedFile = await compressImage(selectedFile);

        const storageRef = ref(storage, `menu/${Date.now()}_${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        const uploadResult = await uploadBytes(storageRef, compressedFile);
        finalImageUrl = await getDownloadURL(uploadResult.ref);
      } else if (newItem.image?.startsWith('blob:')) {
        // Fallback if blob but no file object
        finalImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400";
      }

      const dishData = {
        name: {
          en: newItem.name!.en,
          hi: newItem.name!.hi || newItem.name!.en
        },
        description: {
          en: newItem.description?.en || '',
          hi: newItem.description?.hi || ''
        },
        price: Number(newItem.price),
        category: (newItem.category as Category) || 'Main Course',
        image: finalImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
        imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
        isVeg: newItem.isVeg,
        isAvailable: true,
        dietType: newItem.dietType,
        type: newItem.isVeg ? 'veg' : 'non-veg',
        createdAt: serverTimestamp()
      };

      // 3. Firestore Write
      await addDoc(collection(db, 'menu'), dishData);

      // Success feedback
      setIsUploading(false);
      setShowSuccess(true);

      // Close after short delay
      setTimeout(() => {
        setShowSuccess(false);
        // Reset Form
        setNewItem({
          name: { en: '', hi: '' },
          description: { en: '', hi: '' },
          price: 0,
          category: 'Main Course',
          isVeg: true,
          dietType: 'veg',
          image: ''
        });
        setSelectedFile(null);
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error("Storage/Firestore Error:", error);
      setIsUploading(false); // <--- THIS MUST RUN TO STOP THE SPINNER

      // Alert the user about CORS or Permission issues
      if (error.message?.includes('CORS') || error.code === 'storage/unauthorized') {
        alert("Upload Failed: CORS or Permission Error.\n\n1. Check your internet.\n2. Ensure 'gsutil cors set' was run.\n3. Check Storage Rules.");
      } else {
        alert("Failed to add dish: " + (error.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>

      {/* Success Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-[3100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 flex flex-col items-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-[#006638] mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Dish Added!</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Menu Updated Successfully</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-[#006638] text-white shrink-0">
          <div>
            <h3 className="text-xl font-black tracking-tight uppercase">New Menu Entry</h3>
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-1">Expanding the kitchen catalog</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-xl text-white hover:bg-rose-500 transition-all shadow-sm"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 touch-pan-y">

          {/* Image Upload */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dish Photo</p>
            <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`w-full h-40 rounded-[24px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden transition-all hover:border-[#006638] hover:bg-emerald-50/30 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {newItem.image ? (
                <img src={newItem.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-[#006638]">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-100 transition-colors shadow-inner">
                    <Upload size={24} />
                  </div>
                  <p className="font-black text-[9px] uppercase tracking-widest">Select Photo</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Language Tabs */}
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-2">
            {(['en', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLang === lang ? 'bg-white text-[#006638] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {lang === 'en' ? '🇬🇧 English' : '🇮🇳 Hindi'}
              </button>
            ))}
          </div>

          {/* Tabs Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Dish Name ({activeLang === 'en' ? 'English' : 'Hindi'})
              </p>
              <input
                type="text"
                placeholder={activeLang === 'en' ? "e.g. Butter Chicken" : "उदा. बटर चिकन"}
                value={newItem.name?.[activeLang]}
                onChange={e => setNewItem(p => ({ ...p, name: { ...p.name!, [activeLang]: e.target.value } }))}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#006638] transition-all"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Description ({activeLang === 'en' ? 'English' : 'Hindi'})
              </p>
              <textarea
                placeholder={activeLang === 'en' ? "Describe ingredients and taste..." : "स्वाद और सामग्री का वर्णन करें..."}
                value={newItem.description?.[activeLang]}
                onChange={e => setNewItem(p => ({ ...p, description: { ...p.description!, [activeLang]: e.target.value } }))}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-medium outline-none focus:border-[#006638] h-24 resize-none transition-all"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</p>
              <input
                type="number"
                placeholder="0.00"
                value={newItem.price || ''}
                onChange={e => setNewItem(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-black outline-none focus:border-[#006638]"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</p>
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value as Category }))}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#006638] appearance-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Diet Type */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diet Type</p>
            <div className="grid grid-cols-4 gap-2">
              {(['veg', 'non-veg', 'vegan', 'egg'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setNewItem(p => ({ ...p, dietType: type, isVeg: type === 'veg' || type === 'vegan' }))}
                  className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${newItem.dietType === type
                    ? 'border-[#006638] bg-emerald-50 text-[#006638]'
                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 flex gap-4 bg-slate-50/50 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-white shadow-sm hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || showSuccess}
            className={`flex-[2] py-4 bg-[#006638] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border border-emerald-700 hover:bg-emerald-800 transition-colors ${isUploading || showSuccess ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : showSuccess ? 'Done!' : 'Add Dish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMenuModal;
