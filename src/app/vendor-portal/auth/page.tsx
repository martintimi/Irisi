'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Building, Scissors, Mail, Phone, Lock, MapPin,
  ShieldCheck, ArrowRight, ArrowLeft, Sparkles, User, Sun, Moon, Loader2,
  Eye, EyeOff, CheckCircle2, RotateCw, Store, KeyRound, MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { signUpVendor, signInVendor, verifyOtpCode, resendOtpCode, requestPasswordReset, confirmPasswordReset } from '@/lib/services/auth';
import { isBoutiqueVendor, VendorSpecialty } from '@/types';
import BrandWordmark from '@/components/common/BrandWordmark';
import { NIGERIAN_STATES } from '@/lib/data/nigeriaLocations';
import SearchableCitySelect from '@/components/common/SearchableCitySelect';
import EmailDomainSuggestions from '@/components/common/EmailDomainSuggestions';
import { NIGERIAN_BANKS, getBankCodeByName } from '@/lib/data/nigerianBanks';

const vendorEditorialSlides = [
  {
    image: '/images/products/BlackSenator.jpg',
    title: 'Nigerian Fashion Boutiques & Ateliers',
    subtitle: 'From ready-to-wear streetwear and boutique collections to bespoke native tailoring across Lagos, Abuja, and Port Harcourt.',
    tag: 'Merchant Growth'
  },
  {
    image: '/images/products/BlackAgbada.jpg',
    title: 'Zero-Return High Fashion',
    subtitle: 'Sell your native pieces directly to verified Nigerian shoppers with secured escrow settlements.',
    tag: 'Escrow Protected'
  },
  {
    image: '/images/products/BlackTrapStarHoodie.jpg',
    title: 'Ready-to-Wear Drops',
    subtitle: 'Boutiques and streetwear labels sell directly to verified Nigerian shoppers with nationwide delivery.',
    tag: 'Streetwear & Denim'
  },
  {
    image: '/images/products/UnisexSlides.jpg',
    title: 'Nationwide Direct Dispatch',
    subtitle: 'Doorstep pickup and delivery from your workshop directly to shoppers with live tracking and automated escrow payouts.',
    tag: 'Direct Dispatch'
  }
];

function VendorAuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    setIsVendorLoggedIn,
    setVendorProfile,
    theme,
    toggleTheme
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify_otp' | 'forgot_password' | 'reset_password'>('login');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password recovery state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryInfo, setRecoveryInfo] = useState<{
    maskedEmail?: string;
    maskedPhone?: string;
    accountName?: string;
    supportUrl?: string;
  } | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    brandName: '',
    designerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state: 'Lagos',
    city: 'Ikeja (Allen / Opebi / GRA / Alausa)',
    address: '',
    location: '',
    vendorType: 'fashion_designer' as 'fashion_designer' | 'boutique_seller',
    specialty: 'native_tailoring' as VendorSpecialty,
    bankName: 'Guaranty Trust Bank',
    bankCode: '058',
    accountNumber: '',
    accountName: '',
  });

  // Handle URL search params for direct vendor onboarding links
  useEffect(() => {
    if (!searchParams) return;
    const modeParam = searchParams.get('mode') || searchParams.get('tab') || searchParams.get('action');
    if (modeParam === 'register' || modeParam === 'signup' || modeParam === 'onboard') {
      setAuthMode('register');
    }

    const specialtyParam = searchParams.get('specialty') || searchParams.get('type') || searchParams.get('category');
    if (specialtyParam) {
      const lower = specialtyParam.toLowerCase();
      if (lower.includes('native') || lower.includes('tailor') || lower.includes('atelier')) {
        setRegForm((prev) => ({
          ...prev,
          specialty: 'native_tailoring',
          vendorType: 'fashion_designer'
        }));
      } else if (lower.includes('street') || lower.includes('boutique')) {
        setRegForm((prev) => ({
          ...prev,
          specialty: 'streetwear',
          vendorType: 'boutique_seller'
        }));
      } else if (lower.includes('foot') || lower.includes('shoe') || lower.includes('slide')) {
        setRegForm((prev) => ({
          ...prev,
          specialty: 'footwear',
          vendorType: 'boutique_seller'
        }));
      } else if (lower.includes('cap') || lower.includes('headwear')) {
        setRegForm((prev) => ({
          ...prev,
          specialty: 'caps',
          vendorType: 'boutique_seller'
        }));
      } else if (lower.includes('access') || lower.includes('jewel')) {
        setRegForm((prev) => ({
          ...prev,
          specialty: 'accessories',
          vendorType: 'boutique_seller'
        }));
      }
    }
  }, [searchParams]);

  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);
  const [bankResolveError, setBankResolveError] = useState('');

  const getSpecialtyLabels = (spec: VendorSpecialty) => {
    switch (spec) {
      case 'accessories':
      case 'jewelry':
        return {
          brandLabel: 'Jewelry / Accessories Brand Name',
          brandPlaceholder: 'e.g. Aureus Jewelry Studio, Gem & Chain Co.',
          addressLabel: 'Studio / Workshop Address',
          addressPlaceholder: 'e.g. Suite 4, Lekki Mall, Admiralty Way',
          btnText: 'Register Jewelry Brand & Receive Code',
        };
      case 'footwear':
        return {
          brandLabel: 'Footwear Studio / Brand Name',
          brandPlaceholder: 'e.g. Kano Leather Studio, Crown Slides',
          addressLabel: 'Footwear Workshop Address',
          addressPlaceholder: 'e.g. 14 Commercial Avenue, Yaba',
          btnText: 'Register Footwear Brand & Receive Code',
        };
      case 'caps':
        return {
          brandLabel: 'Headwear Studio / Brand Name',
          brandPlaceholder: 'e.g. Royal Crown Fila, Street Cap Co.',
          addressLabel: 'Headwear Workshop Address',
          addressPlaceholder: 'e.g. 25 Allen Avenue, Ikeja',
          btnText: 'Register Headwear Brand & Receive Code',
        };
      case 'native_tailoring':
        return {
          brandLabel: 'Atelier / Tailoring House Name',
          brandPlaceholder: 'e.g. Deji & Kola Atelier, Seyi Vodi Couture',
          addressLabel: 'Atelier / Tailoring Workshop Address',
          addressPlaceholder: 'e.g. 10 Admiralty Way, Lekki Phase 1',
          btnText: 'Register Atelier & Receive Code',
        };
      case 'streetwear':
      case 'multi_department':
      default:
        return {
          brandLabel: 'Boutique / Brand Name',
          brandPlaceholder: 'e.g. Moji Boutique, Lagos Urban Archive',
          addressLabel: 'Boutique / Store Address',
          addressPlaceholder: 'e.g. Shop 12, Palms Mall, Lekki',
          btnText: 'Register Boutique & Receive Code',
        };
    }
  };

  const labels = getSpecialtyLabels(regForm.specialty);
  const isBoutiqueSelected = regForm.vendorType === 'boutique_seller';

  // Auto-resolve bank account name via Paystack
  const resolveBankAccount = async (accNum: string, bCode: string) => {
    const cleanNum = accNum.replace(/[^0-9]/g, '');
    if (cleanNum.length !== 10 || !bCode) return;
    setIsResolvingBank(true);
    setBankResolveError('');
    try {
      const res = await fetch(`/api/bank/resolve?account_number=${encodeURIComponent(cleanNum)}&bank_code=${encodeURIComponent(bCode)}`);
      const data = await res.json();
      if (data.success && data.accountName) {
        setRegForm((prev) => ({
          ...prev,
          accountName: data.accountName,
        }));
        setBankVerified(true);
        setBankResolveError('');
      } else {
        setBankVerified(false);
        setBankResolveError(data.error || 'Could not resolve account name. Check details or enter manually.');
      }
    } catch {
      setBankVerified(false);
      setBankResolveError('Error communicating with verification gateway');
    } finally {
      setIsResolvingBank(false);
    }
  };

  // OTP Verification State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Auto-rotate editorial lookbook every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % vendorEditorialSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss error message after 10 seconds and scroll to top
  useEffect(() => {
    if (errorMessage) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer > 0 && authMode === 'verify_otp') {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer, authMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await signInVendor(loginIdentifier.trim(), loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid business email or password.');
        setIsSubmitting(false);
        return;
      }

      if (res.vendor) {
        const vId = res.vendor.id || res.vendor.email || loginIdentifier.trim();
        if (typeof window !== 'undefined') {
          localStorage.setItem('irisi_vendor_id', vId);
          localStorage.setItem('irisi_vendor_email', res.vendor.email || loginIdentifier.trim());
          localStorage.setItem('veyra_vendor_id', vId);
          localStorage.setItem('veyra_vendor_email', res.vendor.email || loginIdentifier.trim());
          document.cookie = `irisi_vendor_id=${vId}; path=/; max-age=2592000`;
          document.cookie = `veyra_vendor_id=${vId}; path=/; max-age=2592000`;
        }

        setVendorProfile({
          brandName: res.vendor.brand_name || 'My Brand',
          designerName: res.vendor.designer_name || 'Lead Manager',
          contactPerson: res.vendor.contact_person || res.vendor.designer_name,
          email: res.vendor.email || loginIdentifier.trim(),
          phone: res.vendor.phone || '',
          location: res.vendor.location || '',
          vendorType: isBoutiqueVendor(res.vendor) ? 'boutique_seller' : 'fashion_designer',
          specialty: res.vendor.specialty || res.vendor.vendorSpecialty || 'multi_department',
          vendorSpecialty: res.vendor.specialty || res.vendor.vendorSpecialty || 'multi_department',
          bankName: res.vendor.bank_name || 'Guaranty Trust Bank (GTBank)',
          accountNumber: res.vendor.account_number || '',
          accountName: res.vendor.account_name || '',
          instagram: res.vendor.instagram || '',
          bio: res.vendor.bio || '',
        });
      }

      setIsVendorLoggedIn(true);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
      router.push('/vendor-portal');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    if (!regForm.brandName.trim()) {
      setErrorMessage('Please enter your brand or business name.');
      setIsSubmitting(false);
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const resolvedLocation = [regForm.address.trim(), regForm.city.trim(), regForm.state.trim()]
        .filter(Boolean)
        .join(', ') || regForm.location.trim();

      const res = await signUpVendor({
        email: regForm.email.trim(),
        password: regForm.password,
        brandName: regForm.brandName.trim(),
        designerName: regForm.designerName.trim() || regForm.brandName.trim(),
        phone: regForm.phone.trim(),
        location: resolvedLocation,
        city: regForm.city.trim(),
        state: regForm.state.trim(),
        vendorType: regForm.vendorType,
        specialty: regForm.specialty,
        vendorSpecialty: regForm.specialty,
        bankName: regForm.bankName,
        accountNumber: regForm.accountNumber.trim(),
        accountName: regForm.accountName.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Vendor registration failed. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      // Registration successful! Switch to 6-digit OTP confirmation screen
      setPendingEmail(regForm.email.trim());
      setOtp(['', '', '', '', '', '']);
      setResendTimer(30);
      setRecoverySuccessMsg('A 6-digit verification code has been dispatched to your business email.');
      setAuthMode('verify_otp');
      setIsSubmitting(false);
      return;

      // Fallback
      setPendingEmail(regForm.email.trim());
      setOtp(['', '', '', '', '', '']);
      setResendTimer(30);
      setAuthMode('verify_otp');
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Vendor registration failed.');
      setIsSubmitting(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      const el = document.getElementById(`vendor-otp-input-${nextIdx}`);
      if (el) el.focus();
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      const el = document.getElementById(`vendor-otp-input-${index + 1}`);
      if (el) el.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const el = document.getElementById(`vendor-otp-input-${index - 1}`);
      if (el) el.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otp.join('').trim();
    if (token.length < 6) {
      setErrorMessage('Please enter all 6 digits of the confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const emailToVerify = pendingEmail || regForm.email;
      const res = await verifyOtpCode(emailToVerify, token, 'signup');
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid or expired 6-digit code. Please check your email.');
        setIsSubmitting(false);
        return;
      }

      const activeProfile = res.vendor || res.profile || {};
      const vId = activeProfile.id || res.user?.id || emailToVerify;

      if (typeof window !== 'undefined') {
        localStorage.setItem('irisi_vendor_id', vId);
        localStorage.setItem('irisi_vendor_email', emailToVerify);
        localStorage.setItem('veyra_vendor_id', vId);
        localStorage.setItem('veyra_vendor_email', emailToVerify);
        document.cookie = `irisi_vendor_id=${vId}; path=/; max-age=2592000`;
        document.cookie = `veyra_vendor_id=${vId}; path=/; max-age=2592000`;
      }

      setVendorProfile({
        brandName: activeProfile.brand_name || activeProfile.brandName || regForm.brandName,
        designerName: activeProfile.designer_name || activeProfile.designerName || regForm.designerName,
        contactPerson: activeProfile.contact_person || activeProfile.contactPerson || regForm.designerName,
        email: activeProfile.email || emailToVerify,
        phone: activeProfile.phone || regForm.phone,
        location: activeProfile.location || regForm.location,
        vendorType: isBoutiqueVendor(activeProfile) || isBoutiqueVendor(regForm.vendorType) ? 'boutique_seller' : 'fashion_designer',
        specialty: activeProfile.specialty || activeProfile.vendorSpecialty || regForm.specialty || 'multi_department',
        vendorSpecialty: activeProfile.specialty || activeProfile.vendorSpecialty || regForm.specialty || 'multi_department',
        bankName: activeProfile.bank_name || activeProfile.bankName || regForm.bankName,
        accountNumber: activeProfile.account_number || activeProfile.accountNumber || regForm.accountNumber,
        accountName: activeProfile.account_name || activeProfile.accountName || regForm.accountName,
        instagram: activeProfile.instagram || '',
        bio: activeProfile.bio || '',
      });

      setIsVendorLoggedIn(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
      router.push('/vendor-portal');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    try {
      const activeEmail = pendingEmail || regForm.email;
      const res = await resendOtpCode(activeEmail);
      if (res.success) {
        setResendTimer(30);
      } else {
        setErrorMessage(res.error || 'Failed to resend confirmation code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while resending code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setErrorMessage('Please enter your business email or registered phone number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    setRecoverySuccessMsg('');

    try {
      const res = await requestPasswordReset(recoveryIdentifier.trim(), 'vendor');
      if (!res.success) {
        setErrorMessage(res.error || 'Account not found. Please check your details or contact concierge support.');
        setIsSubmitting(false);
        return;
      }

      setRecoveryInfo({
        maskedEmail: res.email,
        maskedPhone: res.phone,
        accountName: res.accountName,
        supportUrl: res.supportUrl,
      });

      setResetOtp('');
      setAuthMode('reset_password');
      setRecoverySuccessMsg(
        res.message || `A verification code has been sent to ${res.email || 'your email'}. Please check your inbox and enter the code below.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const identifier = recoveryIdentifier.trim();
      const res = await confirmPasswordReset(identifier, resetOtp.trim(), newPassword);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password. The verification code may be invalid or expired.');
        setIsSubmitting(false);
        return;
      }

      setLoginIdentifier(identifier);
      setLoginPassword(newPassword);

      // Attempt automatic sign-in
      const loginRes = await signInVendor(identifier, newPassword);
      if (loginRes.success && loginRes.vendor) {
        const vId = loginRes.vendor.id || loginRes.vendor.email || identifier;
        if (typeof window !== 'undefined') {
          localStorage.setItem('irisi_vendor_id', vId);
          localStorage.setItem('irisi_vendor_email', loginRes.vendor.email || identifier);
          localStorage.setItem('veyra_vendor_id', vId);
          localStorage.setItem('veyra_vendor_email', loginRes.vendor.email || identifier);
          document.cookie = `irisi_vendor_id=${vId}; path=/; max-age=2592000`;
          document.cookie = `veyra_vendor_id=${vId}; path=/; max-age=2592000`;
        }

        setVendorProfile({
          brandName: loginRes.vendor.brand_name || 'My Brand',
          designerName: loginRes.vendor.designer_name || 'Lead Manager',
          contactPerson: loginRes.vendor.contact_person || loginRes.vendor.designer_name,
          email: loginRes.vendor.email || identifier,
          phone: loginRes.vendor.phone || '',
          location: loginRes.vendor.location || '',
          vendorType: isBoutiqueVendor(loginRes.vendor) ? 'boutique_seller' : 'fashion_designer',
          specialty: loginRes.vendor.specialty || loginRes.vendor.vendorSpecialty || 'multi_department',
          vendorSpecialty: loginRes.vendor.specialty || loginRes.vendor.vendorSpecialty || 'multi_department',
          bankName: loginRes.vendor.bank_name || 'Guaranty Trust Bank (GTBank)',
          accountNumber: loginRes.vendor.account_number || '',
          accountName: loginRes.vendor.account_name || '',
          instagram: loginRes.vendor.instagram || '',
          bio: loginRes.vendor.bio || '',
        });

        setIsVendorLoggedIn(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });
        router.push('/vendor-portal');
        return;
      }

      setAuthMode('login');
      setRecoverySuccessMsg('Password reset successfully! Please sign in with your new password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      
      {/* ======================================================== */}
      {/* LEFT COLUMN: STICKY EDITORIAL SLIDESHOW (50% WIDTH) */}
      {/* ======================================================== */}
      <div className="hidden lg:flex relative w-full lg:w-1/2 h-[340px] lg:h-screen lg:sticky lg:top-0 shrink-0 overflow-hidden flex-col justify-between p-6 lg:p-12 bg-black select-none z-10">
        
        {/* Background Images Carousel */}
        {vendorEditorialSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? 'opacity-70 scale-105 transition-transform duration-[6000ms]' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              unoptimized
              priority={idx === 0}
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
          </div>
        ))}

        {/* Top Floating Badge & Back Link */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-white/90 hover:text-white text-xs font-mono-luxury uppercase tracking-wider backdrop-blur-md transition-all hover:bg-black/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Storefront</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-widest font-bold backdrop-blur-md">
            {vendorEditorialSlides[currentSlide].tag}
          </span>
        </div>

        {/* Bottom Section: Caption & Micro Footer anchored to bottom */}
        <div className="relative z-20 space-y-6 mt-auto">
          {/* Editorial Story Caption */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              {vendorEditorialSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    currentSlide === i ? 'w-8 bg-[var(--gold-accent)]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-editorial text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white font-bold leading-tight">
                {vendorEditorialSlides[currentSlide].title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                {vendorEditorialSlides[currentSlide].subtitle}
              </p>
            </div>
          </div>

          {/* Bottom Micro Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono-luxury text-zinc-400 border-t border-white/10 pt-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>0% Merchant Fee · Verified Bank Escrow</span>
            </span>
            <span>LAGOS · NIGERIA</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: SCROLLABLE AUTH INTERFACE (50% WIDTH) */}
      {/* ======================================================== */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative z-20 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="lg:hidden flex items-center gap-2">
            <BrandWordmark size="sm" withSubtitle={false} />
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--gold-accent)]" /> : <Moon className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/auth"
              className="text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline"
            >
              Shopper Login →
            </Link>
          </div>
        </div>

        {/* Center Container */}
        <div className="w-full max-w-md mx-auto space-y-6 my-auto py-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase font-bold tracking-wider">
              <span>
                {authMode === 'verify_otp'
                  ? 'Verification Required'
                  : authMode === 'forgot_password'
                  ? 'Account Recovery'
                  : authMode === 'reset_password'
                  ? 'Set New Password'
                  : authMode === 'register'
                  ? 'Partner Onboarding'
                  : 'Merchant Partner Portal'}
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              {authMode === 'verify_otp'
                ? 'Confirm Email & Activate'
                : authMode === 'forgot_password'
                ? 'Reset Merchant Password'
                : authMode === 'reset_password'
                ? 'Set New Password'
                : authMode === 'register'
                ? (isBoutiqueSelected ? 'Register Your Boutique' : 'Register Your Atelier')
                : 'Partner Workspace Login'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light">
              {authMode === 'verify_otp'
                ? `Enter the confirmation code sent to ${pendingEmail || regForm.email}.`
                : authMode === 'forgot_password'
                ? 'Enter your registered business email or Nigerian phone number to receive a recovery code.'
                : authMode === 'reset_password'
                ? `Enter the recovery code sent to ${recoveryInfo?.maskedEmail || 'your registered email'} and choose your new password.`
                : authMode === 'register'
                ? 'Publish your ready-to-wear drops and receive orders from verified shoppers.'
                : 'Access your store orders, catalog inventory, and instant settlement banking.'}
            </p>
          </div>

          {/* Mode Tabs: Only shown on Sign In / Register Store */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setRecoverySuccessMsg('');
                }}
                className={`py-2.5 rounded-xl transition-all font-semibold cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setRecoverySuccessMsg('');
                }}
                className={`py-2.5 rounded-xl transition-all font-semibold cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Register Store
              </button>
            </div>
          )}

          {/* Success Notification Alert */}
          {recoverySuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury flex items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{recoverySuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setRecoverySuccessMsg('')}
                className="text-[10px] text-emerald-400/60 hover:text-emerald-300 transition-colors uppercase font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Message Alert with Auto-Dismiss */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-[10px] text-rose-400/60 hover:text-rose-300 transition-colors uppercase font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. OTP VERIFICATION VIEW */}
          {/* ======================================================== */}
          {authMode === 'verify_otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-3 text-center">
                  6-Digit Merchant Confirmation Code
                </label>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`vendor-otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      autoFocus={index === 0}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono-luxury rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:ring-2 focus:ring-[var(--gold-accent)]/20 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.join('').length < 6}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Verifying Code & Activating Store...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Activate & Enter Merchant Portal</span>
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-3 pt-2 text-center text-xs font-mono-luxury">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isResending}
                  className={`inline-flex items-center gap-1.5 ${
                    resendTimer > 0
                      ? 'text-[var(--text-muted)] cursor-not-allowed'
                      : 'text-[var(--gold-accent)] font-semibold hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendTimer > 0
                      ? `Resend code in ${resendTimer}s`
                      : 'Didn’t receive code? Resend OTP'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                  }}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Edit Registration Details</span>
                </button>
              </div>
            </form>
          ) : authMode === 'forgot_password' ? (

            /* ======================================================== */
            /* 2. FORGOT PASSWORD VIEW */
            /* ======================================================== */
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Business Email or Registered Phone Number
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="contact@brand.ng or 08012*****"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                </div>
                <EmailDomainSuggestions email={recoveryIdentifier} onSelectDomain={(full) => setRecoveryIdentifier(full)} />
                <p className="text-[11px] text-[var(--text-muted)] font-mono-luxury mt-1.5">
                  Enter your registered business email or Nigerian phone number.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !recoveryIdentifier.trim()}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Finding Account & Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-3 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setRecoverySuccessMsg('');
                    setAuthMode('login');
                  }}
                  className="text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>

                <a
                  href="https://wa.me/2349070332145?text=Hello%20Irisi%20Support,%20I%20need%20assistance%20recovering%20my%20merchant%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono-luxury text-[var(--gold-accent)] hover:underline inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Instant WhatsApp Concierge Quick-Assist</span>
                </a>
              </div>
            </form>
          ) : authMode === 'reset_password' ? (

            /* ======================================================== */
            /* 3. RESET PASSWORD VIEW */
            /* ======================================================== */
            <form onSubmit={handleConfirmReset} className="space-y-4">
              {recoveryInfo?.accountName && (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Store / Brand:</span>
                  <span className="font-bold text-[var(--gold-accent)]">{recoveryInfo.accountName}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Recovery Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.trim())}
                    placeholder="Enter code from your email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-mono-luxury tracking-wider focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-mono-luxury mt-1.5">
                  Check your inbox {recoveryInfo?.maskedEmail ? `(${recoveryInfo.maskedEmail})` : ''} and spam folder for your recovery verification code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNewPassword((prev) => !prev);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmNewPassword((prev) => !prev);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                    aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !resetOtp.trim() || newPassword.length < 6}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Updating Password & Signing In...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Update Password & Enter Portal</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setAuthMode('forgot_password');
                  }}
                  className="text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Resend Code / Change Identifier</span>
                </button>

                {recoveryInfo?.supportUrl && (
                  <a
                    href={recoveryInfo.supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono-luxury text-[var(--gold-accent)] hover:underline inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Need Help? Contact Concierge on WhatsApp</span>
                  </a>
                )}
              </div>
            </form>
          ) : authMode === 'login' ? (

            /* ======================================================== */
            /* 4. SIGN IN VIEW */
            /* ======================================================== */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Business Email or Phone Number
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="contact@brand.ng or 08012*****"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                </div>
                <EmailDomainSuggestions email={loginIdentifier} onSelectDomain={(full) => setLoginIdentifier(full)} />
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowLoginPassword((prev) => !prev);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryIdentifier(loginIdentifier);
                      setErrorMessage('');
                      setRecoverySuccessMsg('');
                      setAuthMode('forgot_password');
                    }}
                    className="text-xs font-mono-luxury text-[var(--gold-accent)] hover:underline cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Signing In to Merchant Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Merchant Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <Link href="/" className="text-[11px] font-mono-luxury text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  ← Return to Shopper Storefront
                </Link>
              </div>
            </form>
          ) : (

            /* ======================================================== */
            /* 3. REGISTER VIEW */
            /* ======================================================== */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                  Store Specialty &amp; Department
                </label>
                <select
                  value={regForm.specialty || 'streetwear'}
                  onChange={(e) => {
                    const spec = e.target.value as VendorSpecialty;
                    setRegForm({
                      ...regForm,
                      specialty: spec,
                      vendorType: spec === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller'
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer font-bold"
                >
                  <option value="native_tailoring">Bespoke Native Tailoring Atelier (Agbada, Kaftans, Senator — Made to Measure)</option>
                  <option value="streetwear">Ready-to-Wear Clothing Boutique (Streetwear, Hoodies, Two-Piece Sets, Dresses)</option>
                  <option value="footwear">Footwear &amp; Slides (Palms, Slides, Loafers, Sneakers)</option>
                  <option value="caps">Caps, Hats &amp; Headwear (Fila, Dad Caps, Beanies, Bucket Hats)</option>
                  <option value="accessories">Jewelry, Watches &amp; Luxury Accessories (Chains, Watches, Bags, Belts)</option>
                  <option value="multi_department">Multi-Department Boutique (All Fashion &amp; Accessories)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                  {labels.brandLabel}
                </label>
                <div className="relative">
                  {isBoutiqueSelected ? (
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  ) : (
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  )}
                  <input
                    type="text"
                    required
                    value={regForm.brandName}
                    onChange={(e) => setRegForm({ ...regForm, brandName: e.target.value, designerName: e.target.value })}
                    placeholder={labels.brandPlaceholder}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="contact@brand.ng"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>
                  <EmailDomainSuggestions
                    email={regForm.email}
                    onSelectDomain={(val: string) => setRegForm({ ...regForm, email: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                    WhatsApp / Phone Line
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="08012*****"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                    />
                  </div>
                </div>
              </div>

              {/* Location: State & City Combobox */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                      State / Region
                    </label>
                    <select
                      value={regForm.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setRegForm((prev) => ({
                          ...prev,
                          state: newState,
                          city: '',
                          location: [prev.address, newState].filter(Boolean).join(', '),
                        }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                      City / Neighborhood
                    </label>
                    <SearchableCitySelect
                      state={regForm.state}
                      value={regForm.city}
                      onChange={(newCity) => {
                        setRegForm((prev) => ({
                          ...prev,
                          city: newCity,
                          location: [prev.address, newCity, prev.state].filter(Boolean).join(', '),
                        }));
                      }}
                      placeholder={`Search or type city in ${regForm.state}...`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                    {labels.addressLabel}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={regForm.address}
                      onChange={(e) => {
                        const newAddress = e.target.value;
                        setRegForm((prev) => ({
                          ...prev,
                          address: newAddress,
                          location: [newAddress, prev.city, prev.state].filter(Boolean).join(', '),
                        }));
                      }}
                      placeholder={labels.addressPlaceholder}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRegPassword((prev) => !prev);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRegConfirmPassword((prev) => !prev);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                      aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Settlement Banking Details (Optional at Registration) */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--gold-accent)] font-mono-luxury font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Settlement Bank Payout (Direct Escrow Payouts)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                      Settlement Bank
                    </label>
                    <select
                      value={regForm.bankName}
                      onChange={(e) => {
                        const selectedBankName = e.target.value;
                        const code = getBankCodeByName(selectedBankName);
                        setRegForm((prev) => ({
                          ...prev,
                          bankName: selectedBankName,
                          bankCode: code,
                        }));
                        if (regForm.accountNumber.length === 10) {
                          resolveBankAccount(regForm.accountNumber, code);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                    >
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-bold">
                      10-Digit NUBAN Account Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={regForm.accountNumber}
                        onChange={(e) => {
                          const cleanNum = e.target.value.replace(/[^0-9]/g, '');
                          setRegForm((prev) => ({ ...prev, accountNumber: cleanNum }));
                          if (cleanNum.length === 10) {
                            resolveBankAccount(cleanNum, regForm.bankCode);
                          } else {
                            setBankVerified(false);
                            setBankResolveError('');
                          }
                        }}
                        placeholder="0123456789"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury font-bold tracking-wider"
                      />
                      {isResolvingBank && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                      Settlement Account Name
                    </label>
                    {bankVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono-luxury font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={regForm.accountName}
                    onChange={(e) => setRegForm({ ...regForm, accountName: e.target.value.toUpperCase() })}
                    placeholder={isResolvingBank ? 'Verifying account holder...' : 'Enter or confirm account name'}
                    className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border text-xs uppercase font-bold tracking-wide focus:outline-none ${
                      bankVerified
                        ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/10'
                        : 'border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)]'
                    }`}
                  />
                  {bankResolveError && (
                    <p className="mt-1 text-[10px] text-amber-400 font-mono-luxury">
                      ⚠ {bankResolveError}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>{labels.btnText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <Link href="/" className="text-[11px] font-mono-luxury text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  ← Return to Shopper Storefront
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}

export default function VendorAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <VendorAuthPageContent />
    </Suspense>
  );
}
