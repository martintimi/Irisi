// Nigerian Commercial & Digital Banks with Official Paystack NUBAN Bank Codes

export interface NigerianBank {
  name: string;
  code: string;
  slug?: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Access Bank', code: '044' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Kuda Microfinance Bank', code: '50211' },
  { name: 'OPay Digital Services (Paycom)', code: '999992' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank / ALAT', code: '035' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'TAJ Bank', code: '302' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Suntrust Bank', code: '100' },
  { name: 'Unity Bank', code: '215' },
];

export function getBankCodeByName(bankName: string): string {
  if (!bankName) return '058';
  const clean = bankName.toLowerCase().trim();
  const match = NIGERIAN_BANKS.find(
    (b) => b.name.toLowerCase().includes(clean) || clean.includes(b.name.toLowerCase())
  );
  return match ? match.code : '058';
}
