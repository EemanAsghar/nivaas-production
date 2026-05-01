import TopBar from '@/components/ui/TopBar';

export const metadata = { title: 'Privacy Policy — Nivaas' };

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly: name, phone number, CNIC images, and property details. We also collect usage data including IP addresses, device type, and interactions with the Platform to improve our services.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your data to operate the Platform, verify your identity, facilitate rental agreements, process payments, send notifications, and comply with legal obligations. We do not sell your personal data to third parties.`,
  },
  {
    title: '3. CNIC and Identity Documents',
    body: `CNIC images are stored securely and used solely for identity verification with NADRA. Access is restricted to authorised staff. Documents are retained for the duration of your account and deleted within 90 days of account closure.`,
  },
  {
    title: '4. Data Sharing',
    body: `We share limited data with other users as needed to facilitate rentals — for example, your name and phone are shared with the other party to a signed lease. We may share data with law enforcement when required by Pakistani law.`,
  },
  {
    title: '5. Data Security',
    body: `We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for data at rest. Passwords are never stored; authentication is via OTP. Despite these measures, no system is perfectly secure and we cannot guarantee absolute security.`,
  },
  {
    title: '6. Cookies',
    body: `We use a single authentication cookie (nivaas_token) to maintain your session. We do not use advertising or tracking cookies. You may clear this cookie at any time to log out.`,
  },
  {
    title: '7. Your Rights',
    body: `You may request access to, correction of, or deletion of your personal data by contacting us. Deletion requests will be processed within 30 days, subject to legal retention requirements.`,
  },
  {
    title: '8. Contact Us',
    body: `For privacy concerns, contact our Data Protection Officer at privacy@nivaas.pk. For urgent identity verification issues, call our helpline at 0800-NIVAAS (64-8227).`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Legal</div>
        <h1 className="n-display" style={{ fontSize: 48, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--n-muted)', marginBottom: 40 }}>Last updated: April 2026</p>

        <div style={{ display: 'grid', gap: 28 }}>
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--n-muted)', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
