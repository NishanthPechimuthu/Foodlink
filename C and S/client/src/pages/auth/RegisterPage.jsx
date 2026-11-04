import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Building,
  Heart,
  Users,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { sileo } from 'sileo';
import Container from '../../components/common/Container';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'receiver' ? 'receiver' : 'donor';
  const { register, googleLogin, getDashboardPath } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: initialRole,
    organizationName: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationDevCode, setVerificationDevCode] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'donor' || roleParam === 'receiver') {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required (min 2 characters)';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for verified listings';
    } else if (!/^[0-9+()-\s]{8,20}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (8-20 digits)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the safety and community guidelines';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      sileo.error({
        title: 'Validation Incomplete',
        description: 'Please review and fill in all mandatory fields correctly.',
      });
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role, // 'donor' or 'receiver'
        organizationName: formData.organizationName.trim(),
        password: formData.password,
      });

      // New accounts must confirm the 6-digit code emailed via Gmail SMTP
      // before they can sign in.
      if (data.requiresEmailVerification) {
        setVerificationEmail(data.email || formData.email.trim());
        setVerificationDevCode(data.devCode || '');
        setVerificationOpen(true);

        if (data.emailDelivered === false) {
          sileo.warning({
            title: 'Email delivery delayed',
            description:
              data.message ||
              'Your account was created, but the verification email could not be sent yet. Use "Resend code" on the next screen to try again.',
          });
        } else {
          sileo.success({
            title: 'Check your email',
            description: data.message || 'We sent you a 6-digit verification code.',
          });
        }
        return;
      }

      sileo.success({
        title: 'Account Created Successfully!',
        description: `Welcome to Food Link, ${data.user.fullName}!`,
      });

      // Role-based navigation
      const targetDashboard = getDashboardPath(data.user.role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
      const message =
        err.response?.data?.message || 'Registration failed. Please check your information and try again.';
      sileo.error({
        title: 'Registration Error',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 min-h-[calc(100vh-140px)] flex items-center justify-center">
      <Container size="narrow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl mx-auto clay-card bg-white p-7 sm:p-10 border border-chocolate/10 shadow-2xl rounded-3xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <Logo size="lg" showTagline={false} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate tracking-tight">
              Create your account
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/70">
              Join Food Link to donate surplus food or rescue meals for your community.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-chocolate mb-2 text-center uppercase tracking-wider">
              Select Your Primary Role
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-cream-50 rounded-2xl border border-chocolate/15">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'donor' })}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  formData.role === 'donor'
                    ? 'bg-burntOrange text-white shadow-clay-btn'
                    : 'text-chocolate/75 hover:text-chocolate hover:bg-cream-100'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Food Donor</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'receiver' })}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  formData.role === 'receiver'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-chocolate/75 hover:text-chocolate hover:bg-cream-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Food Receiver</span>
              </button>
            </div>
            <p className="text-[11px] text-chocolate/60 text-center mt-2">
              {formData.role === 'donor'
                ? 'For restaurants, bakeries, caterers, supermarkets & households sharing surplus.'
                : 'For NGOs, orphanages, shelters & individuals receiving surplus meals.'}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Full Name / Contact Person *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="e.g. Maya Sharma"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                    errors.name ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-softRed font-semibold">{errors.name}</p>
              )}
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-xs font-bold text-chocolate mb-1.5">
                Organization / Business Name{' '}
                <span className="text-chocolate/50 font-normal">(optional for individuals)</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="e.g. Green Bakery / Hope Community Shelter"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:border-burntOrange transition-all"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Email Address *
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
                    placeholder="contact@domain.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.email ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-softRed font-semibold">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.phone ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-softRed font-semibold">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    placeholder="Min. 6 chars"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.password ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
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

              <div>
                <label className="block text-xs font-bold text-chocolate mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                    }}
                    placeholder="Repeat password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border text-sm text-chocolate focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword ? 'border-softRed' : 'border-chocolate/15 focus:border-burntOrange'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-softRed font-semibold">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms & Guidelines Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-chocolate/80 leading-snug select-none">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeTerms: e.target.checked });
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                  }}
                  className="rounded border-chocolate/20 text-burntOrange focus:ring-burntOrange/30 w-4 h-4 mt-0.5 shrink-0"
                />
                <span>
                  I agree to Food Link's Community Guidelines and acknowledge food safety responsibilities for all listings or pickups.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-softRed font-semibold">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Admin Policy Notice */}
            <div className="p-3 rounded-xl bg-cream-100 border border-chocolate/10 text-[11px] text-chocolate/70 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Administrative Policy:</strong> Public registration is restricted to Donor and Receiver roles only. Admin accounts are provisioned via administrative protocols.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Create {formData.role === 'donor' ? 'Donor' : 'Receiver'} Account
              </Button>
            </div>
          </form>

          {/* Social Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-chocolate/10" />
            </div>
            <span className="relative px-3 bg-white text-xs font-semibold text-chocolate/50 uppercase tracking-wider">
              Or sign up with
            </span>
          </div>

          {/* Google OAuth Button */}
          <GoogleAuthButton
            role={formData.role}
            text="Sign up with Google"
            onSuccess={(data) => {
              const targetDashboard = getDashboardPath(data.user.role);
              navigate(targetDashboard, { replace: true });
            }}
          />

          {/* Login Link */}
          <div className="mt-8 text-center text-xs text-chocolate/70">
            Already have a Food Link account?{' '}
            <Link to="/login" className="font-bold text-burntOrange hover:underline">
              Sign in here
            </Link>
          </div>
        </motion.div>
      </Container>

      <EmailVerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        email={verificationEmail}
        initialDevCode={verificationDevCode}
        onVerified={(user) => {
          if (user?.role) navigate(getDashboardPath(user.role), { replace: true });
          else navigate('/login', { replace: true });
        }}
      />
    </div>
  );
}
