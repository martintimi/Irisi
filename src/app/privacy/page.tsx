import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Privacy & Data Protection Policy | ÌRÍSÍ',
  description:
    'How ÌRÍSÍ protects your personal details, order communications, and PCI-DSS payment security.',
};

const PRIVACY_SECTIONS = [
  {
    num: '01',
    tag: 'Data Minimization',
    title: 'Information We Collect',
    body: 'We collect only the details necessary to fulfill your orders, protect escrow transactions, and operate verified storefronts: your name, email address, phone number (for real-time order and delivery SMS updates), shipping address, and optional size/fit preferences.',
  },
  {
    num: '02',
    tag: 'PCI-DSS Payments',
    title: 'Zero Raw Card Storage',
    body: 'Every checkout payment and subscription is processed through encrypted, PCI-DSS compliant payment rails (Paystack). ÌRÍSÍ never stores, logs, or views your debit/credit card numbers or security CVV codes.',
  },
  {
    num: '03',
    tag: 'Order Fulfillment Only',
    title: 'Strict Partner Sharing Boundaries',
    body: 'We share your delivery name, shipping address, contact phone number, and ordered specifications strictly with the fulfilling brand and assigned logistics courier so your parcel arrives accurately. We never sell shopper data to third-party ad brokers.',
  },
  {
    num: '04',
    tag: 'Your Control',
    title: 'Notifications & Account Deletion',
    body: 'Active orders automatically trigger essential transactional SMS and email updates (confirmation, dispatch waybill, delivery verification, and security codes). You may opt out of brand drop alerts or request complete account deletion at any time.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      activePage="privacy"
      eyebrow="Data Security & Trust"
      title="Privacy Policy"
      subtitle="Your identity, delivery details, and payment information are treated with strict confidentiality across every interaction on ÌRÍSÍ."
      highlights={[
        { label: 'Last Updated', value: 'November 2026' },
        { label: 'Card Security', value: 'PCI-DSS Encrypted' },
        { label: 'Data Selling', value: 'Strictly Zero' },
      ]}
    >
      <div className="space-y-4">
        {PRIVACY_SECTIONS.map((sec) => (
          <article
            key={sec.num}
            className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/35 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:block sm:w-20 shrink-0">
                <span className="font-editorial text-2xl sm:text-3xl text-[var(--gold-accent)] leading-none">
                  {sec.num}
                </span>
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)] sm:block sm:mt-1.5">
                  {sec.tag}
                </span>
              </div>

              <div className="flex-1 space-y-2.5 sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
                <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                  {sec.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  {sec.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </LegalShell>
  );
}
