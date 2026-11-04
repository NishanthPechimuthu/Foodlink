import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { sileo } from 'sileo';
import Swal from 'sweetalert2';
import Container from '../../components/common/Container';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, getDashboardPath } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const data = await login({
        email: formData.email,
        password: formData.password,
      });

      sileo.success({
        title: 'Authentication Successful',
        description: `Welcome back, ${data.user.fullName}!`,
      });

      // Navigate to intended protected route if redirected, or role-based dashboard
      const fromPath = location.state?.from?.pathname;
      const targetDashboard = getDashboardPath(data.user.role);
      navigate(fromPath || targetDashboard, { replace: true });
    } catch (err) {
      // Account exists but the email has not been verified yet
      if (err.response?.status === 403 && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationEmail(err.response.data.email || formData.email);
        setVerificationOpen(true);
        sileo.warning({
          title: 'Email Not Verified',
          description:
            'Enter the 6-digit code sent to your email, or tap "Resend code" in the verification window.',
        });
        return;
      }

      const errorMessage =
        err.response?.data?.message || 'Login failed. Please verify your credentials and try again.';
      sileo.error({
        title: 'Authentication Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Reset Your Password',
      input: 'email',
      inputLabel: 'Enter your registered email address',
      inputPlaceholder: 'name@example.com',
      inputValue: formData.email || '',
      showCancelButton: true,
      confirmButtonText: 'Send Reset Instructions',
      confirmButtonColor: '#CC5500',
      cancelButtonColor: '#4E342E',
      inputValidator: (value) => {
        if (!value || !/\S+@\S+\.\S+/.test(value)) {
          return 'Please enter a valid email address';
        }
      },
    });

    if (email) {
      try {
        const res = await authService.forgotPassword(email);
        const devResetUrl = res.devInfo?.resetUrl;

        Swal.fire({
          icon: 'success',
          title: 'Check your inbox',
          html: devResetUrl
            ? `<p style="font-size:14px">A themed reset email was generated. In development you can also <a href="${devResetUrl}" style="color:#CC5500;font-weight:700">open the reset link</a>.</p>`
            : `<p style="font-size:14px">${res.message || 'If an account matches that email, a password reset link is on its way.'}</p>`,
          confirmButtonColor: '#CC5500',
        });
      } catch (err) {
        sileo.error({
          title: 'Request Failed',
          description: err.response?.data?.message || 'Could not process password reset request.',
        });
      }
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <Logo size="lg" showTagline={false} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70">
              Sign in to manage surplus food donations and requests.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="name@organization.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-softRed focus:ring-softRed/20'
                      : 'border-chocolate/15 focus:ring-burntOrange/20 focus:border-burntOrange'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-softRed font-semibold">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-chocolate">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-burntOrange hover:underline cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot password?</span>
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-softRed focus:ring-softRed/20'
                      : 'border-chocolate/15 focus:ring-burntOrange/20 focus:border-burntOrange'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate/50 hover:text-chocolate p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-softRed font-semibold">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-chocolate/80">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="rounded border-chocolate/20 text-burntOrange focus:ring-burntOrange/30 w-4 h-4"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Social Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-chocolate/10" />
            </div>
            <span className="relative px-3 bg-white text-xs font-semibold text-chocolate/50 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Google OAuth Button */}
          <GoogleAuthButton
            role="Donor"
            text="Continue with Google"
            onSuccess={(data) => {
              const fromPath = location.state?.from?.pathname;
              const targetDashboard = getDashboardPath(data.user.role);
              navigate(fromPath || targetDashboard, { replace: true });
            }}
          />

          {/* Registration Link */}
          <div className="mt-8 text-center text-xs text-chocolate/70">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-burntOrange hover:underline"
            >
              Join Food Link today
            </Link>
          </div>
        </motion.div>
      </Container>

      <EmailVerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        email={verificationEmail}
        autoResend
        onVerified={(user) => {
          const fromPath = location.state?.from?.pathname;
          navigate(fromPath || getDashboardPath(user?.role), { replace: true });
        }}
      />
    </div>
  );
}
