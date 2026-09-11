import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ActiveOutfit, BodyProfile, CartItem, Product, ProductColor, GarmentCategory,
  GarmentOriginType, Order, NotificationItem, VendorProfile, VendorStory
} from '@/types';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';

export interface UserAuth {
  isLoggedIn: boolean;
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  userType: 'shopper' | 'vendor';
}

export interface IrisiState {
  // Theme Mode
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Selected Studio & Catalog Gender Target
  selectedGender: 'male' | 'female';
  setSelectedGender: (gender: 'male' | 'female') => void;

  // Garment Origin Filter: All | Handmade Designers | Ready-made Boutiques
  selectedOriginType: 'all' | 'handmade_designer' | 'ready_made_boutique';
  setSelectedOriginType: (origin: 'all' | 'handmade_designer' | 'ready_made_boutique') => void;

  // User Auth & Body Profile
  userAuth: UserAuth;
  setUserAuth: (auth: Partial<UserAuth>) => void;
  logout: () => void;
  bodyProfile: BodyProfile;
  setBodyProfile: (profile: Partial<BodyProfile>) => void;
  resetBodyProfile: () => void;

  // Orders Management
  userOrders: Order[];
  createNewOrder: (order: Omit<Order, 'id'>) => Order;
  rateOrder: (orderId: string, rating: number, comment: string) => void;
  updateOrderStatus: (orderNumber: string, status: string, trackingStage: number, vendorId?: string) => void;

  // Notifications Management
  userNotifications: NotificationItem[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  // Catalog Products (Initial + Vendor Uploaded)
  allProducts: Product[];
  isProductsLoading: boolean;
  addCustomProduct: (product: Product) => void;
  setAllProducts: (products: Product[]) => void;
  fetchProductsFromDb: (force?: boolean) => Promise<void>;

  // Active Outfit Canvas
  activeOutfit: ActiveOutfit;
  setOutfitItem: (product: Product) => void;
  removeOutfitItem: (category: GarmentCategory) => void;
  clearOutfit: () => void;
  randomizeOutfit: () => void;
  fitHeatmapActive: boolean;
  setFitHeatmapActive: (active: boolean) => void;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    size?: string,
    color?: ProductColor | { name: string; hex: string; imageUrl?: string } | string | null,
    quantity?: number
  ) => void;
  addEntireOutfitToCart: () => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  lastAddedCartItem: { id: string; name: string; imageUrl: string; timestamp: number } | null;
  clearLastAddedCartItem: () => void;

  // Followed Brands / Vendors
  followedVendors: string[];
  toggleFollowVendor: (vendorId: string) => void;
  isFollowingVendor: (vendorId: string) => boolean;

  // Boutique Stories
  vendorStories: VendorStory[];
  addVendorStory: (story: VendorStory) => void;

  // Vendor Portal State
  isVendorLoggedIn: boolean;
  setIsVendorLoggedIn: (loggedIn: boolean) => void;
  vendorProfile: VendorProfile;
  setVendorProfile: (profile: Partial<VendorProfile>) => void;
  vendorLogout: () => void;
  // Wardrobe Vault (Curated Wishlist)
  vault: Product[];
  toggleVaultItem: (product: Product) => void;
  isInVault: (productId: string) => boolean;
  isVaultOpen: boolean;
  setIsVaultOpen: (open: boolean) => void;
  clearVault: () => void;

  // Modals
  isProfileWizardOpen: boolean;
  setIsProfileWizardOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

export const defaultVendorProfile: VendorProfile = {
  brandName: '',
  designerName: '',
  contactPerson: '',
  email: '',
  phone: '',
  location: '',
  vendorType: 'boutique_seller',
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountNumber: '',
  accountName: '',
  instagram: '',
  bio: '',
  logoUrl: '',
};

let fetchProductsPromise: Promise<void> | null = null;
let lastProductsFetchTime = 0;

const defaultProfile: BodyProfile = {
  name: '',
  email: '',
  phone: '',
  deliveryAddress: '',
  city: 'Lagos',
  state: 'Lagos',
  heightCm: 180,
  weightKg: 75,
  gender: 'male',
  bodyShape: 'athletic',
  fitPreference: 'tailored',
  avatarStyle: 'minimal_editorial',
  skinTone: 'deep',
  skinToneHex: '#8B4513',
  hairStyle: 'high_fade',
  hairColor: '#000000',
  facialHair: 'clean',
  avatarDisplayMode: 'bitmoji',
  chestCm: 102,
  waistCm: 84,
  hipsCm: 100,
  inseamCm: 84,
  shoulderWidthCm: 48,
  twinId: 'VY-TWIN-STD',
  isInitialized: false,
  isLoggedIn: false,
  preferredSize: 'M',
  preferredFit: 'regular',
};

const initialOrders: Order[] = [];
/*
const oldInitialOrders: Order[] = [
  {
    id: 'ord-1',
    orderNumber: '#VY-ORD-9201',
    date: '22 Aug 2026',
    totalAmount: 148000,
    status: 'delivered',
    customerName: 'Chukwudi Eze',
    customerPhone: '+234 803 456 7890',
    customerEmail: 'chukwudi.eze@gmail.com',
    deliveryAddress: '',
    deliveryCity: 'Lagos',
    customerMeasurements: {
      heightCm: 182,
      chestCm: 104,
      shoulderCm: 49,
      waistCm: 84,
      inseamCm: 84,
    },
    items: [
      {
        productId: 'top-senator-black',
        productName: 'Onyx Black Wool Senator Kaftan',
        vendorId: 'sartorial-lagos',
        vendorName: 'Sartorial Lagos',
        price: 65000,
        size: 'L',
        imageUrl: '/images/products/BlackSenator.jpg',
        category: 'tops'
      },
      {
        productId: 'bottom-baggy-jean',
        productName: 'Lagos Wide-Leg Baggy Denim Jeans',
        vendorId: 'yaba-denim',
        vendorName: 'Yaba Denim Works',
        price: 38000,
        size: 'L',
        imageUrl: '/images/products/BaggyJean.jpg',
        category: 'bottoms'
      },
      {
        productId: 'shoes-unisex-slides',
        productName: 'Kano Handcrafted Full-Grain Leather Slides',
        vendorId: 'kano-leather',
        vendorName: 'Kano Artisan Footwear',
        price: 35000,
        size: 'L',
        imageUrl: '/images/products/UnisexSlides.jpg',
        category: 'footwear'
      }
    ],
    paystackRef: 'pstk_live_891028392',
    isRated: false,
  },
  {
    id: 'ord-2',
    orderNumber: '#VY-ORD-9174',
    date: '15 Aug 2026',
    totalAmount: 98000,
    status: 'delivered',
    customerName: 'Chukwudi Eze',
    customerPhone: '+234 803 456 7890',
    customerEmail: 'chukwudi.eze@gmail.com',
    deliveryAddress: '',
    deliveryCity: 'Lagos',
    customerMeasurements: {
      heightCm: 182,
      chestCm: 104,
      shoulderCm: 49,
      waistCm: 84,
      inseamCm: 84,
    },
    items: [
      {
        productId: 'outer-agbada-black',
        productName: 'Midnight Black Embroidered Agbada Robe',
        vendorId: 'sartorial-lagos',
        vendorName: 'Sartorial Lagos',
        price: 98000,
        size: 'L',
        imageUrl: '/images/products/BlackAgbada.jpg',
        category: 'outerwear'
      }
    ],
    paystackRef: 'pstk_live_771829301',
    isRated: true,
    rating: 5,
    reviewComment: 'The chest embroidery on this Agbada is world-class. Fits my 49cm shoulder line with zero pull.'
  }
];
*/


const initialStories: VendorStory[] = [
  {
    id: 'story-moji-1',
    vendorId: 'moji-wears',
    vendorName: 'Moji Wears',
    vendorAvatar: '/images/products/BlackTrapStarHoodie.jpg',
    mediaUrl: '/images/products/BlackTrapStarHoodie.jpg',
    caption: 'Midnight Heavyweight TrapStar Drop ⚡ 480GSM Cotton in Stock now.',
    taggedProductId: 'prod-1787616646574-370',
    taggedProductName: 'Trap Star Street Hoodie',
    taggedProductPrice: 33000,
    taggedProductImage: '/images/products/BlackTrapStarHoodie.jpg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'story-arike-1',
    vendorId: 'arike-brand',
    vendorName: 'Arike Brand',
    vendorAvatar: '/images/products/BlackAgbada.jpg',
    mediaUrl: '/images/products/BlackAgbada.jpg',
    caption: 'Handcrafted Heritage Agbada with Obsidian Embroidery ✨ Limited drop.',
    taggedProductId: 'prod-1787684395100-506',
    taggedProductName: 'Black Agbada For Men',
    taggedProductPrice: 67,
    taggedProductImage: '/images/products/BlackAgbada.jpg',
    createdAt: new Date().toISOString()
  },
  {
    id: 'story-sartorial-1',
    vendorId: 'sartorial-lagos',
    vendorName: 'Sartorial Lagos',
    vendorAvatar: '/images/products/BlackSenator.jpg',
    mediaUrl: '/images/products/BlackSenator.jpg',
    caption: 'Super 160s Wool Senator Kaftan with Geometric Placket. Ready to wear.',
    taggedProductId: 'prod-1787718457711-343',
    taggedProductName: 'Onyx Wool Senator Kaftan',
    taggedProductPrice: 68000,
    taggedProductImage: '/images/products/BlackSenator.jpg',
    createdAt: new Date().toISOString()
  }
];

const initialOutfit: ActiveOutfit = {};

export type VeyraState = IrisiState;

export function getTimeBasedTheme(): 'dark' | 'light' {
  return 'light';
}

// Purge legacy storage key to free browser quota immediately
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('veyra-store-storage');
  } catch (e) {}
}

/**
 * Strips heavy data (e.g. huge images arrays, base64 strings, descriptions)
 * before persisting to localStorage to guarantee keeping storage well below browser quota.
 */
function sanitizeProductForStorage(p: Product): Product {
  if (!p) return p;
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice,
    vendorId: p.vendorId,
    vendorName: p.vendorName,
    vendorCity: p.vendorCity,
    vendorState: p.vendorState,
    category: p.category,
    genderTarget: p.genderTarget,
    garmentOriginType: p.garmentOriginType,
    imageUrl: p.imageUrl || '',
    images: [], // Omit secondary images array from storage to save memory, keeping primary imageUrl intact
    dispatchDays: p.dispatchDays,
    shippingRates: p.shippingRates,
    weightKg: p.weightKg,
    colors: Array.isArray(p.colors)
      ? p.colors.map(c => ({
          name: typeof c === 'string' ? c : (c.name || 'Standard'),
          hex: typeof c === 'object' && c.hex ? c.hex : '#111111',
          imageUrl: typeof c === 'object' && typeof c.imageUrl === 'string' ? c.imageUrl : undefined
        }))
      : [],
    sizes: p.sizes || [],
    description: '',
    tags: [],
    sizeChart: {},
    fabricComposition: '',
    fitNotes: '',
    rating: p.rating || 5,
    reviewCount: p.reviewCount || 0,
    layerZIndex: p.layerZIndex || 1,
  };
}

function sanitizeCartItemForStorage(item: CartItem): CartItem {
  return {
    id: item.id,
    selectedSize: item.selectedSize,
    selectedColor: {
      name: item.selectedColor?.name || 'Standard',
      hex: item.selectedColor?.hex || '#111111',
      imageUrl: typeof item.selectedColor?.imageUrl === 'string'
        ? item.selectedColor.imageUrl
        : undefined
    },
    quantity: Math.max(1, Number(item.quantity || 1)),
    fitScore: item.fitScore || 95,
    product: sanitizeProductForStorage(item.product),
  };
}

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch (quotaError) {
      console.warn(`[irisi-store] localStorage quota exceeded while writing "${name}". Recovering storage...`, quotaError);
      try {
        localStorage.removeItem('veyra-store-storage');
        const parsed = JSON.parse(value);
        if (parsed?.state) {
          if (Array.isArray(parsed.state.userOrders)) {
            parsed.state.userOrders = parsed.state.userOrders.slice(0, 1);
          }
          parsed.state.vault = [];
          localStorage.setItem(name, JSON.stringify(parsed));
        }
      } catch (recoveryErr) {
        console.error('[irisi-store] Quota recovery failed, suppressing throw to prevent app crash.', recoveryErr);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useStore = create<IrisiState>()(
  persist(
    (set, get) => ({
      // Theme State - Defaults to Light mode by default
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('irisi_manual_theme_override', 'true');
        }
        set({ theme: next });
        if (typeof document !== 'undefined') {
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
        }
      },

      // Gender & Origin Filters
      selectedGender: 'male',
      setSelectedGender: (gender) => {
        const tops = get().allProducts.filter(p => p.category === 'tops' && (p.genderTarget === gender || p.genderTarget === 'unisex'));
        const bottoms = get().allProducts.filter(p => p.category === 'bottoms' && (p.genderTarget === gender || p.genderTarget === 'unisex'));
        
        set((state) => ({
          selectedGender: gender,
          bodyProfile: { ...state.bodyProfile, gender },
          activeOutfit: {
            tops: tops[0] || undefined,
            bottoms: bottoms[0] || undefined,
          }
        }));
      },

      selectedOriginType: 'all',
      setSelectedOriginType: (origin) => set({ selectedOriginType: origin }),

      // User Auth
      userAuth: {
        isLoggedIn: false,
  preferredSize: 'M',
  preferredFit: 'regular',
        name: '',
        email: '',
        phone: '',
        gender: 'male',
        userType: 'shopper',
      },
      setUserAuth: (authUpdate) => {
        set((state) => {
          const updatedAuth = { ...state.userAuth, ...authUpdate };
          return {
            userAuth: updatedAuth,
            bodyProfile: {
              ...state.bodyProfile,
              name: updatedAuth.name || state.bodyProfile.name,
              email: updatedAuth.email || state.bodyProfile.email,
              phone: updatedAuth.phone || state.bodyProfile.phone,
              gender: updatedAuth.gender || state.bodyProfile.gender,
              isLoggedIn: updatedAuth.isLoggedIn,
              isInitialized: true,
            }
          };
        });
      },
      logout: () => {
        set({
          userAuth: {
            isLoggedIn: false,
            name: '',
            email: '',
            phone: '',
            gender: 'male',
            userType: 'shopper',
          },
          bodyProfile: { ...defaultProfile, isLoggedIn: false },
        });
      },

      // Profile State
      bodyProfile: defaultProfile,
      setBodyProfile: (profileUpdate) => {
        set((state) => ({
          bodyProfile: {
            ...state.bodyProfile,
            ...profileUpdate,
            isInitialized: true,
          },
        }));
      },
      resetBodyProfile: () => {
        set({ bodyProfile: defaultProfile });
      },

      // Orders Management
      userOrders: [],
      createNewOrder: (orderData) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const newOrder: any = {
          ...orderData,
          id: `ord-${Date.now()}`,
          date: `${dateStr}, ${timeStr}`,
          status: 'escrow_secured',
          trackingStage: 1, // 1: Escrow Secured, 2: Packing, 3: Dispatched, 4: Delivered
        };
        set((state) => ({
          userOrders: [newOrder, ...state.userOrders]
        }));
        return newOrder;
      },
      updateOrderStatus: (orderNumber: string, status: string, trackingStage: number, vendorId?: string) => {
        set((state) => ({
          userOrders: state.userOrders.map((ord) => {
            if (ord.orderNumber === orderNumber || ord.id === orderNumber) {
              const existingPkgs = { ...((ord as any).vendorPackages || {}) };
              if (vendorId) {
                existingPkgs[vendorId] = {
                  ...(existingPkgs[vendorId] || {}),
                  status,
                  trackingStage,
                  lastUpdated: new Date().toISOString()
                };
              }
              return {
                ...ord,
                vendorPackages: existingPkgs,
                status: vendorId ? ord.status : (status as any),
                trackingStage: vendorId ? ord.trackingStage : trackingStage
              };
            }
            return ord;
          })
        }));
      },
      rateOrder: (orderId, rating, comment) => {
        set((state) => ({
          userOrders: state.userOrders.map((ord) =>
            ord.id === orderId
              ? { ...ord, isRated: true, rating, reviewComment: comment }
              : ord
          )
        }));
      },

      // Notifications Management (real user notifications only)
      userNotifications: [],
      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          userNotifications: state.userNotifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        }));
      },
      markAllNotificationsAsRead: () => {
        set((state) => ({
          userNotifications: state.userNotifications.map((n) => ({ ...n, read: true }))
        }));
      },
      addNotification: (notification) => {
        const newNotif: NotificationItem = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: 'Just now',
          read: false,
        };
        set((state) => ({
          userNotifications: [newNotif, ...state.userNotifications]
        }));
      },

      // Products Catalog (with dynamic uploads)
      allProducts: [],
      isProductsLoading: true,
      setAllProducts: (products) => set({ allProducts: products }),
      fetchProductsFromDb: async (force: boolean = false) => {
        if (typeof window === 'undefined') return;
        const state = get();
        const now = Date.now();

        // 1. If products already fetched within the last 30s and not forced, reuse in-memory data
        if (!force && state.allProducts.length > 0 && now - lastProductsFetchTime < 30000) {
          if (state.isProductsLoading) set({ isProductsLoading: false });
          return;
        }

        // 2. Deduplicate in-flight fetch requests across components
        if (fetchProductsPromise && !force) {
          return fetchProductsPromise;
        }

        // 3. Only show loading skeleton if we don't have any products in memory yet
        if (state.allProducts.length === 0) {
          set({ isProductsLoading: true });
        }

        fetchProductsPromise = (async () => {
          try {
            const res = await fetch('/api/products', {
              cache: 'no-cache',
              headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            lastProductsFetchTime = Date.now();
            if (data.success && Array.isArray(data.products) && data.products.length > 0) {
              const dbProducts: Product[] = data.products.map((p: any) => {
                const rawGender = String(p.gender_target || p.genderTarget || 'unisex').toLowerCase();
                let normalizedGender: 'male' | 'female' | 'unisex' = 'unisex';
                if (rawGender === 'male' || rawGender === 'men' || rawGender === 'man') {
                  normalizedGender = 'male';
                } else if (rawGender === 'female' || rawGender === 'women' || rawGender === 'woman') {
                  normalizedGender = 'female';
                }

                const rawOrigin = String(p.garment_origin_type || p.garmentOriginType || 'ready_made_boutique').toLowerCase();
                const normalizedOrigin: GarmentOriginType = (rawOrigin === 'bespoke_atelier' || rawOrigin === 'handmade_designer') 
                  ? 'handmade_designer' 
                  : 'ready_made_boutique';

                return {
                  id: p.id,
                  vendorId: p.vendorId || p.vendor_id || 'boutique',
                  vendorName: p.vendorName || p.vendor_name || (p.vendor_id ? p.vendor_id.replace(/-/g, ' ') : 'Ìrísí Partner'),
                  vendorCity: p.vendorCity || p.vendor_city || '',
                  vendorState: p.vendorState || p.vendor_state || '',
                  vendorLocation: p.vendorLocation || p.vendor_location || '',
                  dispatchDays: p.vendorDispatchDays || p.dispatch_days || '1-2 business days',
                  shippingRates: p.vendorShippingRates || p.shipping_rates || {
                    sameCity: 1000,
                    closeHub: 2500,
                    interstate: 4500,
                    parkPickup: 1500,
                    parkPickupEnabled: true,
                  },
                  name: p.name,
                  category: (p.category || 'tops').toLowerCase() as GarmentCategory,
                  genderTarget: normalizedGender,
                  garmentOriginType: normalizedOrigin,
                  price: Number(p.price) || 0,
                  description: p.description || '',
                  tags: Array.isArray(p.tags) ? p.tags : ['Ready-to-Wear'],
                  colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: 'Default', hex: '#111111' }],
                  sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
                  sizeChart: {},
                  imageUrl: p.imageUrl || p.image_url || '/images/products/BlackTrapStarHoodie.jpg',
                  images: Array.isArray(p.images) && p.images.length > 0
                    ? p.images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean)
                    : (p.imageUrl ? [p.imageUrl] : []),
                  videoUrl: p.videoUrl || p.video_url || undefined,
                  fabricComposition: 'Premium Nigerian Fabric',
                  fitNotes: 'Standard ready-to-wear sizing',
                  rating: 5.0,
                  reviewCount: 12,
                  layerZIndex: 2,
                  badge: normalizedOrigin === 'ready_made_boutique' ? 'Fast 24-48h Drop' : 'Bespoke Handmade'
                };
              });

              // Set strictly to live PostgreSQL database products and heal cart items with real DB images
              set((state) => ({
                allProducts: dbProducts,
                cart: state.cart.map((cartItem) => {
                  const dbMatch = dbProducts.find((dp) => dp.id === cartItem.product?.id);
                  if (dbMatch) {
                    return {
                      ...cartItem,
                      product: {
                        ...cartItem.product,
                        imageUrl: dbMatch.imageUrl || cartItem.product.imageUrl,
                        images: dbMatch.images && dbMatch.images.length > 0 ? dbMatch.images : cartItem.product.images,
                        vendorId: dbMatch.vendorId || cartItem.product.vendorId,
                        vendorName: dbMatch.vendorName || cartItem.product.vendorName,
                        vendorCity: dbMatch.vendorCity || cartItem.product.vendorCity,
                        vendorState: dbMatch.vendorState || cartItem.product.vendorState,
                        shippingRates: dbMatch.shippingRates || cartItem.product.shippingRates,
                      },
                    };
                  }
                  return cartItem;
                }),
              }));
            } else if (data.success && Array.isArray(data.products) && data.products.length === 0) {
              set({ allProducts: [] });
            }
          } catch (e) {
            console.error('Error hydrating products from DB:', e);
          } finally {
            set({ isProductsLoading: false });
            fetchProductsPromise = null;
          }
        })();

        return fetchProductsPromise;
      },
      addCustomProduct: (newProduct) => {
        set((state) => ({
          allProducts: [newProduct, ...state.allProducts],
        }));
      },

      // Active Outfit State
      activeOutfit: initialOutfit,
      fitHeatmapActive: false,
      setFitHeatmapActive: (active) => set({ fitHeatmapActive: active }),
      setOutfitItem: (product) => {
        set((state) => ({
          activeOutfit: {
            ...state.activeOutfit,
            [product.category]: product,
          },
        }));
      },
      removeOutfitItem: (category) => {
        set((state) => {
          const next = { ...state.activeOutfit };
          delete next[category];
          return { activeOutfit: next };
        });
      },
      clearOutfit: () => {
        set({ activeOutfit: {} });
      },
      randomizeOutfit: () => {
        const { selectedGender, allProducts } = get();
        const tops = allProducts.filter(p => p.category === 'tops' && (p.genderTarget === selectedGender || p.genderTarget === 'unisex'));
        const bottoms = allProducts.filter(p => p.category === 'bottoms' && (p.genderTarget === selectedGender || p.genderTarget === 'unisex'));
        const outer = allProducts.filter(p => p.category === 'outerwear' && (p.genderTarget === selectedGender || p.genderTarget === 'unisex'));
        const shoes = allProducts.filter(p => p.category === 'footwear');
        const accs = allProducts.filter(p => p.category === 'accessories');

        set({
          activeOutfit: {
            tops: tops.length ? tops[Math.floor(Math.random() * tops.length)] : undefined,
            bottoms: bottoms.length ? bottoms[Math.floor(Math.random() * bottoms.length)] : undefined,
            outerwear: outer.length ? outer[Math.floor(Math.random() * outer.length)] : undefined,
            footwear: shoes.length ? shoes[Math.floor(Math.random() * shoes.length)] : undefined,
            accessories: accs.length ? accs[Math.floor(Math.random() * accs.length)] : undefined,
          }
        });
      },

      // Cart State
      cart: [],
      isCartOpen: false,
      setIsCartOpen: (open) => set({ isCartOpen: open }),
      lastAddedCartItem: null,
      clearLastAddedCartItem: () => set({ lastAddedCartItem: null }),
      addToCart: (product, size, color, quantity) => {
        const { bodyProfile, cart } = get();
        const fitResult = calculateFitMatch(bodyProfile, product);
        const chosenSize = size || (product as any).selectedSize || fitResult.recommendedSize || product.sizes?.[0] || 'M';

        // Extract chosen color reliably
        let chosenColor: ProductColor = product.colors?.[0] || { name: 'Standard', hex: '#111111' };
        if (color) {
          if (typeof color === 'string') {
            chosenColor = { name: color, hex: '#111111' };
          } else if (typeof color === 'object' && color.name) {
            chosenColor = {
              name: color.name,
              hex: color.hex || '#111111',
              imageUrl: color.imageUrl
            };
          }
        } else if ((product as any).selectedColor) {
          const sc = (product as any).selectedColor;
          chosenColor = typeof sc === 'string' ? { name: sc, hex: '#111111' } : {
            name: sc.name || 'Standard',
            hex: sc.hex || '#111111',
            imageUrl: sc.imageUrl
          };
        }

        // Extract chosen quantity reliably
        const addQty = Math.max(1, Number(quantity ?? (product as any).quantity ?? 1));

        // Match existing item by both size AND color
        const existingIndex = cart.findIndex(
          item => item.product.id === product.id &&
                  item.selectedSize === chosenSize &&
                  (item.selectedColor?.name || '').toLowerCase().trim() === (chosenColor.name || '').toLowerCase().trim()
        );

        const lastAdded = {
          id: String(product.id),
          name: product.name,
          imageUrl: product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '',
          timestamp: Date.now(),
        };

        if (existingIndex > -1) {
          const updated = [...cart];
          updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + addQty;
          set({ cart: updated, lastAddedCartItem: lastAdded });
        } else {
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            product,
            selectedSize: chosenSize,
            selectedColor: chosenColor,
            quantity: addQty,
            fitScore: fitResult.matchScore,
          };
          set({ cart: [...cart, newItem], lastAddedCartItem: lastAdded });
        }
      },
      addEntireOutfitToCart: () => {
        const { activeOutfit, bodyProfile, cart } = get();
        const itemsToAdd = Object.values(activeOutfit).filter(Boolean) as Product[];
        const newItems: CartItem[] = [];

        itemsToAdd.forEach((product) => {
          const fitResult = calculateFitMatch(bodyProfile, product);
          const existing = cart.find(
            c => c.product.id === product.id && c.selectedSize === fitResult.recommendedSize
          );
          if (!existing) {
            newItems.push({
              id: `cart-outfit-${product.id}-${Date.now()}`,
              product,
              selectedSize: fitResult.recommendedSize,
              selectedColor: product.colors[0],
              quantity: 1,
              fitScore: fitResult.matchScore,
            });
          }
        });

        set({ cart: [...cart, ...newItems] });
      },
      removeFromCart: (cartItemId) => {
        set((state) => ({
          cart: state.cart.filter(item => item.id !== cartItemId && item.product.id !== cartItemId),
        }));
      },
      updateCartQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        set((state) => ({
          cart: state.cart.map(item =>
            (item.id === cartItemId || item.product.id === cartItemId) ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ cart: [] }),

      // Wardrobe Vault (Curated Wishlist)
      vault: [],
      isVaultOpen: false,
      setIsVaultOpen: (open) => set({ isVaultOpen: open }),
      isInVault: (productId) => get().vault.some(p => p.id === productId),
      toggleVaultItem: (product) => {
        const { vault } = get();
        const exists = vault.some(p => p.id === product.id);
        if (exists) {
          set({ vault: vault.filter(p => p.id !== product.id) });
        } else {
          set({ vault: [...vault, product] });
        }
      },
      clearVault: () => set({ vault: [] }),

      // Followed Brands / Vendors
      followedVendors: ['moji-wears', 'arike-brand'],
      toggleFollowVendor: (vendorId) => {
        const lower = (vendorId || '').toLowerCase();
        const current = get().followedVendors || [];
        if (current.includes(lower)) {
          set({ followedVendors: current.filter(id => id !== lower) });
        } else {
          set({ followedVendors: [...current, lower] });
        }
      },
      isFollowingVendor: (vendorId) => {
        const lower = (vendorId || '').toLowerCase();
        return (get().followedVendors || []).includes(lower);
      },

      // Boutique Stories
      vendorStories: initialStories,
      addVendorStory: (story) => {
        set((state) => ({
          vendorStories: [story, ...(state.vendorStories || [])]
        }));
      },

      // Vendor Portal State
      isVendorLoggedIn: false,
      setIsVendorLoggedIn: (loggedIn) => set({ isVendorLoggedIn: loggedIn }),
      vendorProfile: defaultVendorProfile,
      setVendorProfile: (profile) =>
        set((state) => ({
          vendorProfile: { ...state.vendorProfile, ...profile }
        })),
      vendorLogout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('irisi_vendor_id');
          localStorage.removeItem('irisi_vendor_token');
          localStorage.removeItem('irisi_vendor_email');
          localStorage.removeItem('veyra_vendor_id');
          localStorage.removeItem('veyra_vendor_token');
          localStorage.removeItem('veyra_vendor_email');
          document.cookie = 'irisi_vendor_id=; path=/; max-age=0';
          document.cookie = 'veyra_vendor_id=; path=/; max-age=0';
        }
        set({ isVendorLoggedIn: false, vendorProfile: defaultVendorProfile });
      },

      // UI Modals
      isProfileWizardOpen: false,
      setIsProfileWizardOpen: (open) => set({ isProfileWizardOpen: open }),
      isAuthModalOpen: false,
      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
    }),
    {
      name: 'irisi-store-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        theme: state.theme,
        selectedGender: state.selectedGender,
        userAuth: state.userAuth,
        bodyProfile: state.bodyProfile,
        isVendorLoggedIn: state.isVendorLoggedIn,
        vendorProfile: state.vendorProfile,
        cart: state.cart.map(sanitizeCartItemForStorage),
        vault: state.vault.slice(0, 10).map(sanitizeProductForStorage),
        userOrders: (state.userOrders || []).slice(0, 5),
        followedVendors: state.followedVendors,
        userNotifications: state.userNotifications.slice(0, 10),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof state.fetchProductsFromDb === 'function') {
          state.fetchProductsFromDb();
        }
      },
    }
  )
);
