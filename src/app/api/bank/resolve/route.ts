import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get('account_number')?.trim() || '';
    const bankCode = searchParams.get('bank_code')?.trim() || '';

    if (!accountNumber || accountNumber.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit NUBAN account number is required' },
        { status: 400 }
      );
    }

    if (!bankCode) {
      return NextResponse.json(
        { error: 'Bank code is required' },
        { status: 400 }
      );
    }

    const paystackSecret =
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.PAYSTACK_SECRET ||
      'sk_test_3a3041fae6fb50431497d4a4a6c8d1edb80d4562';

    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData?.status || !paystackData?.data?.account_name) {
      const errorMsg = paystackData?.message || 'Could not resolve account name. Please check account number and bank.';
      const isDailyTestLimit = errorMsg.toLowerCase().includes('limit') || paystackRes.status === 429;

      return NextResponse.json(
        {
          error: isDailyTestLimit
            ? 'Paystack test key daily limit reached. Type your account name manually, or switch to a live Paystack secret key.'
            : errorMsg,
          success: false,
          isLimit: isDailyTestLimit,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      accountName: paystackData.data?.account_name || '',
      accountNumber: paystackData.data?.account_number || accountNumber,
      bankId: paystackData.data?.bank_id,
    });
  } catch (error: any) {
    console.error('[API Bank Resolve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with banking verification gateway', success: false },
      { status: 500 }
    );
  }
}
