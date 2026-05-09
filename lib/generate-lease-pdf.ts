import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

interface LeaseData {
  listingTitle: string;
  listingLocality: string;
  listingCity: string;
  listingAddress: string | null;
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: Date;
  endDate: Date;
  landlordSignedAt: Date;
  tenantSignedAt: Date;
  leaseId: string;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRent(n: number) {
  return `PKR ${n.toLocaleString('en-PK')}`;
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size?: number; color?: ReturnType<typeof rgb>; lineHeight?: number; maxWidth?: number }
): number {
  const { font, size = 10, color = rgb(0.1, 0.1, 0.1), maxWidth } = opts;

  if (!maxWidth) {
    page.drawText(text, { x, y, size, font, color });
    return y;
  }

  // Word-wrap
  const words = text.split(' ');
  let line = '';
  let curY = y;
  const lh = opts.lineHeight ?? size * 1.6;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= lh;
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    page.drawText(line, { x, y: curY, size, font, color });
    curY -= lh;
  }
  return curY;
}

export async function generateLeasePdf(data: LeaseData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const helveticaBold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvetica       = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const navy  = rgb(0.059, 0.137, 0.251);  // #0F2340
  const teal  = rgb(0.071, 0.651, 0.549);  // #12A68C
  const grey  = rgb(0.45, 0.45, 0.45);
  const black = rgb(0.1, 0.1, 0.1);
  const white = rgb(1, 1, 1);

  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 56;
  const contentWidth = width - margin * 2;

  // ── Header band ──────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: navy });

  page.drawText('RENT KAR GHAR', {
    x: margin, y: height - 36,
    size: 18, font: helveticaBold, color: white,
  });
  page.drawText('rentkarghar.com', {
    x: margin, y: height - 56,
    size: 9, font: helvetica, color: rgb(0.54, 0.67, 0.75),
  });

  // Ref number top-right
  const ref = `REF: RKG-${data.leaseId.slice(-8).toUpperCase()}`;
  const refW = helvetica.widthOfTextAtSize(ref, 9);
  page.drawText(ref, { x: width - margin - refW, y: height - 46, size: 9, font: helvetica, color: rgb(0.54, 0.67, 0.75) });

  // ── Title ─────────────────────────────────────────────────────
  let y = height - 110;
  page.drawText('RESIDENTIAL TENANCY AGREEMENT', { x: margin, y, size: 15, font: helveticaBold, color: navy });
  y -= 6;
  page.drawRectangle({ x: margin, y, width: contentWidth, height: 2, color: teal });
  y -= 20;

  const executedOn = formatDate(data.landlordSignedAt < data.tenantSignedAt ? data.tenantSignedAt : data.tenantSignedAt);
  page.drawText(`This agreement is executed on ${executedOn} between the parties described below.`, {
    x: margin, y, size: 9.5, font: helveticaOblique, color: grey,
  });
  y -= 28;

  // ── Party boxes ───────────────────────────────────────────────
  function partyBox(title: string, name: string, phone: string, bx: number, by: number, bw: number) {
    page.drawRectangle({ x: bx, y: by - 60, width: bw, height: 66, color: rgb(0.96, 0.97, 0.98), borderColor: rgb(0.87, 0.89, 0.91), borderWidth: 1 });
    page.drawRectangle({ x: bx, y: by, width: bw, height: 6, color: teal });
    page.drawText(title, { x: bx + 10, y: by - 16, size: 8, font: helveticaBold, color: teal });
    page.drawText(name || '—', { x: bx + 10, y: by - 30, size: 11, font: helveticaBold, color: navy });
    page.drawText(phone, { x: bx + 10, y: by - 44, size: 9, font: helvetica, color: grey });
  }

  const boxW = (contentWidth - 16) / 2;
  partyBox('LANDLORD', data.landlordName, data.landlordPhone, margin, y, boxW);
  partyBox('TENANT', data.tenantName, data.tenantPhone, margin + boxW + 16, y, boxW);
  y -= 80;

  // ── Property details ─────────────────────────────────────────
  page.drawText('PROPERTY', { x: margin, y, size: 8, font: helveticaBold, color: teal });
  y -= 14;
  const address = data.listingAddress ?? `${data.listingLocality}, ${data.listingCity}`;
  page.drawText(data.listingTitle, { x: margin, y, size: 11, font: helveticaBold, color: navy });
  y -= 14;
  page.drawText(address, { x: margin, y, size: 9.5, font: helvetica, color: grey });
  y -= 28;

  // ── Financial terms ───────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 54, width: contentWidth, height: 60, color: rgb(0.96, 0.97, 0.98), borderColor: rgb(0.87, 0.89, 0.91), borderWidth: 1 });

  function finCell(label: string, value: string, cx: number) {
    page.drawText(label, { x: cx, y: y - 14, size: 8, font: helveticaBold, color: grey });
    page.drawText(value, { x: cx, y: y - 28, size: 12, font: helveticaBold, color: navy });
  }

  const colW = contentWidth / 4;
  finCell('MONTHLY RENT', formatRent(data.monthlyRent), margin + 12);
  finCell('SECURITY DEPOSIT', formatRent(data.securityDeposit), margin + colW + 12);
  finCell('LEASE START', formatDate(data.startDate), margin + colW * 2 + 12);
  finCell('LEASE END', formatDate(data.endDate), margin + colW * 3 + 12);

  // vertical dividers
  for (let i = 1; i < 4; i++) {
    page.drawLine({ start: { x: margin + colW * i, y: y }, end: { x: margin + colW * i, y: y - 54 }, thickness: 1, color: rgb(0.87, 0.89, 0.91) });
  }
  y -= 72;

  // ── Standard clauses ──────────────────────────────────────────
  page.drawText('TERMS & CONDITIONS', { x: margin, y, size: 8, font: helveticaBold, color: teal });
  y -= 6;
  page.drawRectangle({ x: margin, y, width: contentWidth, height: 1, color: rgb(0.87, 0.89, 0.91) });
  y -= 14;

  const clauses = [
    'Rent Payment: Monthly rent of ' + formatRent(data.monthlyRent) + ' is due on or before the 5th of each calendar month. Late payment beyond 10 days shall incur a charge of PKR 500 per day.',
    'Security Deposit: A deposit of ' + formatRent(data.securityDeposit) + ' is held against damage or unpaid dues. This shall be returned within 7 working days of vacating, subject to deductions for damage beyond fair wear and tear.',
    "Property Maintenance: The Tenant shall keep the premises clean and in good repair. Any damage caused by the Tenant shall be repaired at the Tenant's expense before vacating.",
    "Utilities: Gas, electricity, and water bills are the Tenant's sole responsibility for the duration of this tenancy unless otherwise agreed in writing.",
    "Subletting: The Tenant shall not sublet, assign, or share possession of the premises or any part thereof without prior written consent of the Landlord.",
    "Alterations: No structural changes, drilling, painting, or permanent fixtures may be added by the Tenant without written permission from the Landlord.",
    "Access: The Landlord shall give at least 24 hours' notice before entering the premises except in emergencies.",
    "Termination: Either party may terminate this agreement by giving 30 days' written notice. Termination without due notice renders the terminating party liable for one month's rent as compensation.",
    "Governing Law: This agreement shall be governed by the laws of Pakistan and disputes shall be resolved in the courts of jurisdiction nearest to the property.",
  ];

  for (let i = 0; i < clauses.length; i++) {
    const num = `${i + 1}.`;
    page.drawText(num, { x: margin, y, size: 8.5, font: helveticaBold, color: navy });
    y = drawText(page, clauses[i], margin + 16, y, { font: helvetica, size: 8.5, color: black, maxWidth: contentWidth - 16, lineHeight: 13 });
    y -= 6;
    if (y < 160) break; // safety
  }

  // ── Signature section ─────────────────────────────────────────
  y -= 10;
  page.drawRectangle({ x: margin, y: y - 2, width: contentWidth, height: 1, color: rgb(0.87, 0.89, 0.91) });
  y -= 20;
  page.drawText('SIGNATURES', { x: margin, y, size: 8, font: helveticaBold, color: teal });
  y -= 16;

  function sigBox(name: string, role: string, signedAt: Date, sx: number, sw: number) {
    page.drawRectangle({ x: sx, y: y - 52, width: sw, height: 58, color: rgb(0.96, 0.97, 0.98), borderColor: teal, borderWidth: 1 });
    page.drawText(role, { x: sx + 10, y: y - 14, size: 8, font: helveticaBold, color: grey });
    page.drawText(name || '—', { x: sx + 10, y: y - 28, size: 10, font: helveticaBold, color: navy });
    page.drawText('Digitally signed via Rent Kar Ghar', { x: sx + 10, y: y - 40, size: 7.5, font: helveticaOblique, color: grey });
    const ts = signedAt.toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    page.drawText(ts, { x: sx + 10, y: y - 52, size: 7.5, font: helvetica, color: grey });
  }

  sigBox(data.landlordName, 'LANDLORD', data.landlordSignedAt, margin, boxW);
  sigBox(data.tenantName, 'TENANT', data.tenantSignedAt, margin + boxW + 16, boxW);
  y -= 68;

  // ── Footer ────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 32, color: navy });
  page.drawText(
    `Generated by Rent Kar Ghar · rentkarghar.com · Document ID: ${data.leaseId}`,
    { x: margin, y: 11, size: 7.5, font: helvetica, color: rgb(0.54, 0.67, 0.75) }
  );

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
