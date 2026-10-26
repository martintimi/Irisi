import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: notifications, error } = await adminClient
      .from('notifications')
      .select('*')
      .in('type', ['waitlist_subscriber', 'vendor_application', 'merch_waitlist'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vendors: any[] = [];
    const merch: any[] = [];
    const waitlist: any[] = [];

    const merchSizes: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    const merchColors: Record<string, number> = { 'Onyx Black': 0, 'Bone White': 0 };

    (notifications || []).forEach((row) => {
      let parsedMessage: any = {};
      try {
        parsedMessage = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {});
      } catch {
        parsedMessage = { raw: row.message };
      }

      const item = {
        id: row.id,
        createdAt: row.created_at,
        read: !!row.read,
        title: row.title,
        ...parsedMessage,
      };

      if (row.type === 'vendor_application') {
        vendors.push(item);
      } else if (row.type === 'merch_waitlist') {
        merch.push(item);
        const sz = (item.size || 'L').toUpperCase();
        merchSizes[sz] = (merchSizes[sz] || 0) + 1;

        const col = item.colorway?.toLowerCase().includes('white') ? 'Bone White' : 'Onyx Black';
        merchColors[col] = (merchColors[col] || 0) + 1;
      } else if (row.type === 'waitlist_subscriber') {
        waitlist.push(item);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        merch,
        waitlist,
        metrics: {
          totalVendors: vendors.length,
          pendingVendors: vendors.filter((v) => !v.read).length,
          totalMerch: merch.length,
          merchSizes,
          merchColors,
          totalWaitlist: waitlist.length,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch pre-launch data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { action, id, email, brandName, specialty } = body;

    if (action === 'invite_vendor') {
      if (!email) {
        return NextResponse.json({ error: 'Vendor email required' }, { status: 400 });
      }

      const portalUrl = `${getBaseUrl()}/vendor-portal/auth?mode=register&specialty=${encodeURIComponent(specialty || 'streetwear')}`;
      const emailHtml = `
        <div style="background-color: #08090a; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3);">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.3em; text-transform: uppercase; color: #ffffff;">Ì R Í S Í</h1>
            <p style="margin: 6px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #e6c367; text-transform: uppercase;">Founding Designer Invitation · Drop 001</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(230,195,103,0.2); border-radius: 12px; padding: 28px; margin-bottom: 24px;">
            <span style="background: #e6c367; color: #08090a; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; padding: 4px 14px; border-radius: 999px; text-transform: uppercase;">Application Accepted</span>
            <h2 style="color: #ffffff; font-size: 22px; margin: 16px 0 10px;">Welcome to the Runway, ${brandName || 'Designer'}</h2>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.7; margin: 0 0 20px;">
              The ÌRÍSÍ Curation Board has reviewed your brand application and selected you as a <strong>Founding Fashion House</strong> for Launch Drop 001.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #e6c367; color: #08090a; font-weight: 800; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 28px; border-radius: 10px; text-decoration: none; display: inline-block;">
                Complete Vendor Onboarding →
              </a>
            </div>
            <p style="color: #71717a; font-size: 11px; margin: 0; text-align: center;">
              Direct Link: <a href="${portalUrl}" style="color: #e6c367;">${portalUrl}</a>
            </p>
          </div>
          <p style="text-align: center; font-size: 11px; color: #71717a; margin: 0;">Lagos · Abuja · London · Worldwide</p>
        </div>
      `;

      const emailRes = await sendLuxuryEmail(email, `✨ Ì R Í S Í · Founding Brand Invitation (${brandName || 'Designer'})`, emailHtml, {
        fromName: 'ÌRÍSÍ Brand Curation',
      });

      // Mark notification as read (invited)
      if (id) {
        await adminClient.from('notifications').update({ read: true }).eq('id', id);
      }

      return NextResponse.json({
        success: true,
        message: `Invitation dispatched to ${email}`,
        portalUrl,
        provider: emailRes.provider,
        emailDelivered: emailRes.success,
      });
    }

    if (action === 'mark_read') {
      if (id) {
        await adminClient.from('notifications').update({ read: true }).eq('id', id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed.' }, { status: 500 });
  }
}
