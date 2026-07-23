/**
 * GMR Luxury Co-Living PG
 * WhatsApp Notification Templates & Deep Link Utilities
 */

/**
 * Clean phone number to digits only, adding India country code (91) if it's a 10-digit number.
 */
export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits;
  }
  // If it's already 12 digits (starting with 91)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Generate deep-link to WhatsApp Web / App
 */
export function getWhatsAppLink(phone: string, text: string): string {
  const cleanedPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Send WhatsApp text immediately by opening in a new tab
 */
export function triggerWhatsAppMessage(phone: string, text: string): void {
  const url = getWhatsAppLink(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 1. Onboarding / Admission slip confirmation template
 */
export function getAdmissionTemplate(data: {
  tenantName: string;
  roomNumber: string;
  checkInDate: string;
  rentAmount: number;
  securityDeposit: number;
  presentPaid: number;
}): string {
  return `*GMR LUXURY CO-LIVING PG - ADMISSION CONFIRMATION* 🏠✨

Dear *${data.tenantName}*,

Welcome to *GMR Luxury Co-Living PG*! Your stay setup and resident registration have been approved successfully. 

Here are your official onboarding parameters:

📌 *STAY PROFILE:*
• Resident Name: *${data.tenantName}*
• Allocated Room: *Room ${data.roomNumber}*
• Joining/Check-in Date: *${data.checkInDate}*

💰 *FINANCIAL SUMMARY:*
• Monthly Rent: *₹${data.rentAmount.toLocaleString('en-IN')}/-*
• Security Advance: *₹${data.securityDeposit.toLocaleString('en-IN')}/-*
• Amount Paid Today: *₹${data.presentPaid.toLocaleString('en-IN')}/-*

⚠️ *21 RULES & CONDUCT CODE AGREED:*
1. Prior written *1-month notice* is mandatory before checkout.
2. Minimum lock-in period is *3 months*.
3. Rent must be paid in advance by the *5th of each month*.
4. Late fee of *₹100 per day* applies after the 5th.
5. PG gate curfew is strictly locked at *11:30 PM*.
6. Possessing/consuming alcohol, drugs, or smoking on premises is strictly banned.
7. Visitors and guests are subject to safety logs and room security protocols.

We are committed to providing you with premium co-living spaces that truly feel like home! 

Regards,
*GMR Co-Living Management*
#7 Akash Nagar Main Road, Mahadevapura, Bengaluru
📞 +91 99515 13796 / +91 70360 19865
📧 nagendranagiii955@gmail.com
🏠 *Feels Like Home*`;
}

/**
 * 2. Payment receipt confirmation template
 */
export function getReceiptTemplate(data: {
  tenantName: string;
  roomNumber: string;
  amount: number;
  billingMonth: string;
  paymentDate: string;
  paymentMode: string;
  referenceId: string;
}): string {
  const monthName = new Date(data.billingMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }) || data.billingMonth;
  return `*GMR LUXURY PG - OFFICIAL PAYMENT RECEIPT* 🧾✅

Dear *${data.tenantName}*,

Thank you! We have successfully received and logged your rent payment.

💳 *TRANSACTION DETAILS:*
• Received Amount: *₹${data.amount.toLocaleString('en-IN')}/-*
• Rent Period: *${monthName}*
• Date Received: *${data.paymentDate}*
• Mode of Payment: *${data.paymentMode}*
• Reference/Txn ID: *${data.referenceId}*
• Allocation: *Room ${data.roomNumber}*

Your monthly ledger accounts are fully clear for this billing cycle. Keep this digital slip for your records.

Regards,
*GMR Co-Living Management*
#7 Akash Nagar Main Road, Mahadevapura, Bengaluru
📞 +91 99515 13796
🏠 *Feels Like Home*`;
}

/**
 * 3. Rent dues reminder template
 */
export function getRentReminderTemplate(data: {
  tenantName: string;
  roomNumber: string;
  rentAmount: number;
  billingMonth: string;
  dueDate: string;
  status: string;
}): string {
  const monthName = new Date(data.billingMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }) || data.billingMonth;
  const isOverdue = data.status.toLowerCase() === 'overdue';
  const alertIcon = isOverdue ? '🚨' : '⚠️';
  const statusLabel = isOverdue ? '*OVERDUE*' : '*PENDING*';

  return `${alertIcon} *GMR LUXURY PG - RENT DUES REMINDER* ⏰

Dear *${data.tenantName}*,

This is an official reminder that your rent for *Room ${data.roomNumber}* is currently ${statusLabel} for the cycle *${monthName}*.

💵 *DUES SUMMARY:*
• Rent Amount: *₹${data.rentAmount.toLocaleString('en-IN')}/-*
• Due Date: *${data.dueDate}*
• Current Status: ${statusLabel}

Please clear the dues via UPI, Net Banking, or cash handover on or before the *5th of the month* to avoid late payment daily charges of ₹100/-.

_If you have already transferred the rent, please ignore this reminder and share your transaction reference ID with the warden to clear your ledger._

Regards,
*GMR Co-Living Management*
#7 Akash Nagar Main Road, Mahadevapura, Bengaluru
📞 +91 99515 13796 / +91 70360 19865
🏠 *Feels Like Home*`;
}
