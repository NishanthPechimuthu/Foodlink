import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MailCheck, Clock, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sileo } from 'sileo';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * 6-digit email verification modal.
 *
 * Used in two places:
 *   1. Right after registration (code was just emailed)
 *   2. When login is blocked with EMAIL_NOT_VERIFIED (autoResend = true)
 */
export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  initialDevCode = '',
  autoResend = false,
  onVerified,
}) {
  const { verifyEmail, resendVerification } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [devCode, setDevCode] = useState('');
  const [notice, setNotice] = useState('');

  const inputRefs = useRef([]);

  const resetInputs = () => {
    setCode(['', '', '', '', '', '']);
    setErrorMsg('');
    setNotice('');
    setTimeLeft(600);
    setResendCooldown(60);
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  useEffect(() => {
    if (!isOpen) return;

    setDevCode(initialDevCode || '');
    resetInputs();

    // On the login gate path there may be no active code, so request one.
    if (autoResend && email) {
      (async () => {
        try {
          const result = await resendVerification(email);
          if (result?.devCode) setDevCode(result.devCode);
          if (result?.retryAfterSeconds) setResendCooldown(result.retryAfterSeconds);
          if (result?.emailDelivered === false) {
            setNotice(
              'We could not deliver the email yet. Tap "Resend code" to try again.'
            );
          } else {
            setNotice(`A fresh 6-digit code was sent to ${email}.`);
          }
        } catch (err) {
          setNotice(
            err.response?.data?.message ||
              'Could not request a new code automatically. Tap "Resend code".'
          );
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, email, autoResend]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  const handleInputChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...code];
      next[index] = '';
      setCode(next);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setErrorMsg('');

    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const value = code.join('');
    if (value.length !== 6) {
      setErrorMsg('Enter all 6 digits from the email.');
      return;
    }
    if (timeLeft <= 0) {
      setErrorMsg('This code has expired. Request a new one.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await verifyEmail({ email, code: value });

      if (result?.alreadyVerified) {
        sileo.info({
          title: 'Already verified',
          description: 'Please sign in with your password.',
        });
        onClose();
        return;
      }

      sileo.success({
        title: 'Email Verified',
        description: 'Your Food Link account is now active.',
      });
      if (onVerified) onVerified(result.user);
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Could not verify that code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMsg('');

    try {
      const result = await resendVerification(email);
      resetInputs();
      setResendCooldown(result?.retryAfterSeconds || 60);
      setTimeLeft(600);
      setDevCode(result?.devCode || '');

      if (result?.emailDelivered === false) {
        setNotice('We could not deliver the email yet. Please try again shortly.');
        sileo.warning({
          title: 'Email Not Sent',
          description: 'We could not deliver the code yet. Please tap "Resend code" again shortly.',
        });
      } else {
        setNotice(`A fresh 6-digit code was sent to ${email}.`);
        sileo.info({
          title: 'New Code Sent',
          description: `We sent a fresh 6-digit code to ${email}.`,
        });
      }
    } catch (err) {
      if (err.response?.data?.retryAfterSeconds) {
        setResendCooldown(err.response.data.retryAfterSeconds);
      }
      setErrorMsg(err.response?.data?.message || 'Could not resend the code.');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-chocolate/10 relative"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-chocolate/50 hover:text-chocolate hover:bg-cream-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-mutedGreen-light text-mutedGreen mx-auto flex items-center justify-center mb-3 shadow-inner">
              <MailCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold font-heading text-chocolate tracking-tight">
              Verify your email
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70 max-w-xs mx-auto">
              Enter the 6-digit code we sent to{' '}
              <strong className="text-chocolate break-all">{email}</strong>.
            </p>
          </div>

          {devCode && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span className="font-semibold">Development Code:</span>
              <button
                type="button"
                onClick={() => setCode(devCode.split('').slice(0, 6))}
                className="px-2.5 py-1 rounded-lg bg-amberPending/20 text-chocolate font-mono font-bold tracking-widest text-sm hover:bg-amberPending/30 cursor-pointer"
                title="Click to auto-fill"
              >
                {devCode} (Click to Fill)
              </button>
            </div>
          )}

          {notice && (
            <div className="mb-4 p-3 rounded-xl bg-cream-100 border border-chocolate/10 text-chocolate/80 text-xs">
              {notice}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-heading font-extrabold text-chocolate bg-cream-50 rounded-2xl border border-chocolate/20 focus:border-burntOrange focus:ring-2 focus:ring-burntOrange/20 focus:outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
              <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}</span>
            </button>
          </div>

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
              Verify Email
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full justify-center text-chocolate/60 hover:text-chocolate"
            >
              I'll do this later
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
