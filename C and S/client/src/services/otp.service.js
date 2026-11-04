import api from './api';

export const otpService = {
  /**
   * Request OTP code before publishing a food listing
   */
  async sendListingOtp({ phone, listingData }) {
    const response = await api.post('/otp/send', { phone, listingData });
    return response.data;
  },

  /**
   * Submit OTP code to verify and immediately publish listing
   */
  async verifyListingOtp({ verificationId, otp }) {
    const response = await api.post('/otp/verify', { verificationId, otp });
    return response.data;
  },

  /**
   * Resend OTP code
   */
  async resendListingOtp({ verificationId }) {
    const response = await api.post('/otp/resend', { verificationId });
    return response.data;
  },

  /**
   * Generate a fresh donor handover code for an existing listing.
   * The previous code stops working immediately and the new one is emailed.
   */
  async regenerateDonationCode({ listingId }) {
    const response = await api.post('/otp/donation-code/regenerate', { listingId });
    return response.data;
  },
};

export default otpService;
