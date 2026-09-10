'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Sparkles, ArrowRight, ArrowLeft, User, Lock, Mail, Phone,
  ExternalLink, Loader2, Eye, EyeOff, KeyRound, CheckCircle2, RotateCw, MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { signUpCustomer, signInCustomer, verifyOtpCode, resendOtpCode, requestPasswordReset, confirmPasswordReset } from '@/lib/services/auth';
import EmailDomainSuggestions from '@/components/common/EmailDomainSuggestions';

const editorialSlides = [
  {
    image: '/images/products/BlackAgbada.jpg',
    title: 'Bespoke Nigerian Couture',
    subtitle: 'Hand-tailored Senator Kaftans, Royal Agbada robes, and tailored native wear from top independent designers.',
    tag: 'Men & Unisex Native'
  },
  {
    image: '/images/editorial/female_dress.jpg',
    title: 'Artisanal Silk Boubous & Gowns',
    subtitle: 'Flowing silk Bubu dresses, artisanal Adire robes, and vibrant African heritage maxis.',
    tag: "Women's Couture & Silks"
  },
  {
    image: '/images/products/WhiteNdBrownHoodie.jpg',
    title: 'Cream & Mocha Streetwear Hoodie',
    subtitle: 'Heavyweight 480GSM fleece with puff graphics, dropped shoulders, and relaxed streetwear fit.',
    tag: 'Streetwear & Hoodies'
  },
  {
    image: '/images/editorial/female_shirt.jpg',
    title: 'Contemporary Dresses & Co-ord Sets',
    subtitle: 'Tailored two-piece co-ord sets, silk trousers, evening dresses, and chic ready-to-wear silhouettes.',
    tag: "Women's Ready-to-Wear"
  },
  {
    image: '/images/products/LVhoodie.jpg',
    title: 'Luxury Monogram Fleece Hoodie',
    subtitle: 'High-density cotton knit with designer monogram embroidery and double-lined hood.',
    tag: 'Designer Streetwear'
  },
  {
    image: '/images/products/UnisexSlides.jpg',
    title: 'Handcrafted Leather Slides & Palms',
    subtitle: 'Authentic cowhide leather slides, ergonomic palms, and cushioned slip-ons made in Nigeria.',
    tag: 'Footwear & Slides'
  },
  {
    image: '/images/products/CarmoCap.jpg',
    title: 'Tactical Camo Streetwear Cap',
    subtitle: 'Structured 6-panel camouflage dad hat with heavy-duty metal clasp and curved brim.',
    tag: 'Caps & Headwear'
  },
  {
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200&auto=format&fit=crop',
    title: 'Designer Heels, Mules & Sandals',
    subtitle: 'Statement block heels, handcrafted leather mules, and elegant strappy sandals for every occasion.',
    tag: "Women's Heels & Mules"
  },
  {
    image: '/images/products/Cap1.png',
    title: 'Royal Embroidered Fila Cap',
    subtitle: 'Hand-tailored royal cotton velvet Fila with traditional geometric embroidery.',
    tag: 'Native Headwear'
  },
  {
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop',
    title: 'Fine Jewelry & Luxury Watches',
    subtitle: 'Solid gold Cuban links, iced pendants, custom signet rings, layered chains, and luxury timepieces.',
    tag: 'Jewelry & Watches'
  },
  {
    image: '/images/products/BlackTrapStarHoodie.jpg',
    title: 'Trapstar Heavyweight Cyber Hoodie',
    subtitle: 'Heavyweight brushed cotton fleece with gothic street typography and kangaroo pocket.',
    tag: 'Urban Drops'
  },
  {
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop',
    title: 'Designer Backpacks & Leather Totes',
    subtitle: 'Full-grain structured leather backpacks, crossbodies, travel duffels, and everyday luxury totes.',
    tag: 'Backpacks & Bags'
  },
  {
    image: '/images/products/BlackSmartShoes.jpg',
    title: 'Smart Shoes & Luxury Footwear',
    subtitle: 'Hand-burnished leather loafers, Italian-cut dress shoes, and contemporary footwear.',
    tag: 'Shoes & Footwear'
  },
  {
    image: '/images/products/BaggyJean.jpg',
    title: 'Raw Selvedge Denim & Cargo Pants',
    subtitle: 'Heavyweight 14oz wide-leg baggy denim, tailored multi-pocket cargo pants, and relaxed trousers.',
    tag: 'Pants & Denim'
  }
];

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/shop';
  const { setUserAuth, setSelectedGender, setBodyProfile } = useStore();

  const [mode, setMode] = useState<'signup' | 'login' | 'verify_otp' | 'forgot_password' | 'reset_password'>('login');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [preferredSize, setPreferredSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Recovery State
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryInfo, setRecoveryInfo] = useState<{
    maskedEmail?: string;
    maskedPhone?: string;
    resolvedEmail?: string;
    accountName?: string;
    token?: string;
    supportUrl?: string;
  } | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // OTP Verification State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUserData, setPendingUserData] = useState<{
    name: string;
    email: string;
    phone: string;
    gender: 'male' | 'female';
    preferredSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
    twinId: string;
  } | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Auto-rotate editorial slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % editorialSlides.length);
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

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer > 0 && mode === 'verify_otp') {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const twinId = `VY-NIG-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match. Please re-enter your password.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUpCustomer({
          email,
          password,
          fullName: name,
          phone,
          gender,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Account registration failed. Please check your details.');
          setIsSubmitting(false);
          return;
        }

        // Registration successful! Switch to 6-digit OTP verification screen!
        setPendingEmail(email);
        setPendingUserData({
          name: name || email.split('@')[0],
          email,
          phone,
          gender,
          preferredSize,
          twinId,
        });
        setOtp(['', '', '', '', '', '']);
        setResendTimer(30);
        setMode('verify_otp');
        setIsSubmitting(false);
        return;
      } else {
        const res = await signInCustomer(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid email or password. Please check your credentials.');
          setIsSubmitting(false);
          return;
        }

        const loggedInName = res.profile?.full_name || res.profile?.name || email.split('@')[0];
        const loggedInPhone = res.profile?.phone || '';

        setUserAuth({
          isLoggedIn: true,
          name: loggedInName,
          email: email,
          phone: loggedInPhone,
          gender,
          userType: 'shopper',
        });

        setSelectedGender(gender);

        setBodyProfile({
          name: loggedInName,
          email: email,
          phone: loggedInPhone,
          gender,
          twinId,
          isInitialized: true,
        });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });

        router.push(redirectTarget);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Input handler with auto-advance and paste support
  const handleOtpChange = (index: number, value: string) => {
    // Paste support for 6 digits
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      const el = document.getElementById(`otp-input-${nextIdx}`);
      if (el) el.focus();
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto focus next box
    if (digit && index < 5) {
      const el = document.getElementById(`otp-input-${index + 1}`);
      if (el) el.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const el = document.getElementById(`otp-input-${index - 1}`);
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
      const activeEmail = pendingEmail || email;
      const res = await verifyOtpCode(activeEmail, token, 'signup');
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid or expired 6-digit code. Please check your email.');
        setIsSubmitting(false);
        return;
      }

      const activeName = res.profile?.name || pendingUserData?.name || name || activeEmail.split('@')[0];
      const activePhone = res.profile?.phone || pendingUserData?.phone || phone;

      setUserAuth({
        isLoggedIn: true,
        name: activeName,
        email: activeEmail,
        phone: activePhone,
        gender: pendingUserData?.gender || gender,
        userType: 'shopper',
      });

      setSelectedGender(pendingUserData?.gender || gender);

      setBodyProfile({
        name: activeName,
        email: activeEmail,
        phone: activePhone,
        gender: pendingUserData?.gender || gender,
        preferredSize: pendingUserData?.preferredSize || preferredSize || 'M',
        twinId: pendingUserData?.twinId || `VY-NIG-${Math.floor(100 + Math.random() * 900)}`,
        isInitialized: true,
      });

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });

      router.push(redirectTarget);
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
      const activeEmail = pendingEmail || email;
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
      setErrorMessage('Please enter your email address or Nigerian phone number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    setRecoverySuccessMsg('');

    try {
      const res = await requestPasswordReset(recoveryIdentifier.trim(), 'shopper');
      if (!res.success) {
        setErrorMessage(res.error || 'No customer account found with that email or phone number.');
        setIsSubmitting(false);
        return;
      }

      setRecoveryInfo({
        maskedEmail: res.email,
        maskedPhone: res.phone,
        resolvedEmail: res.resolvedEmail,
        accountName: res.accountName,
        token: res.token,
        supportUrl: res.supportUrl,
      });

      if (res.token) {
        setResetOtp(res.token);
      }

      setMode('reset_password');
      setRecoverySuccessMsg(res.message || 'Recovery code generated. Enter the code and choose your new password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setErrorMessage('Please enter your verification code.');
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
      const identifier = recoveryInfo?.resolvedEmail || recoveryIdentifier.trim();
      const res = await confirmPasswordReset(identifier, resetOtp.trim(), newPassword);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password. Verification code may have expired.');
        setIsSubmitting(false);
        return;
      }

      // Auto sign in shopper
      const loginRes = await signInCustomer(identifier, newPassword);
      if (loginRes.success && loginRes.user) {
        const activeProfile = loginRes.profile || {};
        const activeName = activeProfile.name || activeProfile.full_name || loginRes.user.user_metadata?.full_name || identifier.split('@')[0];
        const activePhone = activeProfile.phone || loginRes.user.user_metadata?.phone || '';

        setUserAuth({
          isLoggedIn: true,
          name: activeName,
          email: identifier,
          phone: activePhone,
          gender: (activeProfile.gender as any) || 'male',
          userType: 'shopper',
        });

        setSelectedGender((activeProfile.gender as any) || 'male');

        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });

        router.push(redirectTarget);
        return;
      }

      setMode('login');
      setEmail(identifier);
      setPassword(newPassword);
      setRecoverySuccessMsg('Password updated successfully! Please sign in with your new password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row bg-[var(--bg-primary)]">
      
      {/* LEFT COLUMN: Fixed full-height non-scrollable slideshow — desktop only */}
      <div className="hidden lg:flex relative w-full lg:w-1/2 h-[340px] lg:h-screen lg:sticky lg:top-0 shrink-0 overflow-hidden flex-col justify-between p-6 lg:p-12 bg-black select-none z-10">
        
        {/* Background Image Carousel with Fade */}
        {editorialSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-80 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            } transition-transform duration-7000`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              className="object-cover object-center"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
          </div>
        ))}

        {/* Top Floating Badge & Back Link */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-white/90 hover:text-white text-xs font-mono-luxury uppercase tracking-wider backdrop-blur-md transition-all hover:bg-black/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Shop</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-widest font-bold backdrop-blur-md">
            {editorialSlides[currentSlide].tag}
          </span>
        </div>

        {/* Bottom Section: Caption & Micro Footer anchored to bottom */}
        <div className="relative z-20 space-y-6 mt-auto">
          {/* Editorial Story Caption */}
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-2">
              {editorialSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentSlide ? 'w-8 bg-[var(--gold-accent)]' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {editorialSlides[currentSlide].title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                {editorialSlides[currentSlide].subtitle}
              </p>
            </div>
          </div>

          {/* Bottom Micro Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono-luxury text-zinc-400 border-t border-white/10 pt-4">
            <span>ÌRÍSÍ SECURED GATEWAY</span>
            <span>NATIONWIDE · NIGERIA</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Independently scrollable form */}
      <div className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[var(--bg-primary)] overflow-y-auto">

        <div className="w-full max-w-md mx-auto space-y-6 my-auto pt-6 pb-16">
          
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                {mode === 'verify_otp'
                  ? 'Email Confirmation'
                  : mode === 'forgot_password'
                  ? 'Account Recovery'
                  : mode === 'reset_password'
                  ? 'Set New Password'
                  : mode === 'signup'
                  ? 'Join Ìrísí Club'
                  : 'Welcome Back'}
              </span>
            </div>
            
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              {mode === 'verify_otp'
                ? 'Enter Confirmation Code'
                : mode === 'forgot_password'
                ? 'Reset Your Password'
                : mode === 'reset_password'
                ? 'Create New Password'
                : mode === 'signup'
                ? 'Create Your Account'
                : 'Sign in to Ìrísí'}
            </h1>
            
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              {mode === 'verify_otp'
                ? `We sent a confirmation code to ${pendingEmail || email}. Enter it below to activate your account.`
                : mode === 'forgot_password'
                ? 'Enter your registered email address or Nigerian phone number to receive a recovery code.'
                : mode === 'reset_password'
                ? `Enter the recovery code sent for ${recoveryInfo?.maskedEmail || recoveryInfo?.resolvedEmail || 'your account'} and choose your new password.`
                : mode === 'signup'
                ? 'Join Nigeria’s premier ready-to-wear fashion marketplace with 24-48h dispatch.'
                : 'Access your saved items, cart, and express checkout.'}
            </p>
          </div>

          {/* Mode Tabs — underline style (Only on Sign In / Sign Up) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex border-b border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setRecoverySuccessMsg('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 -mb-[1px] ${
                  mode === 'login'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setRecoverySuccessMsg('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 -mb-[1px] ${
                  mode === 'signup'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                I&apos;m New Here
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
                className="text-[10px] text-rose-400/60 hover:text-rose-300 transition-colors uppercase font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* MODE: VERIFY OTP */}
          {mode === 'verify_otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              
              {/* 6 Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-3 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
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

              {/* Submit OTP */}
              <button
                type="submit"
                disabled={isSubmitting || otp.join('').length < 6}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Confirm & Enter Shop</span>
                  </>
                )}
              </button>

              {/* Resend Code & Back Controls */}
              <div className="flex flex-col items-center gap-3 pt-2 text-center text-xs font-mono-luxury">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isResending}
                  className={`inline-flex items-center gap-1.5 ${
                    resendTimer > 0
                      ? 'text-[var(--text-muted)] cursor-not-allowed'
                      : 'text-[var(--gold-accent)] font-semibold hover:underline'
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
                    setMode('signup');
                    setErrorMessage('');
                  }}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Wrong email? Change Email</span>
                </button>
              </div>

            </form>
          ) : mode === 'forgot_password' ? (

            /* ======================================================== */
            /* FORGOT PASSWORD VIEW */
            /* ======================================================== */
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Email Address or Nigerian Phone Number
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="you@email.com or 08012*****"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
                <EmailDomainSuggestions email={recoveryIdentifier} onSelectDomain={(full) => setRecoveryIdentifier(full)} />
                <p className="text-[11px] text-[var(--text-muted)] font-mono-luxury mt-1.5">
                  Enter your registered shopper email or Nigerian phone number.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !recoveryIdentifier.trim()}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Finding Account & Generating Code...</span>
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
                    setMode('login');
                  }}
                  className="text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>

                <a
                  href="https://wa.me/2349070332145?text=Hello%20Irisi%20Support,%20I%20need%20assistance%20recovering%20my%20shopper%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono-luxury text-[var(--gold-accent)] hover:underline inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Instant WhatsApp Concierge Quick-Assist</span>
                </a>
              </div>
            </form>
          ) : mode === 'reset_password' ? (

            /* ======================================================== */
            /* RESET PASSWORD VIEW */
            /* ======================================================== */
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)]">
                    Recovery Verification Code
                  </label>
                  {recoveryInfo?.token && (
                    <button
                      type="button"
                      onClick={() => setResetOtp(recoveryInfo.token || '')}
                      className="text-[10px] font-mono-luxury text-[var(--gold-accent)] underline hover:opacity-80 cursor-pointer"
                    >
                      Auto-fill Code ({recoveryInfo.token})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.trim())}
                    placeholder="Enter verification code"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-mono-luxury tracking-wider focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
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
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
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
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !resetOtp.trim() || newPassword.length < 6}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Updating Password & Entering Shop...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Update Password & Enter Shop</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('forgot_password');
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
          ) : (
            /* MODE: SIGN IN / SIGN UP */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Full Name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Email Address or Phone Number */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  {mode === 'login' ? 'Email Address or Phone Number' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type={mode === 'login' ? 'text' : 'email'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === 'login' ? 'you@email.com or 080...' : 'you@email.com'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
                <EmailDomainSuggestions email={email} onSelectDomain={(full) => setEmail(full)} />
              </div>

              {/* Mobile Phone Number (Required for Nigerian Delivery & Dispatch) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Mobile Phone Number (Required for Dispatch)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gold-accent)]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012*****"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryIdentifier(email);
                        setErrorMessage('');
                        setRecoverySuccessMsg('');
                        setMode('forgot_password');
                      }}
                      className="text-xs font-mono-luxury text-[var(--gold-accent)] hover:underline cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm Password (Sign-up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Gender Preference and Clothing Size for Sign-Up */}
              {mode === 'signup' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      Primary Department
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-mono-luxury font-bold transition-all text-center cursor-pointer ${
                          gender === 'male'
                            ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)]/30'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Men&apos;s Fashion
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-mono-luxury font-bold transition-all text-center cursor-pointer ${
                          gender === 'female'
                            ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)]/30'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Women&apos;s Fashion
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)]">
                        What clothing size do you wear?
                      </label>
                      <span className="text-[11px] font-mono-luxury font-bold text-[var(--gold-accent)]">
                        Selected: {preferredSize}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setPreferredSize(sz)}
                          className={`py-2 px-1 rounded-xl border text-xs font-mono-luxury font-bold transition-all text-center cursor-pointer ${
                            preferredSize === sz
                              ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md font-extrabold'
                              : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono-luxury mt-1">
                      Products across the store will automatically default to your chosen size ({preferredSize}).
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 mt-3"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Create Account & Receive Code' : 'Sign In to Shop'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* Designer / Vendor Note */}
          <div className="pt-3 border-t border-[var(--border-subtle)] text-center">
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Are you a Nigerian fashion designer or boutique seller?{' '}
              <a
                href="/vendor-portal/auth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gold-accent)] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Open Vendor Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <AuthPageContent />
    </Suspense>
  );
}
