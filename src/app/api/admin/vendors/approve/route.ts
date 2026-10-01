import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendVendorAccountApprovedNotification,
  sendVendorAccountRejectedNotification,
} from '@/lib/services/vendorNotificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId, action, rejectionReason = '' } = body;

    if (!vendorId || !action) {
      return NextResponse.json({ error: 'vendorId and action are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch current vendor
    const { data: vendor, error: fetchErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (fetchErr || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // 2. Parse existing bio / json
    let currentBio = vendor.bio || '';
    let bioObj: any = { bio: currentBio, socialLinks: {}, isProfileSaved: true };

    if (currentBio.startsWith('{') && currentBio.endsWith('}')) {
      try {
        bioObj = JSON.parse(currentBio);
      } catch (e) {}
    }

    const isApprove = action === 'approve';
    bioObj.approvalStatus = isApprove ? 'approved' : 'rejected';
    bioObj.rejectionReason = isApprove ? '' : (rejectionReason || 'Store information needs revision.');
    bioObj.isProfileSaved = isApprove;

    const updatedBioStr = JSON.stringify(bioObj);

    // 3. Update in PostgreSQL
    const { data: updatedVendor, error: updateErr } = await supabase
      .from('vendors')
      .update({
        is_verified: isApprove,
        bio: updatedBioStr
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Send Official Email Notification to Vendor
    const recipientEmail = updatedVendor?.email;
    if (recipientEmail && recipientEmail.includes('@')) {
      const vendorContact = {
        id: updatedVendor.id,
        brandName: updatedVendor.brand_name || 'Brand Partner',
        designerName: updatedVendor.designer_name || updatedVendor.contact_person,
        email: recipientEmail,
        phone: updatedVendor.phone,
      };

      if (isApprove) {
        await sendVendorAccountApprovedNotification({ vendor: vendorContact }).catch((e) =>
          console.warn('[Admin Approve] Approval email error:', e)
        );
      } else {
        await sendVendorAccountRejectedNotification({
          vendor: vendorContact,
          rejectionReason: bioObj.rejectionReason,
        }).catch((e) => console.warn('[Admin Reject] Rejection email error:', e));
      }
    }

    return NextResponse.json({
      success: true,
      message: isApprove ? 'Brand successfully approved and verified! Official approval email sent.' : 'Brand submission returned for correction with notification sent.',
      vendor: updatedVendor,
      approvalStatus: bioObj.approvalStatus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
