'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import TrustScore from '@/components/ui/TrustScore';
import { useAuth } from '@/components/auth/AuthProvider';
import { CITIES } from '@/lib/data';

const STEPS = ['Basics', 'Details', 'Media', 'Publish'];

const PROPERTY_TYPES = ['House', 'Apartment', 'Studio', 'Portion', 'Room', 'Shop'];
const FURNISHINGS = ['Furnished', 'Semi-furnished', 'Unfurnished'];
const UTILITY_OPTIONS = ['Gas', 'Electricity', 'Water', 'Internet', 'Generator backup'];

type FormState = {
  title: string;
  city: string;
  locality: string;
  propertyType: string;
  rentAmount: string;
  description: string;
  rooms: string;
  bathrooms: string;
  areaMarla: string;
  furnishing: string;
  utilities: string[];
};

const initialForm: FormState = {
  title: '',
  city: 'Sialkot',
  locality: '',
  propertyType: 'House',
  rentAmount: '',
  description: '',
  rooms: '2',
  bathrooms: '1',
  areaMarla: '',
  furnishing: 'Unfurnished',
  utilities: [],
};

export default function ListPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [gateway, setGateway] = useState<'JAZZCASH' | 'EASYPAISA' | 'CARD'>('JAZZCASH');
  const [priceStats, setPriceStats] = useState<{ count: number; avg: number | null; min: number | null; max: number | null } | null>(null);

  useEffect(() => {
    return () => previewUrls.forEach(u => URL.revokeObjectURL(u));
  }, [previewUrls]);

  useEffect(() => {
    if (!form.city) return;
    const params = new URLSearchParams({ city: form.city });
    if (form.propertyType) params.set('type', form.propertyType);
    if (form.rooms) params.set('rooms', form.rooms);
    fetch(`/api/search/price-stats?${params}`)
      .then(r => r.json())
      .then(d => setPriceStats(d.count > 0 ? d : null))
      .catch(() => {});
  }, [form.city, form.propertyType, form.rooms]);

  function set(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggleUtility(u: string) {
    setForm(f => ({
      ...f,
      utilities: f.utilities.includes(u) ? f.utilities.filter(x => x !== u) : [...f.utilities, u],
    }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const urls = arr.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...arr]);
    setPreviewUrls(prev => [...prev, ...urls]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previewUrls[i]);
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
  }

  function validateStep() {
    setError('');
    if (step === 0) {
      if (form.title.length < 5) { setError('Title must be at least 5 characters.'); return false; }
      if (!form.locality.trim()) { setError('Locality is required.'); return false; }
      if (!form.rentAmount || parseInt(form.rentAmount) < 1) { setError('Enter a valid rent amount.'); return false; }
    }
    if (step === 1) {
      if (!form.rooms || parseInt(form.rooms) < 1) { setError('Rooms must be at least 1.'); return false; }
      if (form.utilities.length === 0) { setError('Select at least one utility.'); return false; }
    }
    if (step === 2) {
      if (photos.length === 0) { setError('Upload at least one photo.'); return false; }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  async function publish() {
    if (!validateStep()) return;
    setPublishing(true);
    setError('');
    try {
      // 1. Create draft listing
      const createRes = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          city: form.city,
          locality: form.locality,
          propertyType: form.propertyType,
          rentAmount: parseInt(form.rentAmount),
          description: form.description || undefined,
          rooms: parseInt(form.rooms),
          bathrooms: parseInt(form.bathrooms),
          areaMarla: form.areaMarla ? parseFloat(form.areaMarla) : undefined,
          furnishing: form.furnishing,
          utilities: form.utilities,
          listingType: 'OPEN',
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) { setError(createData.error ?? 'Failed to create listing.'); return; }

      const listingId = createData.listing.id;

      // 2. Upload photos
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach(f => fd.append('photos', f));
        await fetch(`/api/listings/${listingId}/photos`, { method: 'POST', body: fd });
      }

      // 3. Pay listing fee — activates listing as side-effect
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LISTING_FEE', listingId, gateway }),
      });
      if (!payRes.ok) { setError('Payment failed. Please try again.'); return; }

      router.push(`/property/${listingId}`);
    } finally {
      setPublishing(false);
    }
  }

  const previewTrust = 40 + (form.utilities.length > 0 ? 10 : 0) + (photos.length >= 3 ? 5 : 0);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="n-root">
        <TopBar />
        <div style={{ display: 'grid', placeItems: 'center', height: '70vh', textAlign: 'center' }}>
          <div>
            <div className="n-display" style={{ fontSize: 40, marginBottom: 12 }}>Sign in first</div>
            <div style={{ color: 'var(--n-muted)', marginBottom: 24 }}>You need to be signed in to list a property.</div>
            <button onClick={() => router.push('/')} className="n-btn primary">Go home</button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'LANDLORD') {
    return (
      <div className="n-root">
        <TopBar />
        <div style={{ display: 'grid', placeItems: 'center', height: '70vh', textAlign: 'center' }}>
          <div>
            <div className="n-display" style={{ fontSize: 36, marginBottom: 12 }}>Switch to landlord</div>
            <div style={{ color: 'var(--n-muted)', marginBottom: 24, maxWidth: 400 }}>
              Your account is set up as a tenant. Update your profile to list a property.
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'LANDLORD' }) });
                window.location.reload();
              }}
              className="n-btn accent"
            >
              Switch to landlord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="n-root">
      <TopBar role="landlord" />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 65px)' }}>
        {/* Step rail */}
        <div style={{ padding: '32px 28px', borderRight: '1px solid var(--n-line)', background: 'var(--n-bg-2)' }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)' }}>New listing</div>
          <h2 className="n-display" style={{ fontSize: 30, margin: '8px 0 28px', letterSpacing: '-0.02em' }}>Put it on Nivaas.</h2>

          {STEPS.map((s, i) => (
            <div
              key={s}
              onClick={() => i < step && setStep(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6,
                padding: '12px 10px', borderRadius: 10,
                cursor: i < step ? 'pointer' : 'default',
                background: i === step ? 'var(--n-surface)' : 'transparent',
                border: `1px solid ${i === step ? 'var(--n-line)' : 'transparent'}`,
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 999, flexShrink: 0,
                background: i < step ? 'var(--n-ink)' : i === step ? 'var(--n-accent)' : 'var(--n-surface)',
                color: i < step ? 'var(--n-bg)' : i === step ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                border: `1px solid ${i === step ? 'var(--n-accent)' : 'var(--n-line)'}`,
                display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: i === step ? 600 : 400, color: i > step ? 'var(--n-muted)' : 'var(--n-ink)' }}>{s}</div>
                {i === step && <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 2 }}>In progress</div>}
              </div>
            </div>
          ))}

          <div className="n-card" style={{ marginTop: 28, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="shield" />
              <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Fee preview</span>
            </div>
            <div className="n-display" style={{ fontSize: 28, marginTop: 8 }}>₨ 1,500</div>
            <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 4 }}>Listing fee · Pay on publish</div>
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '32px 48px', overflowY: 'auto' }}>

          {/* Step header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)' }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
              <h2 className="n-display" style={{ fontSize: 44, margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
                {step === 0 && 'Basic details.'}
                {step === 1 && 'Property specs.'}
                {step === 2 && 'Show the home.'}
                {step === 3 && 'Ready to publish.'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && <button onClick={() => setStep(s => s - 1)} className="n-btn ghost sm">Back</button>}
              {step < STEPS.length - 1 && (
                <button onClick={next} className="n-btn primary sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Continue <Icon name="arrow" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Step 0: Basics */}
          {step === 0 && (
            <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Listing title</div>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Cantonment 3-bed with courtyard"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>City</div>
                  <select
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }}
                  >
                    {CITIES.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Locality / Area</div>
                  <input
                    value={form.locality}
                    onChange={e => set('locality', e.target.value)}
                    placeholder="e.g. Cantonment, Sialkot"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Property type</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PROPERTY_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => set('propertyType', t)}
                      style={{
                        padding: '10px 0', borderRadius: 10,
                        border: `1px solid ${form.propertyType === t ? 'var(--n-accent)' : 'var(--n-line)'}`,
                        background: form.propertyType === t ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                        color: form.propertyType === t ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: 14,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Monthly rent (PKR)</div>
                <input
                  value={form.rentAmount}
                  onChange={e => set('rentAmount', e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 55000"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'var(--mono)', fontSize: 18, outline: 'none', boxSizing: 'border-box' }}
                />
                {form.rentAmount && (
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 6 }}>
                    ₨ {parseInt(form.rentAmount).toLocaleString()} / month
                  </div>
                )}
                {priceStats && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--n-accent-soft)', display: 'flex', gap: 16 }}>
                    <span className="n-mono" style={{ color: 'var(--n-accent-ink)', fontSize: 11 }}>
                      Market · {priceStats.count} listings
                    </span>
                    <span className="n-mono" style={{ color: 'var(--n-accent-ink)', fontSize: 11 }}>
                      avg ₨{priceStats.avg!.toLocaleString()}
                    </span>
                    <span className="n-mono" style={{ color: 'var(--n-accent-ink)', fontSize: 11 }}>
                      ₨{priceStats.min!.toLocaleString()} – ₨{priceStats.max!.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Description (optional)</div>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the property — key features, preferred tenant, lease terms…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div style={{ display: 'grid', gap: 24, maxWidth: 560 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Bedrooms</div>
                  <select
                    value={form.rooms}
                    onChange={e => set('rooms', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} bed{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Bathrooms</div>
                  <select
                    value={form.bathrooms}
                    onChange={e => set('bathrooms', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} bath{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Area (marla)</div>
                  <input
                    value={form.areaMarla}
                    onChange={e => set('areaMarla', e.target.value)}
                    placeholder="e.g. 10"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Furnishing</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {FURNISHINGS.map(f => (
                    <button
                      key={f}
                      onClick={() => set('furnishing', f)}
                      style={{
                        padding: '12px 0', borderRadius: 10,
                        border: `1px solid ${form.furnishing === f ? 'var(--n-accent)' : 'var(--n-line)'}`,
                        background: form.furnishing === f ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                        color: form.furnishing === f ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, fontSize: 14,
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Utilities available</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {UTILITY_OPTIONS.map(u => {
                    const on = form.utilities.includes(u);
                    return (
                      <button
                        key={u}
                        onClick={() => toggleUtility(u)}
                        style={{
                          padding: '8px 16px', borderRadius: 999,
                          border: `1px solid ${on ? 'var(--n-accent)' : 'var(--n-line)'}`,
                          background: on ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                          color: on ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                        }}
                      >
                        {on ? '✓ ' : ''}{u}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Media */}
          {step === 2 && (
            <div>
              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
                style={{
                  border: '2px dashed var(--n-line-2)', borderRadius: 16, padding: 40, textAlign: 'center',
                  cursor: 'pointer', background: 'var(--n-surface-2)', marginBottom: 20,
                }}
              >
                <Icon name="camera" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Drop photos here or click to browse</div>
                <div className="n-mono" style={{ color: 'var(--n-muted)' }}>JPG, PNG · Min 3 recommended · First photo becomes cover</div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => addPhotos(e.target.files)} style={{ display: 'none' }} />
              </div>

              {/* Photo grid */}
              {previewUrls.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {previewUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && (
                        <span className="n-chip dark" style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none' }}>Cover</span>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 999, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      >
                        <Icon name="close" className="n-ico" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="n-card" style={{ marginTop: 20, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon name="sparkle" />
                  <span style={{ fontWeight: 500 }}>Photo quality tips</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['Shoot in daylight', 'Horizontal orientation', 'Include kitchen + living room', 'No watermarks'].map(tip => (
                    <div key={tip} style={{ fontSize: 13, color: 'var(--n-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="check" className="n-ico" style={{ color: 'var(--n-accent)' }} /> {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Publish */}
          {step === 3 && (
            <div style={{ maxWidth: 600 }}>
              {/* Preview card */}
              <div style={{ marginBottom: 28 }}>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 10 }}>Live preview</div>
                <div className="n-card" style={{ display: 'grid', gridTemplateColumns: previewUrls[0] ? '240px 1fr' : '1fr', padding: 14, gap: 18 }}>
                  {previewUrls[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrls[0]} alt="" style={{ height: 180, borderRadius: 10, objectFit: 'cover', width: '100%' }} />
                  )}
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{form.title || 'Untitled listing'}</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 4 }}>{form.locality}, {form.city} · {form.propertyType} · {form.furnishing}</div>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, color: 'var(--n-muted)', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bed" /> {form.rooms}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bath" /> {form.bathrooms}</span>
                      {form.areaMarla && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="square" /> {form.areaMarla} marla</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <span className="n-display" style={{ fontSize: 28 }}>
                        {form.rentAmount ? `₨ ${parseInt(form.rentAmount).toLocaleString()}` : '₨ —'}
                        <span style={{ fontSize: 13, color: 'var(--n-muted)' }}> /mo</span>
                      </span>
                      <TrustScore value={previewTrust} size={44} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="n-card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 14 }}>Listing summary</div>
                {[
                  ['Title', form.title],
                  ['City', `${form.city} · ${form.locality}`],
                  ['Type', form.propertyType],
                  ['Rent', form.rentAmount ? `₨ ${parseInt(form.rentAmount).toLocaleString()} / month` : '—'],
                  ['Rooms', `${form.rooms} bed · ${form.bathrooms} bath`],
                  ['Furnishing', form.furnishing],
                  ['Utilities', form.utilities.join(', ') || '—'],
                  ['Photos', `${photos.length} uploaded`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--n-line)', fontSize: 14 }}>
                    <span className="n-mono" style={{ color: 'var(--n-muted)' }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Fee */}
              <div className="n-card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Listing fee</div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 4 }}>One-time · Valid 90 days · Renew anytime</div>
                </div>
                <div className="n-display" style={{ fontSize: 32 }}>₨ 1,500</div>
              </div>

              {/* Gateway picker */}
              <div style={{ marginBottom: 20 }}>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Pay via</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['JAZZCASH', 'EASYPAISA', 'CARD'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGateway(g)}
                      style={{
                        padding: '12px 0', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontWeight: gateway === g ? 600 : 400,
                        border: `1.5px solid ${gateway === g ? 'var(--n-accent)' : 'var(--n-line)'}`,
                        background: gateway === g ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                        color: gateway === g ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                      }}
                    >
                      {g === 'JAZZCASH' ? 'JazzCash' : g === 'EASYPAISA' ? 'Easypaisa' : 'Card'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={publish}
                disabled={publishing}
                className="n-btn accent"
                style={{ width: '100%', height: 52, justifyContent: 'center', fontSize: 16 }}
              >
                {publishing ? 'Processing payment…' : <><Icon name="zap" /> Pay ₨ 1,500 &amp; publish</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
