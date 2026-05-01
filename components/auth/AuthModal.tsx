'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

type Step = 'phone' | 'otp' | 'profile';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { id: string; name: string | null; role: string }) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'TENANT' | 'LANDLORD'>('TENANT');
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...(email && { email }) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data._dev_otp) setDevOtp(data._dev_otp);
      setOtpSentTo(email || phone);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    setLoading(true);
    try {
      // Verify OTP once — this sets the session cookie
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('profile');
    } finally {
      setLoading(false);
    }
  }

  async function completeProfile() {
    setError('');
    setLoading(true);
    try {
      // Session is already set — just update profile via PATCH
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, acceptedTerms: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      onSuccess(data.user);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div className="n-card" style={{ position: 'relative', width: 440, padding: 32, zIndex: 1 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
          <Icon name="close" className="n-ico lg" />
        </button>

        {step === 'phone' && (
          <>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Welcome to</div>
            <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Nivaas</h2>
            <p style={{ fontSize: 14, color: 'var(--n-muted)', marginBottom: 20 }}>Enter your Pakistani mobile number to get started.</p>
            <div style={{ marginBottom: 12 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Mobile number</div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="03001234567"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 16, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Email (OTP will be sent here)</div>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="you@example.com"
                type="email"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }}
              />
            </div>
            {error && <div style={{ color: 'var(--n-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={sendOtp} disabled={!phone || loading} className="n-btn accent" style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15 }}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Verify</div>
            <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Enter OTP</h2>
            <p style={{ fontSize: 14, color: 'var(--n-muted)', marginBottom: 20 }}>Sent to {otpSentTo || phone}</p>
            {devOtp && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', fontSize: 13, marginBottom: 16 }}>
                <span className="n-mono">Dev OTP: </span><b style={{ fontSize: 18 }}>{devOtp}</b>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>6-digit code</div>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                placeholder="123456"
                maxLength={6}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'var(--mono)', fontSize: 24, letterSpacing: '0.2em', outline: 'none', textAlign: 'center' }}
              />
            </div>
            {error && <div style={{ color: 'var(--n-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={verifyOtp} disabled={otp.length < 6 || loading} className="n-btn accent" style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15 }}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button onClick={() => setStep('phone')} className="n-btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Back</button>
          </>
        )}

        {step === 'profile' && (
          <>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Almost there</div>
            <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Your profile</h2>
            <div style={{ marginBottom: 16 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Your name</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Adeel Rehman"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>I am a</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['TENANT', 'LANDLORD'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      padding: '14px 0', borderRadius: 10, border: `1px solid ${role === r ? 'var(--n-accent)' : 'var(--n-line)'}`,
                      background: role === r ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                      color: role === r ? 'var(--n-accent-ink)' : 'var(--n-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                    }}
                  >
                    {r === 'TENANT' ? '🏠 Tenant' : '🔑 Landlord'}
                  </button>
                ))}
              </div>
            </div>
            {error && <div style={{ color: 'var(--n-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={completeProfile} disabled={!name || loading} className="n-btn accent" style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
