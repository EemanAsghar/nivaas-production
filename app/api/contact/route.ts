import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Rent Kar Ghar <info@rentkarghar.com>',
        to: 'info@rentkarghar.com',
        replyTo: email,
        subject: `Contact form: ${subject || 'General enquiry'} — from ${name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px">New contact form submission</div>
            <div style="font-size:13px;color:#888;margin-bottom:28px">rentkarghar.com</div>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#666;width:100px">Name</td><td style="padding:8px 0;font-weight:500">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#12A68C">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666">Topic</td><td style="padding:8px 0">${subject || '—'}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;background:#f6f7f8;border-radius:10px;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</div>
            <div style="margin-top:24px;font-size:12px;color:#aaa">Reply directly to this email to respond to ${name}.</div>
          </div>
        `,
      });
    } catch (err) {
      console.error('[Contact Resend]', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
