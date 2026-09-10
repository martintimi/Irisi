import { VendorSpecialty } from '@/types';

export interface CustomerSignUpData {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  gender: 'male' | 'female';
  heightCm?: number;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoulderCm?: number;
}

export interface VendorSignUpData {
  email: string;
  password?: string;
  brandName: string;
  designerName?: string;
  phone: string;
  location: string;
  city?: string;
  state?: string;
  vendorType: 'fashion_designer' | 'boutique_seller';
  specialty?: VendorSpecialty;
  vendorSpecialty?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

// 1. REGISTER CUSTOMER via /api/auth/register
export async function signUpCustomer(data: CustomerSignUpData) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password || 'IrisiCustomer2026!',
        fullName: data.fullName,
        phone: data.phone,
        gender: data.gender,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        userType: 'shopper',
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to register' };
    }

    return {
      success: true,
      user: result.user,
      profile: result.profile,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 2. LOGIN CUSTOMER via /api/auth/login
export async function signInCustomer(email: string, password?: string) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: password || 'IrisiCustomer2026!',
        expectedRole: 'shopper',
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Invalid credentials' };
    }

    return {
      success: true,
      user: result.user,
      profile: result.profile,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 3. REGISTER VENDOR via /api/auth/register
export async function signUpVendor(data: VendorSignUpData) {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password || 'IrisiVendor2026!',
        brandName: data.brandName,
        designerName: data.designerName,
        phone: data.phone,
        location: data.location,
        city: data.city,
        state: data.state,
        vendorType: data.vendorType,
        specialty: data.specialty || data.vendorSpecialty || 'multi_department',
        vendorSpecialty: data.specialty || data.vendorSpecialty || 'multi_department',
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        userType: 'vendor',
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to register vendor' };
    }

    return {
      success: true,
      user: result.user,
      vendorProfile: result.vendorProfile,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 4. LOGIN VENDOR via /api/auth/login
export async function signInVendor(email: string, password?: string) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: password || 'IrisiVendor2026!',
        expectedRole: 'vendor',
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Invalid credentials' };
    }

    return {
      success: true,
      user: result.user,
      vendor: result.vendor,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 5. LOGOUT via /api/auth/logout
export async function signOutUser() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}

// 6. GET CURRENT AUTHENTICATED USER via /api/auth/me
export async function getCurrentUserSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated ? data : null;
  } catch {
    return null;
  }
}

// 7. VERIFY 6-DIGIT OTP via /api/auth/verify-otp
export async function verifyOtpCode(email: string, token: string, type: 'signup' | 'email' = 'signup') {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, type }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Invalid OTP code' };
    }

    return {
      success: true,
      user: result.user,
      profile: result.profile,
      vendor: result.vendor,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 8. RESEND OTP via /api/auth/resend-otp
export async function resendOtpCode(email: string) {
  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to resend code' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 9. REQUEST PASSWORD RESET via /api/auth/forgot-password
export async function requestPasswordReset(identifier: string, role?: 'vendor' | 'shopper') {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, role }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to request password recovery.' };
    }

    return {
      success: true,
      message: result.message,
      email: result.email,
      phone: result.phone,
      resolvedEmail: result.resolvedEmail,
      accountName: result.accountName,
      token: result.token,
      resetLink: result.resetLink,
      supportUrl: result.supportUrl,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 10. CONFIRM PASSWORD RESET via /api/auth/reset-password
export async function confirmPasswordReset(identifier: string, token: string, newPassword: string) {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, token, newPassword }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to update password.' };
    }

    return {
      success: true,
      message: result.message,
      user: result.user,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
