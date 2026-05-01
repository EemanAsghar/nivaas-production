import TopBar from '@/components/ui/TopBar';

export const metadata = { title: 'Terms of Service — Nivaas' };

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Nivaas ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all users, including tenants, landlords, inspectors, and visitors.`,
  },
  {
    title: '2. Platform Role',
    body: `Nivaas is a rental marketplace that connects landlords and tenants in Punjab, Pakistan. We do not own, manage, or control any property listed on the Platform. We are not a party to any rental agreement or lease and bear no responsibility for the condition of any listed property.`,
  },
  {
    title: '3. User Accounts',
    body: `You must register with a valid Pakistani mobile number. You are responsible for maintaining the confidentiality of your account. All OTPs are single-use and expire within 10 minutes. You may not create accounts on behalf of others without their consent.`,
  },
  {
    title: '4. Listing Rules',
    body: `Landlords may only list properties they own or have authority to rent. Listings must be accurate, complete, and not misleading. Fraudulent or duplicate listings will result in immediate removal and permanent account suspension. A listing fee of ₨ 1,500 applies per active listing.`,
  },
  {
    title: '5. Lease Agreements',
    body: `Digital leases signed through Nivaas constitute legally binding agreements under applicable Pakistani law. Both parties must review terms carefully before signing. Nivaas provides a standard template; users may seek legal counsel before signing.`,
  },
  {
    title: '6. Inspections',
    body: `Inspection services are provided by third-party inspectors assigned by Nivaas. An inspection fee of ₨ 1,800 applies. Reports are for informational purposes only and do not constitute a warranty of property condition.`,
  },
  {
    title: '7. Prohibited Activities',
    body: `You may not use the Platform to: post false or misleading information; harass or harm other users; circumvent Platform fees; engage in money laundering or fraudulent transactions; or violate any applicable law or regulation.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, Nivaas and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the 30 days prior to the claim.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. Material changes will be notified via SMS or in-app notification.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of courts in Lahore, Punjab.`,
  },
];

export default function TermsPage() {
  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Legal</div>
        <h1 className="n-display" style={{ fontSize: 48, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Terms of Service</h1>
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
