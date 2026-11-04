import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import Container from '../../components/common/Container';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import authService from '../../services/auth.service';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Request a new link from the sign-in page.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: form.password });
      setDone(true);
      sileo.success({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
      });
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'This reset link is invalid or has expired. Request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 flex items-center justify-center min-h-[calc(100vh-140px)]">
      <Container size="narrow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md mx-auto clay-card bg-white p-7 sm:p-10 border border-chocolate/10 shadow-2xl rounded-3xl"
        >
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <Logo size="lg" showTagline={false} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate tracking-tight">
              Choose a new password
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70">
              Reset links expire after 15 minutes and can only be used once.
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-mutedGreen-light text-mutedGreen mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-chocolate">
                Password updated successfully.
              </p>
              <p className="text-xs text-chocolate/70">
                Redirecting you to sign in…
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-burntOrange hover:underline"
              >
                Go to sign in <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/20 focus:border-burntOrange transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate/50 hover:text-chocolate p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/20 focus:border-burntOrange transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!token && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  No reset token was found in this link. Use{' '}
                  <Link to="/login" className="font-bold underline">
                    Forgot password
                  </Link>{' '}
                  on the sign-in page to request a new one.
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  disabled={!token}
                  className="w-full justify-center"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </div>

              <div className="text-center text-xs text-chocolate/70 pt-2">
                Remembered it?{' '}
                <Link to="/login" className="font-bold text-burntOrange hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
