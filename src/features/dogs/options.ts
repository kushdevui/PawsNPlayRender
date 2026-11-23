import type { Gender, Temperament } from '@/api/types';
import type { BadgeTone } from '@/components/common';

export const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const temperamentOptions: Array<{ value: Temperament; label: string }> = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'shy', label: 'Shy' },
  { value: 'reactive', label: 'Reactive' },
];

export const temperamentLabel: Record<Temperament, string> = { friendly: 'Friendly', shy: 'Shy', reactive: 'Reactive' };
export const temperamentTone: Record<Temperament, BadgeTone> = { friendly: 'brand', shy: 'info', reactive: 'warning' };
