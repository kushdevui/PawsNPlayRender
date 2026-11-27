// Where each consent checkbox goes on the waiver page. The server sends the text (parts + blocks) and the consent
// list separately, so the app places each tick right after the text it confirms:
//   confirm1..N      -> one tickable row per item of the numbered list in `what-you-confirm`, item i = confirm{i+1}
//   acceptRisks      -> end of `risks-you-accept`
//   vetAuthorisation -> right after the vet statement in `if-your-dog-needs-a-vet`
//   acceptOtherTerms -> end of `other-things-you-agree-to` (after the rate card)
//   photosOptOut, finalAgreement and anything not placed -> the signature card (finalAgreement last)
// Parts are found by id (server: how-we-work ... commitment-and-signature), falling back to the title, so a
// reworded waiver still shows every consent (worst case in the sign card).
import type { WaiverConsentDef, WaiverContent, WaiverPart } from '@/api/types';

export interface WaiverLayout {
  /** `${part}:${block}` of a numbered block -> consent key per item (null = plain item). */
  numbered: Record<string, (string | null)[]>;
  /** `${part}:${block}:${item}` of a bullet item -> consent keys shown under it. */
  afterItem: Record<string, string[]>;
  /** `${part}:${block}` -> consent keys shown right after that block. */
  afterBlock: Record<string, string[]>;
  /** part index -> consent keys at the end of the part. */
  afterPart: Record<string, string[]>;
  /** Consents shown in the signature card (finalAgreement last). */
  signCard: string[];
  /** Every consent key in page order (validation reports the first error on the page). */
  order: string[];
}

const FINAL = 'finalAgreement';
const CONFIRM = /^confirm(\d+)$/;

const findPart = (parts: WaiverPart[], id: string, title: RegExp) => {
  const byId = parts.findIndex((p) => p.id === id);
  return byId >= 0 ? byId : parts.findIndex((p) => title.test(p.title));
};

export function buildWaiverLayout(content: WaiverContent, consents: WaiverConsentDef[]): WaiverLayout {
  const keys = new Set(consents.map((c) => c.key));
  const placed = new Set<string>();
  const layout: WaiverLayout = { numbered: {}, afterItem: {}, afterBlock: {}, afterPart: {}, signCard: [], order: [] };
  const push = (map: Record<string, string[]>, at: string | number, key: string) => {
    if (!keys.has(key) || placed.has(key)) return;
    (map[at] = map[at] ?? []).push(key);
    placed.add(key);
  };
  const { parts } = content;

  // confirm1..N on the numbered list (prefer the one in a "confirm" part).
  const confirmKeys = [...keys].filter((k) => CONFIRM.test(k));
  if (confirmKeys.length) {
    const preferred = findPart(parts, 'what-you-confirm', /confirm/i);
    const order = preferred >= 0 ? [preferred, ...parts.map((_, i) => i).filter((i) => i !== preferred)] : parts.map((_, i) => i);
    for (const pi of order) {
      const bi = parts[pi].blocks.findIndex((b) => b.type === 'numbered');
      if (bi < 0) continue;
      const block = parts[pi].blocks[bi];
      if (block.type !== 'numbered') continue;
      layout.numbered[`${pi}:${bi}`] = block.items.map((_, i) => {
        const key = `confirm${i + 1}`;
        if (!keys.has(key)) return null;
        placed.add(key);
        return key;
      });
      break;
    }
  }

  // Vet authorisation: after the statement in the vet part (or at the end of that part).
  const vet = findPart(parts, 'if-your-dog-needs-a-vet', /\bvet\b/i);
  if (vet >= 0) {
    const bi = parts[vet].blocks.findIndex((b) => b.type === 'statement');
    if (bi >= 0) push(layout.afterBlock, `${vet}:${bi}`, 'vetAuthorisation');
    else push(layout.afterPart, vet, 'vetAuthorisation');
  }

  const risks = findPart(parts, 'risks-you-accept', /risk/i);
  if (risks >= 0) push(layout.afterPart, risks, 'acceptRisks');

  const other = findPart(parts, 'other-things-you-agree-to', /other things|you agree/i);
  if (other >= 0) push(layout.afterPart, other, 'acceptOtherTerms');

  // Page order of what was placed.
  parts.forEach((part, pi) => {
    part.blocks.forEach((block, bi) => {
      for (const k of layout.numbered[`${pi}:${bi}`] ?? []) if (k) layout.order.push(k);
      if (block.type === 'bullets') block.items.forEach((_, ii) => layout.order.push(...(layout.afterItem[`${pi}:${bi}:${ii}`] ?? [])));
      layout.order.push(...(layout.afterBlock[`${pi}:${bi}`] ?? []));
    });
    layout.order.push(...(layout.afterPart[pi] ?? []));
  });

  // Everything else goes to the signature card, finalAgreement last.
  layout.signCard = consents.map((c) => c.key).filter((k) => !placed.has(k) && k !== FINAL);
  if (keys.has(FINAL)) layout.signCard.push(FINAL);
  return layout;
}
