import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Users, Clock, AlertCircle, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { sileo } from 'sileo';
import Button from '../common/Button';
import requestService from '../../services/request.service';
import { useAuth } from '../../context/AuthContext';

export default function RequestFoodModal({ isOpen, onClose, listing, onRequestSubmitted }) {
  const { user } = useAuth();

  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [beneficiaryCount, setBeneficiaryCount] = useState('5');
  const [purpose, setPurpose] = useState('Community meal distribution');
  const [pickupPreference, setPickupPreference] = useState('Within 2 hours');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !listing) return null;

  const maxAvailable = listing.availableQuantity || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const qty = Number(requestedQuantity);
    if (!qty || qty <= 0) {
      setErrorMsg('Requested quantity must be greater than zero.');
      return;
    }

    if (qty > maxAvailable) {
      setErrorMsg(`Cannot request more than available quantity (${maxAvailable} ${listing.quantityUnit}).`);
      return;
    }

    setLoading(true);

    try {
      const result = await requestService.createFoodRequest({
        listingId: listing._id || listing.id,
        requestedQuantity: qty,
        beneficiaryCount: Number(beneficiaryCount) || 1,
        purpose,
        pickupPreference,
        notes,
      });

      sileo.success({
        title: 'Request Submitted!',
        description: `Your request for ${qty} ${listing.quantityUnit} was dispatched to ${listing.donor?.fullName || 'the donor'}.`,
      });

      if (onRequestSubmitted) {
        onRequestSubmitted(result.request);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit food request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-chocolate/50 hover:text-chocolate hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-5 pb-4 border-b border-chocolate/10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
              <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>Surplus Food Rescue Request</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-chocolate tracking-tight">
              Request {listing.title}
            </h2>
            <p className="text-xs text-chocolate/70 mt-1">
              Offered by <strong>{listing.donor?.organizationName || listing.donor?.fullName || 'Verified Donor'}</strong>
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-2xl bg-cream-100/70 border border-chocolate/10 mb-5 flex items-center justify-between text-xs">
            <div>
              <span className="text-chocolate/60 block">Currently Available:</span>
              <span className="text-lg font-extrabold font-heading text-burntOrange">
                {listing.availableQuantity} {listing.quantityUnit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-chocolate/60 block">Pickup Location:</span>
              <span className="font-bold text-chocolate flex items-center gap-1 justify-end">
                <MapPin className="w-3.5 h-3.5 text-burntOrange" />
                {listing.pickupAddress?.city || 'Local Area'}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Requested Quantity *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max={maxAvailable}
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm font-bold text-chocolate focus:border-burntOrange focus:ring-2 focus:ring-burntOrange/20 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-chocolate/60">
                    {listing.quantityUnit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Estimated People Fed *
                </label>
                <input
                  type="number"
                  min="1"
                  value={beneficiaryCount}
                  onChange={(e) => setBeneficiaryCount(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:border-burntOrange focus:ring-2 focus:ring-burntOrange/20 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Purpose of Food Request
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Evening meal distribution at shelter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Pickup Preference & Timing
              </label>
              <select
                value={pickupPreference}
                onChange={(e) => setPickupPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange cursor-pointer"
              >
                <option value="Immediately (Within 30 mins)">Immediately (Within 30 mins)</option>
                <option value="Within 2 hours">Within 2 hours</option>
                <option value="Today Evening (Before 8 PM)">Today Evening (Before 8 PM)</option>
                <option value="Tomorrow Morning">Tomorrow Morning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Note to Donor (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Vehicle details, container specifications or contact number..."
                className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange focus:outline-none"
              />
            </div>

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
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit Food Request
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
