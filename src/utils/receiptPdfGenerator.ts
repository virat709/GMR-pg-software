import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentLog } from '../types';

export interface SingleReceiptPdfData {
  payment: PaymentLog;
  tenantName: string;
  tenantPhone?: string;
  roomNumber: string;
  propertyName?: string;
  propertyAddress?: string;
}

export function generateReceiptPDF({
  payment,
  tenantName,
  tenantPhone,
  roomNumber,
  propertyName,
  propertyAddress
}: SingleReceiptPdfData): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // Compact elegant A5 receipt format
  });

  const now = new Date();
  const receiptNo = `GMR-RCPT-${payment.referenceId.replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;
  const branchHeader = propertyName || 'GMR LUXURY CO-LIVING PG';
  const branchAddr = propertyAddress || '#7 Akash Nagar Main Road, Mahadevapura, Bengaluru';

  // 1. TOP HEADER BANNER
  doc.setFillColor(24, 24, 27); // Dark Neutral 900
  doc.rect(0, 0, 148, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(branchHeader.toUpperCase(), 10, 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(branchAddr.substring(0, 58), 10, 17);
  doc.text('Ph: +91 99515 13796 / +91 70360 19865  |  Feels Like Home', 10, 22);

  // Status Badge on Right Top
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.roundedRect(102, 6, 38, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT STATUS:', 105, 11);
  doc.setFontSize(8);
  doc.text('PAID & VERIFIED', 105, 16);

  // 2. RECEIPT META BANNER
  doc.setFillColor(245, 247, 250);
  doc.rect(10, 32, 128, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`RECEIPT NO: ${receiptNo}`, 13, 38.5);
  doc.text(`DATE: ${payment.paymentDate}`, 95, 38.5);

  // 3. RESIDENT & PROPERTY INFO BOX
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 45, 128, 22, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RESIDENT DETAILS', 14, 51);
  doc.text('ROOM / BRANCH', 80, 51);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(tenantName, 14, 57);
  doc.text(`Room ${roomNumber}`, 80, 57);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: ${tenantPhone || 'On File'}`, 14, 62);
  doc.text(`Branch: ${branchHeader}`, 80, 62);

  // 4. TRANSACTION BREAKDOWN TABLE
  autoTable(doc, {
    startY: 71,
    head: [['Particulars / Description', 'Billing Month', 'Payment Mode', 'Amount']],
    body: [
      [
        `Room Rent (${payment.billingMonth})\nIncludes standard maintenance & Wi-Fi`,
        payment.billingMonth,
        payment.paymentMode,
        `Rs. ${payment.amount.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 23, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 10, right: 10 }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 5 : 100;

  // 5. TOTAL & TRANSACTION ID CARD
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(10, finalY, 128, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL AMOUNT RECEIVED', 14, finalY + 7);
  doc.text(`Ref ID: ${payment.referenceId}`, 14, finalY + 13);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${payment.amount.toLocaleString('en-IN')}/-`, 82, finalY + 12);

  // 6. SIGNATURE & STAMP FOOTER
  const footerY = finalY + 24;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Resident Signature', 14, footerY + 12);
  doc.line(14, footerY + 8, 45, footerY + 8);

  doc.text('Authorized Seal & Signature', 90, footerY + 12);
  doc.text('For GMR Co-Living Spaces', 90, footerY + 3);
  doc.line(90, footerY + 8, 135, footerY + 8);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('★ Thank you for staying with us! Computer-generated payment receipt. ★', 18, footerY + 20);

  // Save PDF
  const filename = `GMR_Receipt_${tenantName.replace(/\s+/g, '_')}_${payment.billingMonth}.pdf`;
  doc.save(filename);
  return filename;
}
