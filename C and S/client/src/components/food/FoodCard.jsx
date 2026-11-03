import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Tag, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function FoodCard({ food, onSelect }) {
  const [imageError, setImageError] = useState(false);

  const categoryColors = {
    'Cooked Meals': 'bg-orange-100 text-orange-800 border-orange-200',
    'Rice and Grains': 'bg-amber-100 text-amber-900 border-amber-200',
    'Fruits': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Vegetables': 'bg-green-100 text-green-800 border-green-200',
    'Bakery': 'bg-amber-100 text-amber-900 border-amber-200',
    'Dairy Products': 'bg-sky-100 text-sky-800 border-sky-200',
    'Packaged Food': 'bg-blue-100 text-blue-800 border-blue-200',
    'Groceries': 'bg-purple-100 text-purple-800 border-purple-200',
    'Other': 'bg-stone-100 text-stone-800 border-stone-200',
  };

  const statusColors = {
    Available: 'bg-emerald-600 text-white',
    'Pending Verification': 'bg-amber-500 text-white',
    'Fully Requested': 'bg-indigo-600 text-white',
    Reserved: 'bg-amber-600 text-white',
    Completed: 'bg-stone-400 text-white',
    Expired: 'bg-red-500 text-white',
  };

  const title = food.title || food.foodName || 'Surplus Food';
  const category = food.category || 'Other';
  const quantity = food.availableQuantity !== undefined ? food.availableQuantity : food.quantity;
  const unit = food.quantityUnit || food.unit || 'units';
  const donorName = food.donor?.organizationName || food.donor?.fullName || food.donorName || 'Community Donor';
  const isVerified = food.donorVerified || food.isVerified || food.donor?.isPhoneVerified;
  
  // Safely format pickup address whether string or MongoDB object
  const pickupAddress = typeof food.pickupAddress === 'string'
    ? food.pickupAddress
    : food.pickupAddress && typeof food.pickupAddress === 'object'
      ? [food.pickupAddress.street, food.pickupAddress.city].filter(Boolean).join(', ') || 'Local Area'
      : 'Address on request';

  const deadline = food.expiresAt
    ? new Date(food.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : (food.collectionDeadline || 'Today');

  const defaultImage =
    (food.images && food.images.length > 0 ? food.images[0] : null) ||
    food.imageUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="clay-card overflow-hidden flex flex-col justify-between bg-white group border border-chocolate/10 hover:border-burntOrange/30 shadow-clay-card hover:shadow-clay-card-hover"
    >
      <div>
        {/* Card Header & Image */}
        <div className="relative h-48 w-full overflow-hidden bg-cream-200">
          <img
            src={imageError ? 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80' : defaultImage}
            alt={title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Status Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 shadow-sm">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[food.status] || 'bg-emerald-600 text-white'}`}>
              {food.status || 'Available'}
            </span>
          </div>

          {/* Category & Veg Pill */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-sm ${categoryColors[category] || 'bg-white/90 text-chocolate border-chocolate/20'}`}>
              {category}
            </span>
            {food.isVegetarian && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                🌱 Veg
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-bold text-lg text-chocolate group-hover:text-burntOrange transition-colors line-clamp-1">
              {title}
            </h3>
            <span className="shrink-0 px-2.5 py-1 rounded-md bg-burntOrange/10 text-burntOrange font-extrabold text-xs">
              {quantity} {unit}
            </span>
          </div>

          <p className="mt-2 text-xs text-chocolate/70 line-clamp-2 leading-relaxed">
            {food.description || 'No description provided.'}
          </p>

          <div className="mt-4 pt-3 border-t border-chocolate/10 space-y-2 text-xs">
            {/* Donor */}
            <div className="flex items-center gap-2 text-chocolate/80">
              <User className="w-3.5 h-3.5 text-burntOrange shrink-0" />
              <span className="truncate font-medium">{donorName}</span>
              {isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Donor" />
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-chocolate/80">
              <MapPin className="w-3.5 h-3.5 text-burntOrange shrink-0" />
              <span className="truncate">{pickupAddress}</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-chocolate/80">
              <Clock className="w-3.5 h-3.5 text-amberPending shrink-0" />
              <span className="font-medium text-amberPending-dark">
                Collect before: {deadline}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer CTA */}
      <div className="p-5 pt-0 mt-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full flex items-center justify-center gap-1.5"
          onClick={() => onSelect && onSelect(food)}
        >
          <span>View Details & Request</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
