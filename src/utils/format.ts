export const formatPrice = (amount: number, currency = 'INR') =>
  currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${currency} ${amount.toLocaleString()}`;

/** "3 yr" / "8 mo" from 'YYYY-MM-DD' */
export const ageFrom = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return '';
  const months = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months >= 12 ? `${Math.floor(months / 12)} yr` : `${Math.max(0, months)} mo`;
};

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
