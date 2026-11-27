import type { Booking, PaymentMethod, PaymentStatus, PaymentType } from '@/api/types';
import type { BadgeTone, IconName } from '@/components/common';
import { formatPrice } from '@/utils/format';

export const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
];
export const paymentMethodLabel: Record<PaymentMethod, string> = { upi: 'UPI', cash: 'Cash', card: 'Card', bank: 'Bank transfer' };
export const paymentMethodIcon: Record<PaymentMethod, IconName> = { upi: 'qrcode', cash: 'cash', card: 'credit-card-outline', bank: 'bank-outline' };

export const paymentTypeLabel: Record<PaymentType, string> = { advance: 'Advance', payment: 'Payment', refund: 'Refund' };

export const paymentStatusTone: Record<PaymentStatus, BadgeTone> = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
  overpaid: 'info',
};

/** Short badge text for lists: "Paid", "₹3,000 due", "Refund ₹600", "No payment". */
export const paymentBadgeLabel = (b: Pick<Booking, 'paymentStatus' | 'balanceDue' | 'amountPaid' | 'currency' | 'status'>) => {
  if (b.status === 'cancelled') return b.amountPaid > 0 ? `${formatPrice(b.amountPaid, b.currency)} to refund` : 'No charge';
  switch (b.paymentStatus) {
    case 'paid':
      return 'Paid';
    case 'overpaid':
      return `Refund ${formatPrice(-b.balanceDue, b.currency)}`;
    case 'partial':
      return `${formatPrice(b.balanceDue, b.currency)} due`;
    default:
      return 'Unpaid';
  }
};
