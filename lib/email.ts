export async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'Nivaas <onboarding@resend.dev>',
    to,
    subject: `Your Nivaas OTP: ${code}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="font-size:24px;font-weight:700;margin-bottom:8px">Nivaas</div>
        <div style="font-size:14px;color:#666;margin-bottom:32px">Verified rentals across Punjab</div>
        <div style="font-size:15px;margin-bottom:16px">Your one-time login code:</div>
        <div style="font-size:48px;font-weight:700;letter-spacing:0.15em;font-family:monospace;margin-bottom:24px">${code}</div>
        <div style="font-size:13px;color:#999">This code expires in 10 minutes. If you didn't request this, ignore this email.</div>
      </div>
    `,
  });
}
