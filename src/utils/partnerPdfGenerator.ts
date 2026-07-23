import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, Tenant, PaymentLog, BillingAlert } from '../types';

export interface PartnerStatementData {
  properties: Property[];
  tenants: Tenant[];
  payments: PaymentLog[];
  billingAlerts: BillingAlert[];
  selectedPropertyId: string;
}

export function generate30DayPartnerPDF({
  properties,
  tenants,
  payments,
  billingAlerts,
  selectedPropertyId
}: PartnerStatementData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Filter tenants by property if selected
  const targetTenants = selectedPropertyId === 'all'
    ? tenants
    : tenants.filter(t => t.propertyId === selectedPropertyId);
  
  const targetTenantIds = new Set(targetTenants.map(t => t.id));
  const activeTenants = targetTenants.filter(t => t.status === 'Active');

  // Filter payments in the last 30 days
  const last30DaysPayments = payments.filter(p => {
    if (!targetTenantIds.has(p.tenantId)) return false;
    const pDate = new Date(p.paymentDate);
    return pDate >= thirtyDaysAgo && pDate <= now;
  }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Pending dues / alerts
  const targetAlerts = billingAlerts.filter(b => targetTenantIds.has(b.tenantId) && (b.status === 'Pending' || b.status === 'Overdue'));

  // Amounts
  const totalCollectedAmount = last30DaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDuesAmount = targetAlerts.reduce((sum, b) => sum + b.rentAmount, 0);

  const propertyNameLabel = selectedPropertyId === 'all'
    ? 'All Properties (Global Portfolio)'
    : (properties.find(p => p.id === selectedPropertyId)?.name || 'Property Branch');

  // 1. HEADER SECTION
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GMR PG MANAGEMENT PORTAL', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('30-DAY PARTNER FINANCIAL STATEMENT (PAID & DUES REPORT)', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 14, 29);

  // Property Branch Badge on top right
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(125, 10, 71, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BRANCH / SCOPE:', 129, 16);
  doc.setFontSize(8);
  doc.text(propertyNameLabel.substring(0, 32), 129, 22);

  // 2. PERIOD BANNER
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 42, 182, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  const startDateStr = thirtyDaysAgo.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const endDateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Statement Period: ${startDateStr} to ${endDateStr} (Last 30 Days)`, 18, 48.5);

  // 3. EXECUTIVE SUMMARY CARDS (COLLECTED & DUES)
  const cardY = 56;
  const cardW = 88;
  const cardH = 22;

  // Card 1: Total Rent Collected
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL RENT COLLECTED (LAST 30 DAYS)', 18, cardY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(`Rs. ${totalCollectedAmount.toLocaleString('en-IN')}`, 18, cardY + 16);

  // Card 2: Total Pending Dues
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(108, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL PENDING DUES (UNPAID)', 112, cardY + 7);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`Rs. ${totalDuesAmount.toLocaleString('en-IN')}`, 112, cardY + 16);

  // 4. SECONDARY METRICS BAR
  const barY = cardY + cardH + 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, barY, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Active Residents: ${activeTenants.length}    |    30-Day Paid Payments: ${last30DaysPayments.length}    |    Due Accounts: ${targetAlerts.length}`, 18, barY + 5.5);

  // 5. PAID DETAILS TABLE (30 DAYS)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Paid Transactions Details (Last 30 Days)', 14, barY + 17);

  const paymentTableRows = last30DaysPayments.map(pay => {
    const tenant = tenants.find(t => t.id === pay.tenantId);
    const tenantName = tenant ? tenant.name : 'Resident';
    const roomNo = tenant ? `Room ${tenant.roomNumber}` : 'N/A';
    const prop = properties.find(p => p.id === tenant?.propertyId);
    const propCode = prop ? prop.code : 'GMR';

    return [
      pay.paymentDate,
      tenantName,
      roomNo,
      propCode,
      pay.billingMonth,
      pay.paymentMode,
      `Rs. ${pay.amount.toLocaleString('en-IN')}`,
      pay.referenceId || 'REC-CONFIRMED'
    ];
  });

  autoTable(doc, {
    startY: barY + 20,
    head: [['Date', 'Resident Name', 'Room', 'Branch', 'Billing Month', 'Mode', 'Amount Paid', 'Ref / Receipt']],
    body: paymentTableRows.length > 0 ? paymentTableRows : [['-', 'No payment logs recorded in the last 30 days', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
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
      0: { cellWidth: 22 },
      1: { cellWidth: 38 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // 6. PENDING DUES / UNPAID PEOPLE LIST (ADDED AT THE VERY LAST)
  const paidTableFinalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : barY + 70;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Pending Dues & Unpaid Residents List (Due People)', 14, paidTableFinalY);

  const duesTableRows = targetAlerts.map(alert => {
    const tenant = tenants.find(t => t.id === alert.tenantId);
    const tenantName = tenant ? tenant.name : alert.tenantName || 'Resident';
    const roomNo = tenant ? `Room ${tenant.roomNumber}` : alert.roomNumber ? `Room ${alert.roomNumber}` : 'N/A';
    const prop = properties.find(p => p.id === tenant?.propertyId);
    const propName = prop ? prop.name : 'GMR Branch';

    return [
      tenantName,
      roomNo,
      propName,
      alert.billingMonth || 'Current',
      alert.dueDate,
      alert.status,
      `Rs. ${alert.rentAmount.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: paidTableFinalY + 3,
    head: [['Resident Name', 'Room', 'Branch', 'Billing Month', 'Due Date', 'Status', 'Pending Amount']],
    body: duesTableRows.length > 0 ? duesTableRows : [['No pending dues found! All resident accounts are clear.', '-', '-', '-', '-', 'CLEAR', 'Rs. 0']],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // 7. PARTNER CONFIRMATION FOOTER
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 282, 210, 15, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Official Confidential Partner Statement • GMR PG Management Systems', 14, 288);
    doc.text(`Page ${i} of ${pageCount}`, 180, 288);
  }

  // Save PDF
  const filename = `GMR_PG_30Day_Partner_Statement_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
