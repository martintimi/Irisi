import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Super Admin Products Control API
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { productId, price, isFeatured, inStock, name, category, genderTarget, colors, description } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (price !== undefined) updates.price = Number(price);
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (inStock !== undefined) updates.in_stock = Boolean(inStock);
    if (isFeatured !== undefined) updates.is_featured = Boolean(isFeatured);
    if (genderTarget !== undefined) updates.gender_target = genderTarget;
    // colors is stored as jsonb array in products table
    if (colors !== undefined) updates.colors = colors;

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Super Admin product update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Product ${productId} deleted successfully`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
