import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Clock, Calendar, ShieldCheck, Heart, AlertCircle, Info, PhoneCall, ExternalLink, Navigation } from 'lucide-react';
import Button from '../common/Button';
import FoodMap from '../map/FoodMap';
import { sileo } from 'sileo';

export default function FoodDetailModal({ food, isOpen, onClose, onRequest }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [food]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !food) return null;

  const title = food.title || food.foodName || 'Food Item';
  const category = food.category || 'Other';
  const quantity = food.availableQuantity !== undefined ? food.availableQuantity : food.quantity;
  const unit = food.quantityUnit || food.unit || 'units';
  const donorName = food.donor?.organizationName || food.donor?.fullName || food.donorName || 'Community Donor';
  const isVerified = food.donorVerified || food.isVerified || food.donor?.isPhoneVerified;

  // Safely format pickup address whether string or MongoDB object
  const pickupAddress = typeof food.pickupAddress === 'string'
    ? food.pickupAddress
    : food.pickupAddress && typeof food.pickupAddress === 'object'
      ? [food.pickupAddress.street, food.pickupAddress.city, food.pickupAddress.state, food.pickupAddress.postalCode].filter(Boolean).join(', ') || 'Local Area'
      : 'Address on request';

  const deadline = food.expiresAt
    ? new Date(food.expiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : (food.collectionDeadline || 'Today');
  const prepared = food.preparedAt
    ? new Date(food.preparedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : (food.preparationDate || 'Prepared today');

  const allImages = (food.images && food.images.length > 0)
    ? food.images
    : [food.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'];
  const currentImageUrl = allImages[activeImageIndex] || allImages[0];

  const handleRequest = () => {
    if (onRequest) {
      onClose();
      onRequest(food);
    } else {
      sileo.info({
        title: 'Food Request',
        description: `Requesting "${title}". Please log in as a Receiver to complete this action.`,
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-chocolate-700/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-chocolate/15 my-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-chocolate/80 hover:text-chocolate shadow-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Banner / Image */}
          <div className="relative h-64 sm:h-72 w-full bg-cream-200">
            <img
              src={currentImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Thumbnail switcher if multiple images */}
            {allImages.length > 1 && (
              <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-burntOrange ring-2 ring-white scale-105' : 'border-white/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange text-white shadow-sm">
                    {category}
                  </span>
                  {food.isVegetarian && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                      🌱 Vegetarian
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-2 drop-shadow-md">
                  {title}
                </h2>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-chocolate font-extrabold text-sm shadow-md">
                {quantity} {unit}
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Description */}
            <div>
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-chocolate/60">
                Description & Ingredients
              </h4>
              <p className="mt-2 text-sm sm:text-base text-chocolate/85 leading-relaxed">
                {food.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Preparation & Storage Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-cream-50 p-4 rounded-2xl border border-chocolate/10">
              <div className="space-y-1">
                <span className="text-xs font-bold text-chocolate/60 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-burntOrange" />
                  Prepared On
                </span>
                <p className="text-xs sm:text-sm font-semibold text-chocolate">
                  {prepared}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-chocolate/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amberPending" />
                  Collection Deadline
                </span>
                <p className="text-xs sm:text-sm font-semibold text-amberPending-dark">
                  {deadline}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-chocolate/60 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-chocolate" />
                  Storage Instructions
                </span>
                <p className="text-xs sm:text-sm text-chocolate/90">
                  {food.storageRequirements || food.storageInformation || 'Keep stored in safe conditions until pickup'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-chocolate/60 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-burntOrange" />
                  Condition & Handling Notes
                </span>
                <p className="text-xs sm:text-sm text-chocolate/90">
                  {food.condition ? `${food.condition}. ` : ''}
                  {food.pickupInstructions || food.handlingInformation || 'Bring clean containers or insulated bags.'}
                </p>
              </div>
            </div>

            {/* Donor & Pickup Information */}
            <div className="pt-2 border-t border-chocolate/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-chocolate/60">
                    Shared By
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-heading font-bold text-chocolate">
                      {donorName}
                    </span>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> OTP Verified Donor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-chocolate/80">
                  <MapPin className="w-4 h-4 text-burntOrange shrink-0 mt-0.5" />
                  <span>{pickupAddress}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-burntOrange hover:text-burntOrange-600 shrink-0 hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </a>
              </div>

              {/* Location Mini Map */}
              <div className="mt-2 rounded-2xl overflow-hidden border border-chocolate/10 shadow-sm">
                <FoodMap singleListing={food} height="160px" interactive={false} />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-cream-100 border-t border-chocolate/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-chocolate/70">
              Only verified community members and receivers can collect.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequest}
                leftIcon={<Heart className="w-4 h-4" />}
                className="flex-1 sm:flex-none"
              >
                Request This Food
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
