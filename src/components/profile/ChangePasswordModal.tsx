'use client';

import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, X, Check, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const targetEmail = (userEmail || emailInput || '').trim();

  // Password strength calculations
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialOrUpper = /[A-Z!@#$%^&*]/.test(newPassword);
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!targetEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current (old) password.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Please enter your new password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (confirmPassword.trim() && confirmPassword.trim() !== newPassword.trim()) {
      setErrorMessage('New passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update password. Please verify your current password.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md surface-card border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Change Password
            </h3>
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
              Secure your patron account and order vault
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono-luxury text-xs" noValidate>
          {/* Account Email Display or Input */}
          {userEmail ? (
            <div className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Account:</span>
              <span className="text-[var(--gold-accent)] font-bold truncate max-w-[220px]">{userEmail}</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-[var(--text-secondary)] uppercase font-bold text-[10px]">
                Account Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
              />
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-[var(--text-secondary)] uppercase font-bold text-[10px]">
              Current (Old) Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-[var(--text-secondary)] uppercase font-bold text-[10px]">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Live requirements pill list */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
              <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {hasMinLength ? <Check className="h-3 w-3" /> : '○'} 6+ characters
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {hasNumber ? <Check className="h-3 w-3" /> : '○'} Number
              </span>
              <span className={`inline-flex items-center gap-1 ${hasSpecialOrUpper ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {hasSpecialOrUpper ? <Check className="h-3 w-3" /> : '○'} Uppercase / Symbol
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[var(--text-secondary)] uppercase font-bold text-[10px]">
              Confirm New Password <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password (optional)"
                className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <span className="text-[10px] text-rose-400 flex items-center gap-1 pt-0.5">
                <AlertCircle className="h-3 w-3" /> Passwords do not match
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[var(--gold-accent)] text-black font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
