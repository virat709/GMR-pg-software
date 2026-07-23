import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BillingAlert } from '../types';

export interface RentReminderPdfData {
  alert: BillingAlert;
  tenantPhone?: string;
  propertyName?: string;
  propertyAddress?: string;
}

export function generateRentReminderPDF({
  alert,
  tenantPhone,
  propertyName,
  propertyAddress
}: RentReminderPdfData): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // Elegant A5 Notice Format
  });

  const now = new Date();
  const noticeNo = `GMR-DUES-${Math.floor(100000 + Math.random() * 900000)}`;
  const branchHeader = propertyName || 'GMR LUXURY CO-LIVING PG';
  const branchAddr = propertyAddress || '#7 Akash Nagar Main Road, Mahadevapura, Bengaluru / Madhapur, Hyderabad';
  const isOverdue = alert.status.toLowerCase() === 'overdue';

  // 1. TOP HEADER BANNER (RED FOR OVERDUE, AMBER FOR PENDING)
  if (isOverdue) {
    doc.setFillColor(185, 28, 28); // Dark Red
  } else {
    doc.setFillColor(217, 119, 6); // Amber/Orange
  }
  doc.rect(0, 0, 148, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(branchHeader.toUpperCase(), 10, 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 242, 242);
  doc.text(branchAddr.substring(0, 58), 10, 17);
  doc.text('Ph: +91 99515 13796 / +91 70360 19865  |  Official Dues Statement', 10, 22);

  // Status Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(102, 6, 38, 14, 2, 2, 'F');
  doc.setTextColor(isOverdue ? 185 : 217, isOverdue ? 28 : 119, isOverdue ? 28 : 6);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT STATUS:', 105, 11);
  doc.setFontSize(8);
  doc.text(isOverdue ? 'OVERDUE DUES' : 'PAYMENT PENDING', 105, 16);

  // 2. NOTICE META BANNER
  doc.setFillColor(245, 247, 250);
  doc.rect(10, 32, 128, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`NOTICE NO: ${noticeNo}`, 13, 38.5);
  doc.text(`ISSUED: ${now.toLocaleDateString('en-IN')}`, 95, 38.5);

  // 3. RESIDENT & ROOM BOX
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 45, 128, 22, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RESIDENT NAME', 14, 51);
  doc.text('ALLOCATED ROOM', 80, 51);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(alert.tenantName, 14, 57);
  doc.text(`Room ${alert.roomNumber}`, 80, 57);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Phone: ${tenantPhone || 'On Record'}`, 14, 62);
  doc.text(`Branch: ${branchHeader}`, 80, 62);

  // 4. DUES TABLE
  autoTable(doc, {
    startY: 71,
    head: [['Description', 'Billing Period', 'Due Date', 'Status', 'Pending Amount']],
    body: [
      [
        `Monthly Room Rent & Maintenance\n(${alert.billingMonth || 'Current Billing Cycle'})`,
        alert.billingMonth || 'Current',
        alert.dueDate,
        alert.status.toUpperCase(),
        `Rs. ${alert.rentAmount.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: isOverdue ? [185, 28, 28] : [217, 119, 6],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' }
    },
    margin: { left: 10, right: 10 }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 5 : 100;

  // 5. TOTAL PAYABLE HIGHLIGHT CARD
  doc.setFillColor(isOverdue ? 254 : 254, isOverdue ? 242 : 243, isOverdue ? 242 : 199);
  doc.setDrawColor(isOverdue ? 254 : 252, isOverdue ? 202 : 211, isOverdue ? 202 : 77);
  doc.roundedRect(10, finalY, 128, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isOverdue ? 153 : 146, isOverdue ? 27 : 64, isOverdue ? 27 : 14);
  doc.text('TOTAL AMOUNT PAYABLE', 14, finalY + 7);
  doc.text(`Due Date: ${alert.dueDate} (Pay before 11:59 PM)`, 14, finalY + 13);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${alert.rentAmount.toLocaleString('en-IN')}/-`, 82, finalY + 12);

  // 6. PAYMENT INSTRUCTIONS
  const footerY = finalY + 24;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PAYMENT METHODS ACCEPTED:', 10, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('• UPI / PhonePe / Google Pay / PayTM', 10, footerY + 5);
  doc.text('• Cash / Direct Bank Transfer to GMR PG Account', 10, footerY + 9);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Note: If rent is already paid, please ignore this notice & share reference ID.', 10, footerY + 16);
  doc.text('Issued by GMR Co-Living Spaces Management System.', 10, footerY + 20);

  // Save PDF
  const safeName = alert.tenantName.replace(/\s+/g, '_');
  const filename = `GMR_Rent_Dues_Notice_${safeName}.pdf`;
  doc.save(filename);
  return filename;
}
