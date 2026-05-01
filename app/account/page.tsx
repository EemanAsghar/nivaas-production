'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

const TIER_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  BASIC:    { label: 'Basic',    desc: 'Phone verified only',          color: 'var(--n-muted)' },
  STANDARD: { label: 'Standard', desc: 'CNIC uploaded · Pending NADRA', color: 'var(--n-warn)' },
  VERIFIED: { label: 'Verified', desc: 'NADRA confirmed',              color: 'var(--n-accent-ink)' },
};

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const frontRef  = useRef<HTMLInputElement>(null);
  const backRef   = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile,  setBackFile]  = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview,  setBackPreview]  = useState('');

  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [uploading,       setUploading]       = useState(false);
  const [uploadMsg,       setUploadMsg]       = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview,   setAvatarPreview]   = useState('');

  if (loading) return null;
  if (!user) { router.push('/'); return null; }

  const tier = TIER_LABELS[user.verificationTier] ?? TIER_LABELS.BASIC;

  function pickFile(side: 'front' | 'back', file: File) {
    const url = URL.createObjectURL(file);
    if (side === 'front') { setFrontFile(file); setFrontPreview(url); }
    else                  { setBackFile(file);  setBackPreview(url); }
  }

  async function saveProfile() {
    if (!name.trim()) return;
    setSaving(true); setSaveMsg('');
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) { await refresh(); setSaveMsg('Saved.'); }
    else setSaveMsg('Failed to save.');
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd });
    if (res.ok) await refresh();
    setAvatarUploading(false);
  }

  async function uploadCnic() {
    if (!frontFile || !backFile) { setUploadMsg('Select both sides of your CNIC.'); return; }
    setUploading(true); setUploadMsg('');
    const fd = new FormData();
    fd.append('cnicFront', frontFile);
    fd.append('cnicBack',  backFile);
    const res = await fetch('/api/cnic', { method: 'POST', body: fd });
    if (res.ok) {
      await refresh();
      setUploadMsg('CNIC submitted. An admin will confirm your identity shortly.');
    } else {
      const d = await res.json();
      setUploadMsg(d.error ?? 'Upload failed.');
    }
    setUploading(false);
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--n-line)', background: 'var(--n-surface-2)',
    color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 40px' }}>

        {/* Header */}
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Account</div>
        <h1 className="n-display" style={{ fontSize: 44, margin: '0 0 32px', letterSpacing: '-0.02em' }}>Your profile</h1>

        {/* Verification tier card */}
        <div className="n-card" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: user.verificationTier === 'VERIFIED' ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="shield" className="n-ico lg" style={{ color: user.verificationTier === 'VERIFIED' ? 'var(--n-accent-ink)' : 'var(--n-muted)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: tier.color }}>{tier.label} tier</div>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 2 }}>{tier.desc}</div>
          </div>
          {user.verificationTier === 'BASIC' && (
            <a href="#cnic" className="n-btn primary sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" /> Verify now
            </a>
          )}
          {user.verificationTier === 'VERIFIED' && (
            <span className="n-chip verified">✓ NADRA Confirmed</span>
          )}
        </div>

        {/* Avatar */}
        <div className="n-card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            onClick={() => avatarRef.current?.click()}
            style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, position: 'relative' }}
          >
            {(avatarPreview || user.photoUrl) ? (
              <img src={avatarPreview || user.photoUrl!} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: 24, color: 'var(--n-accent-ink)' }}>{(user.name ?? user.phone)[0].toUpperCase()}</span>
            )}
            {avatarUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}>
                <Icon name="camera" style={{ color: '#fff' }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{user.name ?? 'No name set'}</div>
            <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{user.phone}</div>
          </div>
          <button onClick={() => avatarRef.current?.click()} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="camera" /> {avatarUploading ? 'Uploading…' : 'Change photo'}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
        </div>

        {/* Profile info */}
        <div className="n-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 500, marginBottom: 16 }}>Profile information</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Phone number</div>
              <div style={{ ...inputStyle, background: 'var(--n-bg-2)', color: 'var(--n-muted)', cursor: 'not-allowed' }}>
                {user.phone}
              </div>
            </div>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Full name</div>
              <input
                defaultValue={user.name ?? ''}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Adeel Rehman"
                style={inputStyle}
              />
            </div>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Role</div>
              <div style={{ ...inputStyle, background: 'var(--n-bg-2)', color: 'var(--n-muted)', cursor: 'not-allowed' }}>
                {user.role}
              </div>
            </div>
          </div>
          {saveMsg && (
            <div style={{ marginTop: 12, fontSize: 13, color: saveMsg === 'Saved.' ? 'var(--n-accent-ink)' : 'var(--n-danger)' }}>{saveMsg}</div>
          )}
          <button
            onClick={saveProfile}
            disabled={saving || !name.trim()}
            className="n-btn primary"
            style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? 'Saving…' : <><Icon name="check" /> Save changes</>}
          </button>
        </div>

        {/* CNIC upload */}
        {user.verificationTier === 'BASIC' && (
          <div className="n-card" style={{ padding: 24 }} id="cnic">
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Identity verification</div>
            <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 20 }}>
              Upload both sides of your CNIC to upgrade to Standard tier. An admin will confirm your identity with NADRA to reach Verified tier.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {(['front', 'back'] as const).map(side => {
                const preview = side === 'front' ? frontPreview : backPreview;
                const ref = side === 'front' ? frontRef : backRef;
                return (
                  <div key={side}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>
                      CNIC · {side === 'front' ? 'Front' : 'Back'}
                    </div>
                    <div
                      onClick={() => ref.current?.click()}
                      style={{
                        height: 140, borderRadius: 12, border: '2px dashed var(--n-line-2)',
                        background: preview ? `url(${preview}) center/cover` : 'var(--n-surface-2)',
                        cursor: 'pointer', display: 'grid', placeItems: 'center', position: 'relative',
                      }}
                    >
                      {!preview && (
                        <div style={{ textAlign: 'center', color: 'var(--n-muted)' }}>
                          <Icon name="camera" className="n-ico xl" />
                          <div className="n-mono" style={{ marginTop: 8, fontSize: 12 }}>Click to upload</div>
                        </div>
                      )}
                      {preview && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 10, display: 'grid', placeItems: 'center' }}>
                          <span className="n-chip" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none' }}>Change</span>
                        </div>
                      )}
                      <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => e.target.files?.[0] && pickFile(side, e.target.files[0])}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {uploadMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12,
                background: uploadMsg.startsWith('CNIC submitted') ? 'var(--n-accent-soft)' : 'color-mix(in oklab, var(--n-danger) 12%, transparent)',
                color: uploadMsg.startsWith('CNIC submitted') ? 'var(--n-accent-ink)' : 'var(--n-danger)',
              }}>
                {uploadMsg}
              </div>
            )}

            <button
              onClick={uploadCnic}
              disabled={uploading || !frontFile || !backFile}
              className="n-btn accent"
              style={{ width: '100%', justifyContent: 'center', height: 44 }}
            >
              {uploading ? 'Uploading…' : <><Icon name="shield" /> Submit for verification</>}
            </button>
          </div>
        )}

        {user.verificationTier === 'STANDARD' && (
          <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="stamp" className="n-ico xl" style={{ color: 'var(--n-warn)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 500 }}>CNIC under review</div>
              <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 4 }}>
                Your documents are with our team. NADRA confirmation usually takes 24–48 hours.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
