import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PackageCheck,
  ShieldCheck,
  RefreshCw,
  X,
  AlertCircle,
  MessageSquare,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { sileo } from 'sileo';
import Button from '../common/Button';
import requestService from '../../services/request.service';

/**
 * Two-party collection verification.
 *
 * The receiver must provide:
 *   1. the 6-digit pickup code sent to their phone (proves they are present)
 *   2. the 6-digit handover code shown by the donor (proves handover happened)
 *
 * Only when both match does the API mark the donation completed and create
 * the impact record. This prevents fake listings and fake collection records.
 */
export default function CollectionVerificationModal({ isOpen, onClose, request, onSuccess }) {
  const [pickupOtp, setPickupOtp] = useState('');
  const [donationCode, setDonationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPickupOtp('');
    setDonationCode('');
    setErrorMsg('');
    setDevOtp('');
    setCooldown(10);
  }, [isOpen, request?._id]);

  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending || !request?._id) return;
    setResending(true);
    setErrorMsg('');
    try {
      const result = await requestService.sendCollectionOtp(request._id);
      if (result?.devOtp) setDevOtp(result.devOtp);
      setCooldown(result?.cooldownSeconds || 60);
      sileo.info({
        title: 'Pickup code sent',
        description: 'Check your phone for the new 6-digit pickup code.',
      });
    } catch (err) {
      const retry = err.response?.data?.retryAfterSeconds;
      if (retry) setCooldown(retry);
      setErrorMsg(err.response?.data?.message || 'Could not send a new pickup code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!/^[0-9]{6}$/.test(pickupOtp) || !/^[0-9]{6}$/.test(donationCode)) {
      setErrorMsg('Enter both 6-digit codes: the pickup SMS code and the donor handover code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await requestService.confirmCollection(request._id, {
        pickupOtp,
        donationCode,
      });

      sileo.success({
        title: 'Collection verified',
        description: result.message || 'Donation completed and impact recorded.',
      });
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please check both codes.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const listingTitle = request.listing?.title || 'your food donation';
  const quantity = request.listing?.quantityUnit
    ? `${request.requestedQuantity} ${request.listing.quantityUnit}`
    : '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 relative my-8"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-chocolate/50 hover:text-chocolate hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 mx-auto flex items-center justify-center mb-3 shadow-inner">
              <PackageCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold font-heading text-chocolate tracking-tight">
              Confirm collection
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70 max-w-sm mx-auto">
              <strong className="text-chocolate">{listingTitle}</strong>
              {quantity ? ` · ${quantity}` : ''}
            </p>
            <p className="mt-2 text-xs text-chocolate/60 max-w-sm mx-auto">
              Two codes are required so fake listings and fake collections cannot be recorded.
            </p>
          </div>

          {devOtp && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span className="font-semibold">Dev pickup code:</span>
              <button
                type="button"
                onClick={() => setPickupOtp(devOtp)}
                className="px-2.5 py-1 rounded-lg bg-amberPending/20 text-chocolate font-mono font-bold tracking-widest text-sm hover:bg-amberPending/30 cursor-pointer"
              >
                {devOtp} (Fill)
              </button>
            </div>
          )}

          {/* Receiver pickup code */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-chocolate flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-burntOrange" />
                Your pickup code (SMS)
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className={`text-[11px] font-semibold flex items-center gap-1 ${
                  cooldown > 0 ? 'text-chocolate/40 cursor-not-allowed' : 'text-burntOrange hover:underline cursor-pointer'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pickupOtp}
              onChange={(e) => {
                setPickupOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                setErrorMsg('');
              }}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-chocolate/15 text-center font-mono text-xl font-bold tracking-[0.5em] text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/20 focus:border-burntOrange transition-all"
            />
            <p className="mt-1 text-[11px] text-chocolate/60">
              Sent to {request.receiver?.phone || 'your registered mobile number'} when the donor marked the food ready.
            </p>
          </div>

          {/* Donor handover code */}
          <div className="mb-5">
            <label className="text-xs font-bold text-chocolate flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-mutedGreen" />
              Donor's handover code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={donationCode}
              onChange={(e) => {
                setDonationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                setErrorMsg('');
              }}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-chocolate/15 text-center font-mono text-xl font-bold tracking-[0.5em] text-chocolate focus:outline-none focus:ring-2 focus:ring-mutedGreen/20 focus:border-mutedGreen transition-all"
            />
            <p className="mt-1 text-[11px] text-chocolate/60">
              Ask the donor to read out the code from their dashboard or handover email, only after you receive the food.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mb-4 p-3 rounded-xl bg-mutedGreen-light border border-mutedGreen/30 text-[11px] text-mutedGreen-dark flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Both codes are verified on the server before the donation is marked complete. Impact records are
              only created after verification.
            </span>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleSubmit}
              className="w-full justify-center shadow-clay-btn text-base"
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              Verify & Complete Donation
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full justify-center text-chocolate/60 hover:text-chocolate"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
