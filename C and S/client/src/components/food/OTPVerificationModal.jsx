import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Clock, RefreshCw, X, AlertCircle, CheckCircle2, Copy, KeyRound } from 'lucide-react';
import { sileo } from 'sileo';
import Button from '../common/Button';
import otpService from '../../services/otp.service';

export default function OTPVerificationModal({
  isOpen,
  onClose,
  verificationData,
  onVerificationSuccess,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
  const [errorMsg, setErrorMsg] = useState('');
  const [currentVerificationId, setCurrentVerificationId] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [issuedListing, setIssuedListing] = useState(null);
  const [copied, setCopied] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (verificationData) {
      setCurrentVerificationId(verificationData.verificationId);
      setDevOtp(verificationData.devOtp || '');
      setTimeLeft(300);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setErrorMsg('');
      setIssuedCode('');
      setIssuedListing(null);
      setCopied(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [verificationData]);

  // Expiry countdown timer (5 minutes)
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Resend cooldown timer (60 seconds)
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [isOpen, resendCooldown]);

  const handleInputChange = (index, value) => {
    // Only accept numerical digits
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg('');

    // Advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMsg('This OTP code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await otpService.verifyListingOtp({
        verificationId: currentVerificationId,
        otp: otpCode,
      });

      // The API returns a one-time handover code. Show it before closing so the
      // donor can save it — it is also emailed to them.
      if (result.donationCode) {
        setIssuedCode(result.donationCode);
        setIssuedListing(result.listing);
        setTimeLeft(0);
        setDevOtp('');
        sileo.success({
          title: 'Food Listing Published!',
          description: 'Save your handover code — the receiver needs it at collection.',
        });
        return;
      }

      sileo.success({
        title: 'Food Listing Published!',
        description: 'Your food listing is verified and live on the Explore page.',
      });

      if (onVerificationSuccess) {
        onVerificationSuccess(result.listing);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(issuedCode);
      setCopied(true);
      sileo.info({ title: 'Code copied', description: 'Paste it somewhere safe.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      sileo.error({ title: 'Copy failed', description: 'Please note the code down manually.' });
    }
  };

  const handleDone = () => {
    if (onVerificationSuccess) {
      onVerificationSuccess(issuedListing, issuedCode);
    }
    onClose();
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMsg('');

    try {
      const result = await otpService.resendListingOtp({
        verificationId: currentVerificationId,
      });

      setResendCooldown(60);
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      if (result.devOtp) {
        setDevOtp(result.devOtp);
      }

      sileo.info({
        title: 'New OTP Dispatched',
        description: 'A fresh verification code has been sent to your phone.',
      });

      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  // Success step — show the one-time donation handover code before closing
  if (issuedCode) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 relative"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-mutedGreen-light text-mutedGreen mx-auto flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold font-heading text-chocolate tracking-tight">
                Listing published 🎉
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-chocolate/70 max-w-xs mx-auto">
                Your SMS verification succeeded and the food is live on the Explore page.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-mutedGreen/40 bg-mutedGreen-light p-5 text-center mb-4">
              <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-mutedGreen-dark mb-2">
                <KeyRound className="w-4 h-4" />
                Donation handover code
              </div>
              <p className="font-mono text-4xl font-extrabold tracking-[0.4em] text-chocolate">
                {issuedCode}
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-burntOrange hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-5">
              <strong>Keep this code safe.</strong> Share it with the receiver only when you physically
              hand over the food. A copy has also been emailed to you.
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleDone}
              className="w-full justify-center shadow-clay-btn text-base"
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              I've saved the code
            </Button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-chocolate/50 hover:text-chocolate hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-burntOrange/10 text-burntOrange mx-auto flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold font-heading text-chocolate tracking-tight">
              Verify Food Donation
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70 max-w-xs mx-auto">
              Please enter the 6-digit security code sent to{' '}
              <strong className="text-chocolate">
                {verificationData?.phone || 'your registered phone'}
              </strong>{' '}
              to confirm this listing.
            </p>
          </div>

          {/* Dev OTP Helper Badge (Shown in dev mode for seamless testing) */}
          {devOtp && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span className="font-semibold">Development Code:</span>
              <button
                type="button"
                onClick={() => {
                  const digits = devOtp.split('');
                  setOtp(digits);
                }}
                className="px-2.5 py-1 rounded-lg bg-amberPending/20 text-chocolate font-mono font-bold tracking-widest text-sm hover:bg-amberPending/30 cursor-pointer"
                title="Click to auto-fill"
              >
                {devOtp} (Click to Fill)
              </button>
            </div>
          )}

          {/* 6-Digit OTP Inputs */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-heading font-extrabold text-chocolate bg-cream-50 rounded-2xl border border-chocolate/20 focus:border-burntOrange focus:ring-2 focus:ring-burntOrange/20 focus:outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Timer and Resend Controls */}
          <div className="flex items-center justify-between text-xs text-chocolate/70 mb-6 px-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-chocolate/50" />
              <span>Expires in:</span>
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-softRed' : 'text-burntOrange'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className={`font-heading font-semibold flex items-center gap-1 cursor-pointer ${
                resendCooldown > 0 ? 'text-chocolate/40 cursor-not-allowed' : 'text-burntOrange hover:underline'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleVerify}
              className="w-full justify-center shadow-clay-btn text-base"
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              Verify & Publish Food
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
