"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useCircadian } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';

export default function AuthPanel() {
  const { language } = useCircadian();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        setErrorMessage(t('magicLinkError', language));
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setStatus('success');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-k-surface-elevated/10 border border-k-border rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-k-gold/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>
      
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-k-gold-dim border border-k-gold/20 flex items-center justify-center text-k-gold mx-auto mb-4 shadow-lg">
          <Sparkles size={20} />
        </div>
        <h2 className="text-2xl font-display text-k-text tracking-wide mb-2">{t('loginHeader', language)}</h2>
        <p className="text-xs font-sans text-k-text-secondary leading-relaxed">
          {t('loginDesc', language)}
        </p>
      </div>

      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4 shadow-lg">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-sm font-sans text-k-text mb-2">Magic link sent</h3>
          <p className="text-xs font-sans text-k-text-tertiary">{t('checkEmail', language)}</p>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4 relative z-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-k-text-tertiary">
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder={t('emailPlaceholder', language)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-k-surface/50 border border-k-border-light text-k-text text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-k-gold/50 focus:bg-k-surface transition-all placeholder:text-k-text-tertiary font-sans"
              required
            />
          </div>
          
          {status === 'error' && (
            <p className="text-[10px] text-red-400 font-sans px-2">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-k-gold text-k-black font-sans text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-k-gold-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              t('continue', language)
            )}
          </button>
        </form>
      )}
    </div>
  );
}
