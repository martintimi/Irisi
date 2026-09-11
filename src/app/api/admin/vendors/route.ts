import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Fetch all vendors from DB
    const { data: dbVendors, error: vendorErr } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendorErr) {
      return NextResponse.json({ error: vendorErr.message }, { status: 500 });
    }

    // 2. Fetch all products to calculate product counts
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, vendor_id, price');

    const formattedVendors = (dbVendors || []).map((v: any) => {
      let bioText = v.bio || '';
      let isProfileSaved = false;
      let approvalStatus = v.is_verified ? 'approved' : 'pending';
      let rejectionReason = '';
      let specialty = v.specialty || '';
      let city = '';
      let state = '';
      let address = '';
      let socialLinks: any = {
        instagram: '',
        tiktok: '',
        snapchat: '',
        whatsapp: v.phone || ''
      };

      if (bioText.startsWith('{') && bioText.endsWith('}')) {
        try {
          const parsed = JSON.parse(bioText);
          bioText = parsed.bio || '';
          socialLinks = { ...socialLinks, ...parsed.socialLinks };
          isProfileSaved = parsed.isProfileSaved !== undefined ? parsed.isProfileSaved : true;
          approvalStatus = parsed.approvalStatus || (v.is_verified ? 'approved' : 'pending');
          rejectionReason = parsed.rejectionReason || '';
          specialty = parsed.specialty || parsed.vendorSpecialty || specialty;
          city = parsed.city || '';
          state = parsed.state || '';
          address = parsed.address || '';
        } catch (e) {}
      } else if (bioText && bioText.trim().length > 0) {
        isProfileSaved = true;
        approvalStatus = v.is_verified ? 'approved' : 'pending';
      }

      if (!specialty) {
        specialty = v.vendor_type === 'fashion_designer' ? 'native_tailoring' : 'streetwear';
      }

      const vendorProducts = (dbProducts || []).filter((p: any) => p.vendor_id === v.id);
      const totalInventoryValue = vendorProducts.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0);

      return {
        id: v.id,
        name: v.brand_name || 'Unnamed Brand',
        designerName: v.designer_name || v.contact_person || 'N/A',
        email: v.email || 'N/A',
        phone: v.phone || 'N/A',
        location: v.location || 'Lagos, Nigeria',
        city: city || (v.location ? v.location.split(',')[0]?.trim() : ''),
        state: state || (v.location && v.location.includes(',') ? v.location.split(',')[1]?.trim() : 'Lagos'),
        address,
        vendorType: v.vendor_type || (specialty === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller'),
        specialty,
        bankName: v.bank_name || 'Not Configured',
        accountNumber: v.account_number || 'N/A',
        accountName: v.account_name || 'N/A',
        bio: bioText,
        socialLinks,
        instagram: socialLinks.instagram || '',
        tiktok: socialLinks.tiktok || '',
        snapchat: socialLinks.snapchat || '',
        whatsapp: socialLinks.whatsapp || v.phone || '',
        isVerified: !!v.is_verified,
        isProfileSaved,
        approvalStatus,
        rejectionReason,
        productCount: vendorProducts.length,
        totalInventoryValue,
        rating: v.rating || 5.0,
        createdAt: v.created_at || new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      vendors: formattedVendors,
      count: formattedVendors.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
