import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Utensils,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Upload,
  Phone,
} from 'lucide-react';
import { sileo } from 'sileo';
import Button from '../common/Button';
import otpService from '../../services/otp.service';
import api from '../../services/api';
import OTPVerificationModal from './OTPVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { isUsablePhone } from '../../utils/phone';

export default function AddFoodModal({ isOpen, onClose, onListingCreated }) {
  const { user, refreshUser } = useAuth();

  // Initial preparation & expiry defaults
  const now = new Date();
  const formatDatetimeLocal = (d) => {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultPrep = formatDatetimeLocal(now);
  const defaultExp = formatDatetimeLocal(new Date(now.getTime() + 8 * 60 * 60 * 1000)); // +8 hours

  const [formData, setFormData] = useState({
    title: '',
    category: 'Cooked Meals',
    description: '',
    quantity: '',
    quantityUnit: 'meals',
    preparedAt: defaultPrep,
    expiresAt: defaultExp,
    condition: 'Freshly Prepared',
    isVegetarian: true,
    storageRequirements: 'Room Temperature',
    pickupAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || 'New Delhi',
      state: user?.address?.state || 'Delhi',
      postalCode: user?.address?.postalCode || '110001',
    },
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'],
    pickupInstructions: '',
  });

  const [imageUrlInput, setImageUrlInput] = useState(
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contactPhone, setContactPhone] = useState(() =>
    isUsablePhone(user?.phone) ? user.phone.trim() : ''
  );

  const storedPhone = user?.phone || '';
  const needsPhone = !isUsablePhone(storedPhone);

  // Keep the field in sync if the authenticated user loads/changes after mount.
  useEffect(() => {
    if (!contactPhone && isUsablePhone(storedPhone)) {
      setContactPhone(storedPhone.trim());
    }
  }, [storedPhone, contactPhone]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        sileo.error({ title: 'File Too Large', description: `${file.name} exceeds 5MB limit.` });
        return;
      }
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      files.forEach((file) => uploadFormData.append('images', file));

      const res = await api.post('/upload/image', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.urls?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: res.data.urls,
        }));
        setImageUrlInput(res.data.urls[0]);
        sileo.success({ title: 'Image Uploaded', description: 'Listing photo saved successfully.' });
      }
    } catch (err) {
      console.warn('Upload error, using local data URL fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrlInput(reader.result);
        setFormData((prev) => ({ ...prev, images: [reader.result] }));
        sileo.success({ title: 'Image Ready', description: 'Photo attached to listing.' });
      };
      reader.readAsDataURL(files[0]);
    } finally {
      setUploadingImage(false);
    }
  };

  const categories = [
    'Cooked Meals',
    'Rice and Grains',
    'Fruits',
    'Vegetables',
    'Bakery',
    'Dairy Products',
    'Packaged Food',
    'Other',
  ];

  const presetImages = {
    'Cooked Meals': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'Rice and Grains': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    Fruits: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80',
    Vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    'Dairy Products': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
    'Packaged Food': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=800&auto=format&fit=crop&q=80',
    Other: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
  };

  const handleCategoryChange = (cat) => {
    const updated = {
      ...formData,
      category: cat,
      quantityUnit: cat === 'Cooked Meals' ? 'meals' : 'kg',
      images: [presetImages[cat] || presetImages['Cooked Meals']],
    };
    setImageUrlInput(presetImages[cat] || presetImages['Cooked Meals']);
    setFormData(updated);
  };

  const formatQuantityInput = () => {
    const value = Number(formData.quantity);
    if (Number.isFinite(value) && value > 0) {
      setFormData((prev) => ({ ...prev, quantity: value.toFixed(2) }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Food title is required';
    }

    if (!formData.quantity || !Number.isFinite(Number(formData.quantity)) || Number(formData.quantity) < 0.1) {
      newErrors.quantity = 'Quantity must be at least 0.1';
    }

    if (!formData.preparedAt) {
      newErrors.preparedAt = 'Preparation date and time is required';
    }

    if (!formData.expiresAt) {
      newErrors.expiresAt = 'Expiry date and time is required';
    } else {
      const prep = new Date(formData.preparedAt);
      const exp = new Date(formData.expiresAt);
      const current = new Date();

      if (exp <= prep) {
        newErrors.expiresAt = 'Expiry must be strictly after preparation time';
      } else if (exp <= current) {
        newErrors.expiresAt = 'Cannot publish expired food. Expiry must be in the future';
      }
    }

    if (!formData.pickupAddress.city.trim()) {
      newErrors.city = 'City is required for pickup coordination';
    }

    if (!isUsablePhone(contactPhone) && !isUsablePhone(storedPhone)) {
      newErrors.contactPhone =
        'A mobile number is required to receive the SMS verification code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      sileo.error({
        title: 'Validation Error',
        description: 'Please correct the highlighted fields before proceeding.',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(Number(formData.quantity).toFixed(2)),
        images: imageUrlInput.trim() ? [imageUrlInput.trim()] : formData.images,
      };

      // Request OTP from backend. Use the number entered by the user when the
      // account has no real phone yet (for example a Google OAuth sign-up).
      const phoneToUse = isUsablePhone(contactPhone)
        ? contactPhone.trim()
        : storedPhone.trim();

      const result = await otpService.sendListingOtp({
        phone: phoneToUse,
        listingData: payload,
      });

      if (result.phoneSaved && refreshUser) {
        await refreshUser();
      }

      setVerificationData(result);
      setOtpModalOpen(true);
    } catch (err) {
      sileo.error({
        title: 'Request Failed',
        description: err.response?.data?.message || 'Could not initiate OTP verification.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-chocolate/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-chocolate/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-burntOrange/10 text-burntOrange flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-chocolate tracking-tight">
                    Add Surplus Food Listing
                  </h2>
                  <p className="text-xs text-chocolate/70">
                    Share surplus food with verified local community shelters & NGOs.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-chocolate/50 hover:text-chocolate hover:bg-cream-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Food Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Food Name / Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) setErrors({ ...errors, title: null });
                    }}
                    placeholder="e.g. Fresh Vegetable Biryani"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.title ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-softRed font-semibold">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Food Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:border-burntOrange transition-all cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    inputMode="decimal"
                    value={formData.quantity}
                    onBlur={formatQuantityInput}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      if (errors.quantity) setErrors({ ...errors, quantity: null });
                    }}
                    placeholder="e.g. 25.00"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.quantity ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                  {errors.quantity ? (
                    <p className="mt-1 text-xs text-softRed font-semibold">{errors.quantity}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-chocolate/55">
                      Whole numbers display as .00; up to two decimal places are allowed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Unit of Measurement *
                  </label>
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:border-burntOrange transition-all cursor-pointer"
                  >
                    <option value="meals">meals (cooked servings)</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="grams">grams</option>
                    <option value="litres">litres</option>
                    <option value="packets">packets / sealed items</option>
                  </select>
                </div>
              </div>

              {/* 3. Prep Time & Expiry Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Preparation Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.preparedAt}
                    onChange={(e) => setFormData({ ...formData, preparedAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:border-burntOrange transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">
                    Expiry Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => {
                      setFormData({ ...formData, expiresAt: e.target.value });
                      if (errors.expiresAt) setErrors({ ...errors, expiresAt: null });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.expiresAt ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                  {errors.expiresAt && (
                    <p className="mt-1 text-xs text-softRed font-semibold">{errors.expiresAt}</p>
                  )}
                </div>
              </div>

              {/* 4. Condition, Storage, Veg Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange"
                  >
                    <option value="Freshly Prepared">Freshly Prepared</option>
                    <option value="Good Condition">Good Condition</option>
                    <option value="Packaged Unopened">Packaged Unopened</option>
                    <option value="Surplus Harvest">Surplus Harvest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">Storage</label>
                  <select
                    value={formData.storageRequirements}
                    onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange"
                  >
                    <option value="Room Temperature">Room Temperature</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Cool & Dry">Cool & Dry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate mb-1.5">Dietary Type</label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVegetarian: true })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        formData.isVegetarian
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-500 shadow-sm'
                          : 'bg-white text-chocolate/60 border-chocolate/15'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVegetarian: false })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        !formData.isVegetarian
                          ? 'bg-red-100 text-red-800 border-red-500 shadow-sm'
                          : 'bg-white text-chocolate/60 border-chocolate/15'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Description */}
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe items, packaging, allergens or special handling..."
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:border-burntOrange transition-all"
                />
              </div>

              {/* 6. Pickup Address & Instructions */}
              <div className="p-4 rounded-2xl bg-cream-100/60 border border-chocolate/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-heading text-chocolate">
                  <MapPin className="w-4 h-4 text-burntOrange" />
                  <span>Pickup Location & Address</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={formData.pickupAddress.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickupAddress: { ...formData.pickupAddress, street: e.target.value },
                        })
                      }
                      placeholder="Street / Landmark Address"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-chocolate/15 text-xs text-chocolate"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={formData.pickupAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickupAddress: { ...formData.pickupAddress, city: e.target.value },
                        })
                      }
                      placeholder="City (e.g. New Delhi)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-chocolate/15 text-xs text-chocolate"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.pickupInstructions}
                    onChange={(e) => setFormData({ ...formData, pickupInstructions: e.target.value })}
                    placeholder="Pickup instructions (e.g. Call Rajesh upon arrival at rear gate)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-chocolate/15 text-xs text-chocolate"
                  />
                </div>
              </div>

              {/* 6b. Contact mobile number (only when the account has none) */}
              {needsPhone && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-xs font-bold font-heading text-amber-900 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>Mobile Number for SMS Verification *</span>
                  </div>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (errors.contactPhone) {
                        setErrors({ ...errors, contactPhone: null });
                      }
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.contactPhone
                        ? 'border-softRed'
                        : 'border-amber-300 focus:border-burntOrange'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs text-softRed font-semibold">
                      {errors.contactPhone}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-amber-900/80 leading-snug">
                    We need a mobile number to text your one-time verification code. It will be
                    saved to your profile and shown to the receiver for pickup coordination.
                  </p>
                </div>
              )}

              {/* 7. Image Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5 flex items-center justify-between">
                  <span>Food Photos & Image</span>
                  <span className="text-[11px] font-normal text-chocolate/60">
                    Upload photos (max 5MB) or enter URL
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-chocolate/15 shrink-0 bg-cream-100 shadow-sm">
                    <img
                      src={imageUrlInput}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = presetImages['Cooked Meals'];
                      }}
                    />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          setFormData({ ...formData, images: [e.target.value] });
                        }}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange"
                      />
                      <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-chocolate/20 hover:border-burntOrange text-xs font-bold text-chocolate flex items-center gap-1.5 transition-colors shadow-sm shrink-0">
                        <Upload className="w-3.5 h-3.5 text-burntOrange" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-chocolate/10 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="shadow-clay-btn px-6"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Continue to Phone OTP Verification
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* OTP Verification Modal Step */}
      <OTPVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        verificationData={verificationData}
        onVerificationSuccess={(newListing) => {
          if (onListingCreated) onListingCreated(newListing);
          onClose();
        }}
      />
    </>
  );
}
