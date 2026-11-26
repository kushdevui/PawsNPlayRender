// Tiny inline-markup parser and search helpers for the FAQ content.
import type { FaqBlock, FaqItem, FaqSection } from './faqData';

export type InlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; href: string };

// **bold** or [label](href)
const TOKEN = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

export function parseInline(source: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let last = 0;
  for (const m of source.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: 'text', text: source.slice(last, start) });
    if (m[1] !== undefined) out.push({ kind: 'bold', text: m[1] });
    else out.push({ kind: 'link', text: m[2], href: m[3] });
    last = start + m[0].length;
  }
  if (last < source.length) out.push({ kind: 'text', text: source.slice(last) });
  return out;
}

const plain = (source: string) => parseInline(source).map((s) => s.text).join('');

const blockText = (b: FaqBlock) => (b.type === 'p' ? plain(b.text) : b.items.map(plain).join(' '));

/** Lower-cased question + answer text, used for search. */
export const searchableText = (item: FaqItem) => `${item.question} ${item.answer.map(blockText).join(' ')}`.toLowerCase();

/** Sections with only the items matching `term` (empty term = everything). Empty sections are dropped. */
export function filterSections(sections: FaqSection[], term: string): FaqSection[] {
  const q = term.trim().toLowerCase();
  if (!q) return sections;
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => searchableText(i).includes(q)) }))
    .filter((s) => s.items.length > 0);
}
