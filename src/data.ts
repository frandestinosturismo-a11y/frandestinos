import type { TripFacts } from './catalog';
export type { Category, Destination } from './catalog';
export { destinations } from './catalog';

export interface Tour { id: string; destinationId: string; title: string; date: string | null; departure: string | null; price: number | null; startsAt?: string; endsAt?: string; details?: TripFacts; }
export interface Testimonial { name: string; destination: string; text: string; date?: string; illustrative?: boolean; portrait?: string; portraitGenerated?: boolean; }
export const phone = '5521972177007';
export const whatsapp = (message = 'Olá, Fran Turismo! Vim pelo site e quero saber mais sobre os próximos passeios. Pode me ajudar?') => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
