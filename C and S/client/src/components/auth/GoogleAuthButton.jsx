import React, { useState, useEffect, useRef } from 'react';
import { sileo } from 'sileo';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

export default function GoogleAuthButton({
  role = 'Donor',
  text = 'Continue with Google',
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) {
  const { googleLogin, getDashboardPath } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gisAvailable, setGisAvailable] = useState(false);
  const googleBtnRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured =
    googleClientId &&
    googleClientId.trim() !== '' &&
    !googleClientId.includes('your_google_client_id');

  // Handle successful Google ID token response
  const handleGoogleCredentialResponse = async (credential) => {
    setLoading(true);
    try {
      const data = await googleLogin({
        token: credential,
        credential,
        idToken: credential,
        role: role === 'receiver' ? 'Receiver' : 'Donor',
      });

      sileo.success({
        title: 'Google Sign-In Successful',
        description: `Welcome to Food Link, ${data.user.fullName}!`,
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed.';
      sileo.error({
        title: 'Authentication Failed',
        description: msg,
      });
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS) if client ID is configured
  useEffect(() => {
    if (!isGoogleConfigured) return;

    let checkInterval = null;
    let attempts = 0;

    const initGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response.credential) {
                handleGoogleCredentialResponse(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render GIS button in background container if element exists
          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 320,
            });
          }

          setGisAvailable(true);
        } catch (e) {
          console.warn('[GIS Init Error]', e);
        }
        return true;
      }
      return false;
    };

    if (!initGIS()) {
      checkInterval = setInterval(() => {
        attempts++;
        if (initGIS() || attempts > 20) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isGoogleConfigured, googleClientId, role]);

  // Click handler for our Food Link styled Google button
  const handleClick = async () => {
    if (loading || disabled) return;

    // 1. If real Google Client ID is configured and GIS is available
    if (isGoogleConfigured && window.google?.accounts?.id) {
      try {
        // Try to trigger GIS prompt / one-tap or click rendered GIS button
        const iframeBtn = googleBtnRef.current?.querySelector('div[role="button"]');
        if (iframeBtn) {
          iframeBtn.click();
          return;
        }
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('[GIS Prompt]', notification.getNotDisplayedReason() || notification.getSkippedReason());
          }
        });
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }

    // 2. Interactive Development Fallback (When VITE_GOOGLE_CLIENT_ID is not yet configured)
    const result = await Swal.fire({
      title: 'Google OAuth Verification',
      html: `
        <div class="text-left text-xs text-chocolate/80 space-y-2">
          <p>Google Identity Services requires a <strong>VITE_GOOGLE_CLIENT_ID</strong> from Google Cloud Console.</p>
          <p class="p-2.5 rounded-lg bg-cream-100 border border-chocolate/10 font-mono text-[11px]">
            ${isGoogleConfigured ? 'Status: Client ID configured' : 'Status: VITE_GOOGLE_CLIENT_ID not configured in client/.env'}
          </p>
          <p>Would you like to sign in immediately using a <strong>verified Google test profile</strong> to test the full authentication flow?</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sign In with Google Test Account',
      confirmButtonColor: '#CC5500',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#4E342E',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // Safe browser base64 encoding (DO NOT use Node Buffer!)
        const testUserPayload = {
          sub: 'google_user_' + Math.random().toString(36).substring(2, 9),
          email: 'google.donor@foodlink.org',
          name: 'Priya Sharma (Google)',
          picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          email_verified: true,
        };

        const safeBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(testUserPayload))))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Form a 3-part simulated JWT: header.payload.signature
        const mockGoogleJwt = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${safeBase64}.simulated_signature_dev`;

        await handleGoogleCredentialResponse(mockGoogleJwt);
      } catch (err) {
        sileo.error({
          title: 'Error',
          description: err.message || 'Could not process Google test login.',
        });
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Hidden native GIS button container for standard Google button rendering */}
      <div
        ref={googleBtnRef}
        className="hidden"
        aria-hidden="true"
      />

      {/* Food Link Custom Styled Google Button (Preserves Cream/Chocolate/Burnt Orange design system) */}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || disabled}
        className={`w-full py-2.5 px-4 rounded-xl border border-chocolate/15 bg-white hover:bg-cream-50 text-chocolate font-heading font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-burntOrange border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting with Google...' : text}</span>
      </button>
    </div>
  );
}
