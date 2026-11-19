import Link from 'next/link';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Terms of Service & Merchant Charter | ÌRÍSÍ',
  description:
    'Marketplace Terms of Service, Escrow rules, and Independent Brand Charter on ÌRÍSÍ.',
};

const CLAUSES = [
  {
    num: '01',
    tag: 'Marketplace Role',
    title: 'Curated Multi-Brand Fashion Platform',
    body: 'ÌRÍSÍ connects discerning shoppers with verified independent clothing brands, native wear designers, footwear artisans, wig studios, jewelry labels, and fragrance houses. Every purchase is routed through our protected Escrow Vault until delivery verification is complete.',
  },
  {
    num: '02',
    tag: 'Shopper Orders & Escrow',
    title: 'Protected Checkout & 48-Hour Inspection',
    body: 'Funds paid at checkout remain locked in escrow while your order is prepared and shipped. Ready-to-Ship orders dispatch within 1–2 business days; Made-to-Order pieces dispatch within the production lead time shown on the listing. After delivery, shoppers have 48 hours to inspect and approve release or file a dispute under our Return & Escrow Policy.',
    link: { label: 'Read Return & Escrow Policy', href: '/returns' },
  },
  {
    num: '03',
    tag: 'Merchant Authenticity',
    title: 'Zero Bait-and-Switch & Pre-Dispatch Standards',
    body: 'Verified brands must list only genuine, accurately photographed items they own, stock, or craft. Shipping counterfeit goods, materially inferior pieces, misrepresenting ready-to-ship availability, or soliciting shoppers to pay off-platform outside Escrow leads to immediate storefront suspension and buyer refund.',
  },
  {
    num: '04',
    tag: 'Commission & ÌRÍSÍ Plus',
    title: 'Transparent Fees & Membership Tiers',
    body: 'Platform commissions apply strictly to completed, escrow-released sales — never to cancelled or refunded orders. During promotional launch periods, founding brands enjoy 0% commission. Optional ÌRÍSÍ Plus memberships unlock lower sales commission, unlimited catalog listings, a clean white-label storefront link, and live 48-hour Lookbook Stories.',
  },
  {
    num: '05',
    tag: 'Logistics & Waybills',
    title: 'Tracked Doorstep & Hub Delivery',
    body: 'Orders ship via partner doorstep couriers or designated pickup hubs selected at checkout. Brands must provide accurate waybill numbers, courier details, and (for Made-to-Order pieces) finished-item pre-dispatch photo proof inside the Vendor Portal prior to handoff.',
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      activePage="terms"
      eyebrow="Marketplace & Merchant Charter"
      title="Terms of Service"
      subtitle="Clear, fair standards governing every shopper order, escrow settlement, and verified independent brand storefront on ÌRÍSÍ."
      highlights={[
        { label: 'Effective Date', value: 'November 2026' },
        { label: 'Payment Custody', value: '100% Escrow Vault' },
        { label: 'Commission Rule', value: 'Completed Sales Only' },
      ]}
    >
      <div className="space-y-4">
        {CLAUSES.map((clause) => (
          <article
            key={clause.num}
            className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/35 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:block sm:w-20 shrink-0">
                <span className="font-editorial text-2xl sm:text-3xl text-[var(--gold-accent)] leading-none">
                  {clause.num}
                </span>
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)] sm:block sm:mt-1.5">
                  {clause.tag}
                </span>
              </div>

              <div className="flex-1 space-y-2.5 sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
                <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                  {clause.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {clause.body}
                </p>
                {clause.link && (
                  <div className="pt-1">
                    <Link
                      href={clause.link.href}
                      className="inline-flex items-center text-xs font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] hover:underline"
                    >
                      {clause.link.label} →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </LegalShell>
  );
}
