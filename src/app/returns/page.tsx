import Link from 'next/link';
import { ShieldCheck, Clock, Camera, CheckCircle2, XCircle, Truck } from 'lucide-react';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Escrow Buyer Protection & Return Policy | ÌRÍSÍ',
  description:
    'How ÌRÍSÍ Escrow Protection, 48-hour delivery inspection, Made-to-Order proof, returns, and dispute resolution protect shoppers and verified designers.',
};

const ESCROW_STEPS = [
  {
    step: '01',
    title: 'Escrow Vault Locked',
    desc: 'Your payment is held safely in our Escrow Vault at checkout. Brands never receive funds before delivery.',
    icon: ShieldCheck,
  },
  {
    step: '02',
    title: 'Pre-Dispatch Proof',
    desc: 'For handcrafted footwear and tailored native pieces, brands upload a photo or clip of your finished item before shipping.',
    icon: Camera,
  },
  {
    step: '03',
    title: '48-Hour Inspection',
    desc: 'Once delivered, inspect your order for 48 hours. Tap Approve to release payment or Report Issue to freeze escrow immediately.',
    icon: Clock,
  },
];

export default function ReturnsPolicyPage() {
  return (
    <LegalShell
      activePage="returns"
      eyebrow="100% Escrow Protected"
      title="Escrow Protection, Returns & Dispute Policy"
      subtitle="Every transaction on ÌRÍSÍ is safeguarded from checkout to delivery. Neither shoppers nor honest independent brands are left exposed."
      highlights={[
        { label: 'Inspection Window', value: '48 Hours Post-Delivery' },
        { label: 'Dispute Resolution', value: '24–48 Business Hours' },
        { label: 'Made-to-Order Safeguard', value: 'Pre-Dispatch Photo Proof' },
      ]}
    >
      {/* Visual 3-Step Escrow Protection Timeline */}
      <section className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
              How Escrow Works
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--text-primary)] mt-1">
              Three Layers of Buyer &amp; Brand Security
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ESCROW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-[var(--bg-secondary)]/70 border border-[var(--border-subtle)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-luxury text-[var(--gold-accent)] tracking-widest">
                    {item.step}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/25 flex items-center justify-center text-[var(--gold-accent)]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Side-by-Side Eligibility Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Eligible for Full Refund */}
        <article className="p-6 sm:p-7 rounded-3xl surface-card border border-emerald-500/25 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-emerald-500 block">
                01 · Free Return &amp; Full Refund
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl font-normal text-[var(--text-primary)]">
                Eligible Dispute Grounds
              </h2>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Wrong item, wrong size, or wrong colorway shipped compared to your confirmed order.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Garment, footwear, or accessory arrives torn, stained, damaged, or defective.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Piece is materially different in fabric, finish, or construction from listing visuals.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Non-dispatch past declared SLA (48h Ready-to-Ship, or stated lead time + 24h grace for Made-to-Order).</span>
            </li>
          </ul>
        </article>

        {/* Non-Returnable Exceptions */}
        <article className="p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-amber-500 block">
                02 · Hygiene &amp; Custom Craft
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl font-normal text-[var(--text-primary)]">
                Non-Returnable Unless Defective
              </h2>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Unsealed perfumes, fragrances, or beauty oils (for hygiene &amp; authenticity protection).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Wigs or hairpieces whose lace has been cut, styled, washed, or worn.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Intimates, underwear, and swimwear with removed hygiene seals.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Custom-measured pieces that accurately match the exact specifications submitted at checkout.</span>
            </li>
          </ul>
        </article>
      </section>

      {/* Numbered Clauses */}
      <article className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
              03 · Evidence Standard
            </span>
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              Filing a Fair Claim
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Submit your report on the{' '}
              <Link href="/track-order" className="text-[var(--gold-accent)] underline">
                Track Order
              </Link>{' '}
              page within 48 hours of delivery with clear photos (or a short unboxing clip). Returned garments must remain unworn, unwashed, with original tags and packaging intact.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[var(--gold-accent)]">
              <Truck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.2em]">
                04 · Return Logistics
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              Shipping Cost Responsibility
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              <strong className="font-medium text-[var(--text-primary)]">Vendor Fault / Defect:</strong> Return shipping is 100% free for the shopper, with a full escrow refund or replacement.
              <br />
              <strong className="font-medium text-[var(--text-primary)]">Size Exchange:</strong> Where a brand permits size swaps, the shopper covers return and redelivery courier costs.
            </p>
          </div>
        </div>
      </article>
    </LegalShell>
  );
}
