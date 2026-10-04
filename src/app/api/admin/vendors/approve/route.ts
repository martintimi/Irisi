import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendVendorAccountApprovedNotification,
  sendVendorAccountRejectedNotification,
  sendVendorAccountSuspendedNotification,
  sendVendorAccountReinstatedNotification,
} from '@/lib/services/vendorNotificationService';
import { invalidateProductsCache } from '@/app/api/products/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId, action, rejectionReason = '', suspensionReason = '' } = body;

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
    const isSuspend = action === 'suspend';
    const isUnsuspend = action === 'unsuspend';
    const isReject = action === 'reject';

    let isVerified = false;

    if (isSuspend) {
      bioObj.approvalStatus = 'suspended';
      bioObj.suspensionReason = suspensionReason || rejectionReason || 'Account suspended by administration.';
      bioObj.suspendedAt = new Date().toISOString();
      isVerified = false;
    } else if (isUnsuspend) {
      bioObj.approvalStatus = 'approved';
      bioObj.suspensionReason = '';
      bioObj.reinstatedAt = new Date().toISOString();
      bioObj.isProfileSaved = true;
      isVerified = true;
    } else if (isApprove) {
      bioObj.approvalStatus = 'approved';
      bioObj.rejectionReason = '';
      bioObj.suspensionReason = '';
      bioObj.isProfileSaved = true;
      isVerified = true;
    } else {
      // Default reject
      bioObj.approvalStatus = 'rejected';
      bioObj.rejectionReason = rejectionReason || 'Store information needs revision.';
      isVerified = false;
    }

    const updatedBioStr = JSON.stringify(bioObj);

    // 3. Update in PostgreSQL
    const { data: updatedVendor, error: updateErr } = await supabase
      .from('vendors')
      .update({
        is_verified: isVerified,
        bio: updatedBioStr
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Purge products cache so public marketplace immediately reflects the change
    try {
      invalidateProductsCache();
    } catch (e) {}

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

      if (isSuspend) {
        await sendVendorAccountSuspendedNotification({
          vendor: vendorContact,
          suspensionReason: bioObj.suspensionReason,
        }).catch((e) => console.warn('[Admin Suspend] Suspension email error:', e));
      } else if (isUnsuspend) {
        await sendVendorAccountReinstatedNotification({
          vendor: vendorContact,
        }).catch((e) => console.warn('[Admin Unsuspend] Reinstatement email error:', e));
      } else if (isApprove) {
        await sendVendorAccountApprovedNotification({
          vendor: vendorContact
        }).catch((e) => console.warn('[Admin Approve] Approval email error:', e));
      } else if (isReject) {
        await sendVendorAccountRejectedNotification({
          vendor: vendorContact,
          rejectionReason: bioObj.rejectionReason,
        }).catch((e) => console.warn('[Admin Reject] Rejection email error:', e));
      }
    }

    let successMessage = 'Action completed successfully.';
    if (isSuspend) successMessage = `Brand "${updatedVendor.brand_name || vendorId}" suspended. Products hidden from shoppers and portal access restricted.`;
    else if (isUnsuspend) successMessage = `Brand "${updatedVendor.brand_name || vendorId}" reinstated and live!`;
    else if (isApprove) successMessage = `Brand "${updatedVendor.brand_name || vendorId}" successfully approved and verified!`;
    else if (isReject) successMessage = `Brand "${updatedVendor.brand_name || vendorId}" returned for correction with notification sent.`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      vendor: updatedVendor,
      approvalStatus: bioObj.approvalStatus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

