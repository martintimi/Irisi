import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INITIAL_CATEGORIES, CategoryItem } from '@/lib/data/categories';

// In-memory runtime cache for admin additions when Supabase table isn't created yet
let inMemoryCategories: CategoryItem[] = [...INITIAL_CATEGORIES];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      // Map DB schema to CategoryItem
      const dbCategories: CategoryItem[] = data.map((d: any) => ({
        id: d.id || d.slug,
        name: d.name,
        slug: d.slug,
        gender: d.gender_target || 'unisex',
        department: d.department || 'clothing',
        imageUrl: d.image_url || '/images/products/BlackTrapStarHoodie.jpg',
        subtitle: d.subtitle || d.description || '',
        isPopular: d.is_popular || false,
      }));

      return NextResponse.json({
        success: true,
        categories: dbCategories,
        source: 'database',
      });
    }

    return NextResponse.json({
      success: true,
      categories: inMemoryCategories,
      source: 'seeded',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      categories: inMemoryCategories,
      source: 'fallback',
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, gender, department, imageUrl, subtitle } = body;

    if (!name || !department) {
      return NextResponse.json(
        { success: false, error: 'Name and Department are required' },
        { status: 400 }
      );
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newCategory: CategoryItem = {
      id: `${gender || 'unisex'}-${generatedSlug}`,
      name,
      slug: generatedSlug,
      gender: gender || 'unisex',
      department,
      imageUrl: imageUrl || '/images/products/BlackTrapStarHoodie.jpg',
      subtitle: subtitle || `Curated collection of ${name}`,
      isPopular: false,
    };

    // Try saving to Supabase if table exists
    try {
      const supabase = await createClient();
      await supabase.from('categories').insert({
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        gender_target: newCategory.gender,
        department: newCategory.department,
        image_url: newCategory.imageUrl,
        description: newCategory.subtitle,
      });
    } catch {
      // Non-fatal: table may not be migrated yet in some local environments
    }

    // Always update runtime cache
    inMemoryCategories = [newCategory, ...inMemoryCategories];

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: newCategory,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      await supabase.from('categories').delete().eq('id', categoryId);
    } catch {
      // Non-fatal
    }

    inMemoryCategories = inMemoryCategories.filter((c) => c.id !== categoryId);

    return NextResponse.json({
      success: true,
      message: 'Category removed successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
