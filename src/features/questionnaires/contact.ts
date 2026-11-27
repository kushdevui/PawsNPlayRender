// Call / WhatsApp a phone number typed into the Know Your Dog form.
import { Linking } from 'react-native';
import { showAlert } from '@/lib/dialog';

/** Facility is in India: a bare 10-digit mobile number gets the +91 country code for WhatsApp. */
const DEFAULT_COUNTRY_CODE = '91';

const digitsOf = (phone: string) => phone.replace(/[^\d+]/g, '');

export const telUrl = (phone: string) => `tel:${digitsOf(phone)}`;

export const whatsAppUrl = (phone: string) => {
  let d = digitsOf(phone).replace(/^\+/, '');
  if (d.startsWith('0')) d = d.replace(/^0+/, '');
  if (d.length === 10) d = `${DEFAULT_COUNTRY_CODE}${d}`;
  return `https://wa.me/${d}`;
};

export async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch (e) {
    showAlert('Cannot open link', (e as Error).message);
  }
}
