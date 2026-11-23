export const formatPrice = (amount: number, currency = 'INR') =>
  currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${currency} ${amount.toLocaleString()}`;

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const formatDuration = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`;

export const ageFrom = (dateOfBirth: string) => {
  if (!dateOfBirth) return '';
  const months = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months >= 12 ? `${Math.floor(months / 12)} yr` : `${months} mo`;
};
