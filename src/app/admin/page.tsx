'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  ShieldCheck, LayoutDashboard, Users, PackageCheck, Scissors,
  TrendingUp, Search, Filter, CheckCircle2, XCircle,
  AlertTriangle, Eye, ArrowUpRight, Phone, Mail, MapPin, Building,
  Clock, Sun, Moon, ExternalLink, LogOut, Sparkles, Check, ChevronRight,
  ShoppingBag, ArrowRight, Star, RefreshCw, Loader2, Store, AlertCircle,
  Lock, KeyRound, Layers, BarChart3, Settings, ShieldAlert,
  EyeOff, Zap, ShoppingCart, Truck, CreditCard, Trash2, Download,
  SlidersHorizontal, CheckSquare, FileText, Wallet,
  MessageCircle, Copy, Save, PhoneCall, Send, X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import { getConciergeConfig, saveConciergeConfig, generateWhatsAppUrl, ConciergeConfig } from '@/lib/config/concierge';
import AdminCategoriesManager from '@/components/admin/AdminCategoriesManager';

const adminEditorialSlides = [
  {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
    title: 'Executive Platform Governance',
    subtitle: 'Master control for Nigerian brand verifications, catalog curation, and marketplace operations.',
    tag: 'Platform Control'
  },
  {
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop',
    title: 'Authentic Brand Assurance',
    subtitle: 'Verify genuine fashion houses and maintain top-tier craftsmanship standards across the platform.',
    tag: 'Brand Verification'
  },
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    title: 'Catalog Curation & Moderation',
    subtitle: 'Oversee ready-to-wear drops, boutique collections, and designer releases in real time.',
    tag: 'Catalog Moderation'
  }
];

// Vector App Logos
const InstagramLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-pink-500 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-cyan-400 fill-current" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.27 6.27 0 0 0 1.9-4.47V8.62a8.27 8.27 0 0 0 4.88 1.58V6.75c-.34-.01-.67-.03-1-.06z"/>
  </svg>
);

const SnapchatLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-amber-300 fill-current" viewBox="0 0 24 24">
    <path d="M12.002 2c-3.528 0-6.136 2.548-6.136 5.86 0 .894.227 1.83.67 2.66-.25.13-.538.258-.871.393-1.077.441-1.637.95-1.665 1.512-.03.585.503 1.135 1.583 1.635.035.016.07.032.106.048-.052.288-.13.722-.387 1.253-.332.684-.816 1.183-1.438 1.482-.676.326-.777.685-.758.895.03.328.375.568.995.692.658.132 1.458.118 2.327-.04.423-.077.873-.193 1.341-.334.422.56.985.939 1.688 1.132.846.232 1.745.244 2.545.035.801.21 1.7.198 2.546-.035.703-.193 1.266-.572 1.688-1.132.468.141.918.257 1.341.334.869.158 1.669.172 2.327.04.62-.124.965-.364.995-.692.019-.21-.082-.569-.758-.895-.622-.299-1.106-.798-1.438-1.482-.257-.531-.335-.965-.387-1.253.036-.016.071-.032.106-.048 1.08-.5 1.613-1.05 1.583-1.635-.028-.562-.588-1.071-1.665-1.512-.333-.135-.621-.263-.871-.393.443-.83.67-1.766.67-2.66 0-3.312-2.608-5.86-6.136-5.86z"/>
  </svg>
);

export default function SuperAdminPage() {
  const { theme, toggleTheme } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'logistics' | 'catalog' | 'categories' | 'approvals' | 'finance' | 'customers' | 'concierge'>('overview');

  // VIP Concierge Settings State
  const [conciergeConfig, setConciergeConfig] = useState<ConciergeConfig>(getConciergeConfig());
  const [conciergePhoneInput, setConciergePhoneInput] = useState(conciergeConfig.whatsappNumber);
  const [conciergeHoursInput, setConciergeHoursInput] = useState(conciergeConfig.businessHours);
  const [conciergeNameInput, setConciergeNameInput] = useState(conciergeConfig.advisorName);
  const [conciergeEnabled, setConciergeEnabled] = useState(conciergeConfig.isEnabled);
  const [copiedTemplateIdx, setCopiedTemplateIdx] = useState<number | null>(null);

  // Fetch live concierge settings from server API
  useEffect(() => {
    fetch('/api/concierge')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config) {
          setConciergeConfig(data.config);
          setConciergePhoneInput(data.config.whatsappNumber);
          setConciergeHoursInput(data.config.businessHours);
          setConciergeNameInput(data.config.advisorName);
          setConciergeEnabled(data.config.isEnabled);
        }
      })
      .catch(() => {});
  }, []);

  // Live Orders Data from DB
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStageFilter, setOrderStageFilter] = useState<'all' | 'escrow_secured' | 'packing' | 'dispatched' | 'delivered'>('all');
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null);

  // Live Products Data from DB
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null);

  // Live Vendors Data from DB
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [vendorSearch, setVendorSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Escrow Ledger Interactive State
  const [financeFilter, setFinanceFilter] = useState<'all' | 'locked' | 'settled'>('all');
  const [financeSearch, setFinanceSearch] = useState('');

  // Shopper Directory State
  const [shopperSearch, setShopperSearch] = useState('');
  const [selectedShopperModal, setSelectedShopperModal] = useState<any | null>(null);

  // Vendor Payouts & Settlement Modal State
  const [selectedVendorPayoutModal, setSelectedVendorPayoutModal] = useState<any | null>(null);
  const [vendorPayoutFilter, setVendorPayoutFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [vendorPayoutSearch, setVendorPayoutSearch] = useState('');

  // Logistics & Shipments Management State
  const [logisticsSearch, setLogisticsSearch] = useState('');
  const [logisticsMethodFilter, setLogisticsMethodFilter] = useState<'all' | 'doorstep' | 'park_pickup'>('all');
  const [logisticsStatusFilter, setLogisticsStatusFilter] = useState<'all' | 'pending' | 'ready_for_pickup' | 'picked_up' | 'delivered' | 'issue'>('all');
  const [logisticsCourierFilter, setLogisticsCourierFilter] = useState<'all' | 'gig' | 'fez' | 'redstar' | 'dhl' | 'park'>('all');
  const [editingShipment, setEditingShipment] = useState<any | null>(null);
  const [editCourierName, setEditCourierName] = useState('');
  const [editWaybillNumber, setEditWaybillNumber] = useState('');
  const [editPickupStatus, setEditPickupStatus] = useState('pending');
  const [editTrackingStage, setEditTrackingStage] = useState(1);
  const [editDeliveryIssue, setEditDeliveryIssue] = useState('');
  const [isSavingShipment, setIsSavingShipment] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [rejectionModalVendor, setRejectionModalVendor] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Auto-rotate editorial carousel on login
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adminEditorialSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Check saved session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('irisi_admin_auth') || localStorage.getItem('veyra_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch all orders from DB
  const fetchOrdersList = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders for admin:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch all products from DB
  const fetchProductsList = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products for admin:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Fetch all vendors from DB
  const fetchVendorsList = useCallback(async () => {
    try {
      setIsLoadingVendors(true);
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      if (res.ok && data.success) {
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error('Failed to fetch vendors for admin:', err);
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  // Refresh all data when authenticated
  const refreshAllData = useCallback(() => {
    fetchOrdersList();
    fetchProductsList();
    fetchVendorsList();
  }, [fetchOrdersList, fetchProductsList, fetchVendorsList]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('irisi_admin_auth', 'true');
        }
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });
      } else {
        setAuthError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('irisi_admin_auth');
      localStorage.removeItem('veyra_admin_auth');
    }
  };

  // ORDER ACTIONS: Release Escrow (once delivered or verified)
  const handleReleaseEscrow = async (orderId: string) => {
    if (!confirm('Are you sure you want to release escrow funds for this order to the vendor?')) return;
    try {
      setActionLoadingId(orderId);
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, releaseEscrow: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Escrow released for order ${orderId}! Vendor payout recorded.`);
        await fetchOrdersList();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error releasing escrow:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to permanently delete order ${orderId}?`)) return;
    try {
      setActionLoadingId(orderId);
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Order ${orderId} deleted successfully.`);
        await fetchOrdersList();
        if (selectedOrderModal?.id === orderId) setSelectedOrderModal(null);
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // PRODUCT ACTIONS
  const handleToggleProductFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      setActionLoadingId(productId);
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, isFeatured: !currentFeatured })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(currentFeatured ? 'Product removed from homepage showcase' : 'Product highlighted on homepage lookbook!');
        await fetchProductsList();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error toggling featured product:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to remove "${productName}" from the marketplace?`)) return;
    try {
      setActionLoadingId(productId);
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Product "${productName}" removed from catalog.`);
        await fetchProductsList();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // VENDOR ACTIONS
  const handleApproveBrand = async (vendorId: string) => {
    try {
      setActionLoadingId(vendorId);
      const res = await fetch('/api/admin/vendors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action: 'approve' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Brand "${vendorId}" approved and verified live!`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#ffffff', '#e6c367']
        });
        await fetchVendorsList();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error approving brand:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalVendor) return;

    try {
      setActionLoadingId(rejectionModalVendor.id);
      const res = await fetch('/api/admin/vendors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: rejectionModalVendor.id,
          action: 'reject',
          rejectionReason: rejectionReasonInput || 'Store profile information requires revision.'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Brand "${rejectionModalVendor.name}" returned for correction.`);
        setRejectionModalVendor(null);
        setRejectionReasonInput('');
        await fetchVendorsList();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error rejecting brand:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Derived Financial Calculations directly from real database orders
  const financialStats = useMemo(() => {
    const totalGMV = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.trackingStage >= 4);
    const settledPayouts = completedOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
    const escrowLocked = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const platformCommission = Math.round(totalGMV * 0.10); // 10% marketplace fee
    const avgOrderValue = orders.length > 0 ? Math.round(totalGMV / orders.length) : 0;

    return {
      totalGMV,
      settledPayouts,
      escrowLocked,
      platformCommission,
      avgOrderValue,
      totalOrdersCount: orders.length
    };
  }, [orders]);

  // Derived Vendor Escrow Balances Breakdown with Itemized Orders
  const vendorEscrowBreakdown = useMemo(() => {
    const map = new Map<string, {
      vendorId: string;
      vendorName: string;
      totalSales: number;
      pendingEscrow: number;
      settledPayouts: number;
      ordersCount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
      itemsSold: Array<{
        orderId: string;
        orderNumber: string;
        date: string;
        customerName: string;
        customerCity: string;
        productName: string;
        size: string;
        price: number;
        quantity: number;
        payoutAmount: number;
        platformFee: number;
        isDelivered: boolean;
        status: string;
      }>;
    }>();

    orders.forEach((ord) => {
      const isDelivered = ord.status === 'delivered' || ord.trackingStage >= 4;
      (ord.items || []).forEach((item: any) => {
        const vId = (item.vendorId || item.vendor_id || 'vendor').toLowerCase();
        const vName = item.vendorName || vId.toUpperCase();
        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
        const payoutAmount = itemTotal * 0.9;
        const platformFee = itemTotal * 0.1;

        const matchedVendor = vendors.find(v => v.id === vId || (v.name && v.name.toLowerCase() === vName.toLowerCase()));

        const itemRecord = {
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          date: ord.date || ord.createdAt,
          customerName: ord.customerName,
          customerCity: ord.deliveryCity || 'Lagos',
          productName: item.productName || 'Garment',
          size: item.size || 'M',
          price: itemTotal,
          quantity: Number(item.quantity || 1),
          payoutAmount,
          platformFee,
          isDelivered,
          status: ord.status,
        };

        if (!map.has(vId)) {
          map.set(vId, {
            vendorId: vId,
            vendorName: vName,
            totalSales: itemTotal,
            pendingEscrow: isDelivered ? 0 : payoutAmount,
            settledPayouts: isDelivered ? payoutAmount : 0,
            ordersCount: 1,
            bankName: matchedVendor?.bankName || 'Verified Bank',
            accountNumber: matchedVendor?.accountNumber || '0123456789',
            accountName: matchedVendor?.accountName || vName,
            itemsSold: [itemRecord],
          });
        } else {
          const rec = map.get(vId)!;
          rec.totalSales += itemTotal;
          if (isDelivered) {
            rec.settledPayouts += payoutAmount;
          } else {
            rec.pendingEscrow += payoutAmount;
          }
          rec.ordersCount += 1;
          rec.itemsSold.push(itemRecord);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [orders, vendors]);

  // Derived Unique Customers Directory from real database orders with full order history
  const customersList = useMemo(() => {
    const customerMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      city: string;
      state: string;
      ordersCount: number;
      totalSpend: number;
      lastOrderDate: string;
      orders: any[];
    }>();

    orders.forEach((ord) => {
      const emailKey = (ord.customerEmail || ord.customerPhone || 'unknown').toLowerCase().trim();
      const spend = Number(ord.totalAmount || 0);

      if (!customerMap.has(emailKey)) {
        customerMap.set(emailKey, {
          name: ord.customerName || 'Shopper',
          email: ord.customerEmail || 'N/A',
          phone: ord.customerPhone || 'N/A',
          city: ord.deliveryCity || 'Lagos',
          state: ord.deliveryState || '',
          ordersCount: 1,
          totalSpend: spend,
          lastOrderDate: ord.date || ord.createdAt || 'Recent',
          orders: [ord],
        });
      } else {
        const existing = customerMap.get(emailKey)!;
        existing.ordersCount += 1;
        existing.totalSpend += spend;
        existing.orders.push(ord);
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  // Filtered Shoppers
  const filteredShoppers = useMemo(() => {
    return customersList.filter(c => {
      const q = shopperSearch.toLowerCase().trim();
      return !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q);
    });
  }, [customersList, shopperSearch]);

  // Filtered Vendor Payouts
  const filteredVendorsPayout = useMemo(() => {
    return vendorEscrowBreakdown.filter(v => {
      const q = vendorPayoutSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        v.vendorName.toLowerCase().includes(q) ||
        v.bankName.toLowerCase().includes(q) ||
        v.accountNumber.includes(q);

      let matchesFilter = true;
      if (vendorPayoutFilter === 'pending') matchesFilter = v.pendingEscrow > 0;
      if (vendorPayoutFilter === 'settled') matchesFilter = v.settledPayouts > 0;

      return matchesSearch && matchesFilter;
    });
  }, [vendorEscrowBreakdown, vendorPayoutSearch, vendorPayoutFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = orderSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').toLowerCase().includes(q);

      let matchesStage = true;
      if (orderStageFilter !== 'all') {
        matchesStage = o.status === orderStageFilter || (orderStageFilter === 'delivered' && o.trackingStage >= 4);
      }

      return matchesSearch && matchesStage;
    });
  }, [orders, orderSearch, orderStageFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = productSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.vendorName || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);

      let matchesCat = true;
      if (productCategoryFilter !== 'all') {
        matchesCat = (p.category || '').toLowerCase() === productCategoryFilter.toLowerCase();
      }

      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const q = vendorSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.designerName || '').toLowerCase().includes(q) ||
        (v.location || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q);

      let matchesFilter = true;
      if (approvalFilter === 'pending') matchesFilter = v.approvalStatus === 'pending' || !v.isVerified;
      if (approvalFilter === 'approved') matchesFilter = v.approvalStatus === 'approved' || v.isVerified;
      if (approvalFilter === 'rejected') matchesFilter = v.approvalStatus === 'rejected';

      return matchesSearch && matchesFilter;
    });
  }, [vendors, vendorSearch, approvalFilter]);

  // Filtered Finance Ledger
  const filteredLedger = useMemo(() => {
    return orders.filter(ord => {
      const q = financeSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        (ord.orderNumber || '').toLowerCase().includes(q) ||
        (ord.customerName || '').toLowerCase().includes(q);

      let matchesFilter = true;
      if (financeFilter === 'locked') matchesFilter = ord.status !== 'delivered' && ord.status !== 'cancelled';
      if (financeFilter === 'settled') matchesFilter = ord.status === 'delivered' || ord.trackingStage >= 4;

      return matchesSearch && matchesFilter;
    });
  }, [orders, financeSearch, financeFilter]);

  // Category product counters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = (p.category || 'other').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const pendingCount = vendors.filter(v => v.approvalStatus === 'pending' || !v.isVerified).length;
  const approvedCount = vendors.filter(v => v.approvalStatus === 'approved' || v.isVerified).length;

  // Derived multi-vendor shipments list
  const allShipments = useMemo(() => {
    const list: Array<{
      orderId: string;
      orderNumber: string;
      orderDate: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      deliveryAddress: string;
      deliveryCity: string;
      deliveryState: string;
      deliveryMethod: string;
      vendorId: string;
      vendorName: string;
      vendorLocation: string;
      serviceabilityType: 'pickup' | 'dropoff';
      items: any[];
      courierName: string;
      waybillNumber: string;
      pickupStatus: string;
      trackingStage: number;
      status: string;
      packageWeightKg: number;
      packageDimensions: string;
      dropoffStation: string;
      shippingFee: number;
      deliveryIssue?: string;
    }> = [];

    orders.forEach((ord) => {
      const vPkgs = ord.vendorPackages || ord.customer_measurements?.vendorPackages || {};
      const itemsByVendor = new Map<string, any[]>();
      (ord.items || []).forEach((it: any) => {
        const vId = (it.vendorId || it.vendor_id || 'vendor').toLowerCase().trim();
        if (!itemsByVendor.has(vId)) itemsByVendor.set(vId, []);
        itemsByVendor.get(vId)!.push(it);
      });

      if (Object.keys(vPkgs).length > 0) {
        Object.entries(vPkgs).forEach(([vId, pkg]: [string, any]) => {
          const matchedVendor = vendors.find(v => v.id === vId || (v.name && v.name.toLowerCase() === vId.toLowerCase()));
          const items = itemsByVendor.get(vId) || [];
          list.push({
            orderId: ord.id,
            orderNumber: ord.orderNumber,
            orderDate: ord.date || ord.createdAt,
            customerName: ord.customerName || 'Shopper',
            customerPhone: ord.customerPhone || 'N/A',
            customerEmail: ord.customerEmail || 'N/A',
            deliveryAddress: ord.deliveryAddress || 'N/A',
            deliveryCity: ord.deliveryCity || 'Lagos',
            deliveryState: ord.deliveryState || '',
            deliveryMethod: pkg.deliveryMethod || ord.deliveryMethod || 'doorstep',
            vendorId: vId,
            vendorName: pkg.vendorName || matchedVendor?.name || vId.toUpperCase(),
            vendorLocation: matchedVendor?.location || 'Lagos, Nigeria',
            serviceabilityType: pkg.serviceabilityType || (pkg.dropoffStation && pkg.deliveryMethod !== 'park_pickup' ? 'dropoff' : 'pickup'),
            items,
            courierName: pkg.courierName || (pkg.deliveryMethod === 'park_pickup' ? 'Motor Park Bus Waybill' : 'GIG Logistics Express'),
            waybillNumber: pkg.waybillNumber || pkg.trackingNumber || '',
            pickupStatus: pkg.pickupStatus || (pkg.trackingStage >= 3 ? 'picked_up' : pkg.trackingStage === 2 ? 'ready_for_pickup' : 'pending'),
            trackingStage: pkg.trackingStage !== undefined ? Number(pkg.trackingStage) : 1,
            status: pkg.status || ord.status || 'escrow_secured',
            packageWeightKg: pkg.packageWeightKg || 1.1,
            packageDimensions: pkg.packageDimensions || '35×25×6cm',
            dropoffStation: pkg.dropoffStation || pkg.selectedParkTerminal || '',
            shippingFee: pkg.shippingFee || ord.shippingFee || 0,
            deliveryIssue: pkg.deliveryIssue || ord.deliveryIssue,
          });
        });
      } else {
        itemsByVendor.forEach((items, vId) => {
          const matchedVendor = vendors.find(v => v.id === vId || (v.name && v.name.toLowerCase() === vId.toLowerCase()));
          list.push({
            orderId: ord.id,
            orderNumber: ord.orderNumber,
            orderDate: ord.date || ord.createdAt,
            customerName: ord.customerName || 'Shopper',
            customerPhone: ord.customerPhone || 'N/A',
            customerEmail: ord.customerEmail || 'N/A',
            deliveryAddress: ord.deliveryAddress || 'N/A',
            deliveryCity: ord.deliveryCity || 'Lagos',
            deliveryState: ord.deliveryState || '',
            deliveryMethod: ord.deliveryMethod || 'doorstep',
            vendorId: vId,
            vendorName: matchedVendor?.name || vId.toUpperCase(),
            vendorLocation: matchedVendor?.location || 'Lagos, Nigeria',
            serviceabilityType: 'pickup',
            items,
            courierName: 'GIG Logistics Express',
            waybillNumber: ord.trackingNumber || '',
            pickupStatus: ord.trackingStage >= 3 ? 'picked_up' : ord.trackingStage === 2 ? 'ready_for_pickup' : 'pending',
            trackingStage: ord.trackingStage !== undefined ? Number(ord.trackingStage) : 1,
            status: ord.status || 'escrow_secured',
            packageWeightKg: 1.1,
            packageDimensions: '35×25×6cm',
            dropoffStation: '',
            shippingFee: ord.shippingFee || 0,
            deliveryIssue: ord.deliveryIssue,
          });
        });
      }
    });

    return list;
  }, [orders, vendors]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return allShipments.filter((s) => {
      const q = logisticsSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        s.orderNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.vendorName.toLowerCase().includes(q) ||
        s.deliveryCity.toLowerCase().includes(q) ||
        s.waybillNumber.toLowerCase().includes(q) ||
        s.courierName.toLowerCase().includes(q);

      let matchesMethod = true;
      if (logisticsMethodFilter !== 'all') {
        matchesMethod = s.deliveryMethod === logisticsMethodFilter;
      }

      let matchesStatus = true;
      if (logisticsStatusFilter === 'pending') {
        matchesStatus = s.pickupStatus === 'pending' && s.trackingStage < 2;
      } else if (logisticsStatusFilter === 'ready_for_pickup') {
        matchesStatus = s.pickupStatus === 'ready_for_pickup' || s.trackingStage === 2;
      } else if (logisticsStatusFilter === 'picked_up') {
        matchesStatus = s.trackingStage === 3 || s.pickupStatus === 'picked_up';
      } else if (logisticsStatusFilter === 'delivered') {
        matchesStatus = s.trackingStage >= 4 || s.status === 'delivered';
      } else if (logisticsStatusFilter === 'issue') {
        matchesStatus = Boolean(s.deliveryIssue);
      }

      let matchesCourier = true;
      if (logisticsCourierFilter === 'gig') matchesCourier = s.courierName.toLowerCase().includes('gig');
      else if (logisticsCourierFilter === 'fez') matchesCourier = s.courierName.toLowerCase().includes('fez');
      else if (logisticsCourierFilter === 'redstar') matchesCourier = s.courierName.toLowerCase().includes('red star');
      else if (logisticsCourierFilter === 'dhl') matchesCourier = s.courierName.toLowerCase().includes('dhl');
      else if (logisticsCourierFilter === 'park') matchesCourier = s.deliveryMethod === 'park_pickup' || s.courierName.toLowerCase().includes('park');

      return matchesSearch && matchesMethod && matchesStatus && matchesCourier;
    });
  }, [allShipments, logisticsSearch, logisticsMethodFilter, logisticsStatusFilter, logisticsCourierFilter]);

  // Logistics KPI counts
  const pendingShipmentsCount = allShipments.filter(s => s.trackingStage < 3 && s.status !== 'delivered').length;
  const doorstepShipmentsCount = allShipments.filter(s => s.deliveryMethod !== 'park_pickup').length;
  const parkShipmentsCount = allShipments.filter(s => s.deliveryMethod === 'park_pickup').length;
  const deliveryIssuesCount = allShipments.filter(s => Boolean(s.deliveryIssue)).length;
  const totalShippingFeesPool = orders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

  const handleOpenEditShipment = (shipment: any) => {
    setEditingShipment(shipment);
    setEditCourierName(shipment.courierName || 'GIG Logistics Express');
    setEditWaybillNumber(shipment.waybillNumber || '');
    setEditPickupStatus(shipment.pickupStatus || 'pending');
    setEditTrackingStage(shipment.trackingStage !== undefined ? Number(shipment.trackingStage) : 1);
    setEditDeliveryIssue(shipment.deliveryIssue || '');
  };

  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    setIsSavingShipment(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: editingShipment.orderNumber,
          vendorId: editingShipment.vendorId,
          courierName: editCourierName,
          waybillNumber: editWaybillNumber,
          pickupStatus: editPickupStatus,
          trackingStage: Number(editTrackingStage),
          status: Number(editTrackingStage) >= 4 ? 'delivered' : Number(editTrackingStage) === 3 ? 'dispatched' : Number(editTrackingStage) === 2 ? 'packing' : 'escrow_secured',
          deliveryIssue: editDeliveryIssue.trim() || undefined,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(`Shipment ${editingShipment.orderNumber} for ${editingShipment.vendorName} updated successfully.`);
        setEditingShipment(null);
        await fetchOrdersList();
      } else {
        alert(data.error || 'Failed to update shipment');
      }
    } catch (err) {
      console.error('Error saving shipment:', err);
      alert('Network error updating shipment');
    } finally {
      setIsSavingShipment(false);
    }
  };

  const handleQuickAdvanceShipment = async (shipment: any, nextStage: number) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: shipment.orderNumber,
          vendorId: shipment.vendorId,
          trackingStage: nextStage,
          pickupStatus: nextStage >= 3 ? 'picked_up' : nextStage === 2 ? 'ready_for_pickup' : 'pending',
          status: nextStage >= 4 ? 'delivered' : nextStage === 3 ? 'dispatched' : nextStage === 2 ? 'packing' : 'escrow_secured',
        })
      });
      if (res.ok) {
        setActionSuccessMsg(`Updated shipment for ${shipment.vendorName} to Stage ${nextStage}.`);
        await fetchOrdersList();
      }
    } catch (e) {
      console.error('Error advancing shipment:', e);
    }
  };

  // Navigation Items
  const navItems = [
    {
      id: 'overview',
      label: 'Executive HUD',
      icon: LayoutDashboard,
    },
    {
      id: 'orders',
      label: 'Customer Orders',
      icon: ShoppingCart,
      badge: orders.length > 0 ? `${orders.length}` : null,
      badgeColor: 'bg-[var(--gold-accent)] text-black font-bold'
    },
    {
      id: 'logistics',
      label: 'Shipments & Logistics',
      icon: Truck,
      badge: allShipments.length > 0 ? `${allShipments.length}` : null,
      badgeColor: 'bg-emerald-500 text-black font-bold'
    },
    {
      id: 'catalog',
      label: 'Catalog Moderation',
      icon: ShoppingBag,
      badge: `${products.length}`
    },
    {
      id: 'categories',
      label: 'Categories Manager',
      icon: Layers,
    },
    {
      id: 'approvals',
      label: 'Brand Governance',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? `${pendingCount} Pending` : null,
      badgeColor: 'bg-amber-500 text-black font-bold'
    },
    {
      id: 'finance',
      label: 'Escrow & Treasury',
      icon: Wallet,
    },
    {
      id: 'customers',
      label: 'Shoppers Directory',
      icon: Users,
      badge: `${customersList.length}`
    },
    {
      id: 'concierge',
      label: 'WhatsApp Concierge',
      icon: MessageCircle,
      badge: conciergeConfig.isEnabled ? 'Live' : 'Off',
      badgeColor: conciergeConfig.isEnabled ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-500 text-white font-bold'
    },
  ];

  // ========================================================
  // 1. LOGIN GATEWAY (UNAUTHENTICATED)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
        
        {/* Left Column: Sticky Editorial Slideshow */}
        <div className="relative w-full lg:w-1/2 h-[340px] lg:h-screen lg:sticky lg:top-0 shrink-0 overflow-hidden flex flex-col justify-between p-6 lg:p-12 bg-black select-none z-10">
          {adminEditorialSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentSlide === idx ? 'opacity-70 scale-105 transition-transform duration-[6000ms]' : 'opacity-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                unoptimized
                priority={idx === 0}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            </div>
          ))}

          <div className="relative z-20 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-editorial text-2xl font-bold tracking-[0.26em] text-white group-hover:text-[var(--gold-accent)] transition-colors">
                Ì R Í S Í
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                suppressHydrationWarning
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {mounted ? (
                  theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-300" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </button>
              <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-widest font-bold backdrop-blur-md">
                {adminEditorialSlides[currentSlide].tag}
              </span>
            </div>
          </div>

          <div className="relative z-20 space-y-6 mt-auto">
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-2">
                {adminEditorialSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      currentSlide === idx ? 'w-8 bg-[var(--gold-accent)]' : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-1.5">
                <h2 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight">
                  {adminEditorialSlides[currentSlide].title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  {adminEditorialSlides[currentSlide].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono-luxury text-zinc-400 border-t border-white/10 pt-4">
              <span>EXECUTIVE GOVERNANCE SUITE</span>
              <span>SUPER ADMIN COMMAND</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto min-h-screen">
          <div className="w-full max-w-md space-y-6 animate-fadeIn py-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                  Executive Security Gateway
                </span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Super Admin Login
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                Enter your authorized executive credentials to access complete platform operations, orders, catalog, and escrow treasury.
              </p>
            </div>

            {authError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Executive Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourstore.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-30 select-none rounded-lg active:scale-95"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold hover:bg-[#d8b357] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Authority...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Access Command Center</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
              <Link href="/" className="text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Return to Ìrísí Home
              </Link>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // ========================================================
  // 2. AUTHENTICATED SUPER ADMIN CONTROL TOWER
  // ========================================================
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex flex-col">
      
      {/* TOP EXECUTIVE HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-6 sm:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-2xl font-bold tracking-[0.26em] text-[var(--text-primary)]">
              Ì R Í S Í
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono-luxury uppercase font-bold tracking-widest">
              SUPER ADMIN
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[var(--text-primary)]">Platform Command Live</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAllData}
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Refresh All Database Records"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingOrders || isLoadingProducts || isLoadingVendors ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/shop"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] transition-all"
          >
            <span>Live Store</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          </Link>

          <button
            onClick={toggleTheme}
            suppressHydrationWarning
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-300" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Lock Session"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-mono-luxury font-bold">Lock Session</span>
          </button>
        </div>
      </header>

      {/* BODY SHELL */}
      <div className="flex-1 flex">
        
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="w-64 lg:w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 flex flex-col justify-between p-4 sm:p-6 shrink-0 hidden md:flex sticky top-[65px] h-[calc(100vh-65px)] self-start overflow-y-auto">
          <div className="space-y-6">
            
            {/* Executive Badge Card */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--gold-accent)]/15 text-[var(--gold-accent)] flex items-center justify-center font-editorial font-bold text-lg shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-[var(--text-primary)] truncate font-editorial">
                    Executive Control
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono-luxury truncate">
                    Platform Governance
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono-luxury">
                <span className="text-[var(--text-muted)]">System Status:</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5 font-mono-luxury text-xs uppercase tracking-wider">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-left cursor-pointer ${
                      isActive
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'text-[var(--gold-accent)]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                        isActive ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' : item.badgeColor || 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-muted)] space-y-1">
            <div className="flex items-center justify-between">
              <span>Platform Mode:</span>
              <strong className="text-[var(--gold-accent)]">Production Live</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Escrow Status:</span>
              <strong className="text-emerald-500">Secured</strong>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full min-w-0 pb-28">
          
          {/* Action Success Banner */}
          {actionSuccessMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg('')} className="text-xs hover:underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: EXECUTIVE HUD OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  Platform Command Center
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                  Real-time live monitoring of marketplace transactions, brand verifications, catalog size, and escrow status.
                </p>
              </div>

              {/* 5 Master KPI Metric Tiles - ALL CLICKABLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. GMV -> Takes to Finance */}
                <button
                  onClick={() => setActiveTab('finance')}
                  className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all space-y-2 text-left cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Gross Sales (GMV)</span>
                    <TrendingUp className="h-4 w-4 text-[var(--gold-accent)] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--gold-accent)]">
                    ₦{financialStats.totalGMV.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-emerald-500 font-bold flex items-center justify-between">
                    <span>{orders.length} total orders</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-[var(--gold-accent)]" />
                  </div>
                </button>

                {/* 2. Escrow Locked -> Takes to Finance */}
                <button
                  onClick={() => { setFinanceFilter('locked'); setActiveTab('finance'); }}
                  className="p-6 rounded-3xl surface-card border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50 transition-all space-y-2 text-left cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Escrow Locked</span>
                    <Lock className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-amber-400">
                    ₦{financialStats.escrowLocked.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] flex items-center justify-between">
                    <span>Pending delivery</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-amber-400" />
                  </div>
                </button>

                {/* 3. Settled to Brands -> Takes to Finance */}
                <button
                  onClick={() => { setFinanceFilter('settled'); setActiveTab('finance'); }}
                  className="p-6 rounded-3xl surface-card border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 transition-all space-y-2 text-left cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Settled Payouts</span>
                    <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-400">
                    ₦{financialStats.settledPayouts.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] flex items-center justify-between">
                    <span>Delivered orders</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-emerald-400" />
                  </div>
                </button>

                {/* 4. Total Catalog Items -> Takes to Catalog */}
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all space-y-2 text-left cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Total Catalog</span>
                    <ShoppingBag className="h-4 w-4 text-[var(--gold-accent)] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                    {products.length}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold flex items-center justify-between">
                    <span>Live Garments</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-[var(--gold-accent)]" />
                  </div>
                </button>

                {/* 5. Verified Designers -> Takes to Approvals */}
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all space-y-2 text-left cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Verified Brands</span>
                    <Store className="h-4 w-4 text-[var(--gold-accent)] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                    {approvedCount}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-amber-400 font-bold flex items-center justify-between">
                    <span>{pendingCount} pending review</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-amber-400" />
                  </div>
                </button>

              </div>

              {/* Recent Orders Ticker - Clickable Rows */}
              <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                      Recent Marketplace Orders
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)] font-mono-luxury">
                      Click on any order to open its complete receipt dossier
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All ({orders.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
                    No orders recorded yet. Complete a checkout to see live records here.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrderModal(ord)}
                        className="py-3 px-2 rounded-xl hover:bg-[var(--bg-surface)] transition-all flex items-center justify-between gap-4 text-xs font-mono-luxury flex-wrap cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)] opacity-60" />
                          <div>
                            <strong className="text-[var(--text-primary)]">{ord.orderNumber}</strong>
                            <span className="text-[var(--text-muted)] ml-2">
                              • {ord.customerName} ({ord.deliveryCity}{ord.deliveryState ? `, ${ord.deliveryState}` : ''})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[var(--gold-accent)] font-bold">₦{Number(ord.totalAmount || 0).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                            ord.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {ord.status || 'Escrow Secured'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LIVE CUSTOMER ORDERS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                    Customer Orders Management
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Inspect every customer order, verify destination address, view courier tracking, or release escrow payouts.
                  </p>
                </div>

                <button
                  onClick={fetchOrdersList}
                  className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['all', 'escrow_secured', 'packing', 'dispatched', 'delivered'] as const).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setOrderStageFilter(stage)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                        orderStageFilter === stage
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {stage.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[280px]">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order #, customer, email, phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              {/* Orders Table */}
              {isLoadingOrders ? (
                <LuxuryLoader
                  fullScreen={false}
                  label="Ì R Í S Í"
                  sublabel="Loading Live Orders from Database..."
                />
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center surface-card rounded-3xl border border-[var(--border-subtle)] space-y-3">
                  <ShoppingCart className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    No orders matching your criteria
                  </h3>
                  <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                    Try switching your search keywords or filter stages above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => {
                    const isDelivered = ord.status === 'delivered' || ord.trackingStage >= 4;
                    const isActioning = actionLoadingId === ord.id;

                    return (
                      <div
                        key={ord.id}
                        className="p-5 sm:p-6 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/40 transition-all space-y-4 shadow-sm"
                      >
                        {/* Top Line */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                              {ord.orderNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase ${
                              isDelivered
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                            }`}>
                              ● {ord.status || 'Escrow Secured'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono-luxury">
                            <span className="text-[var(--text-muted)]">{ord.date || ord.createdAt}</span>
                            <span className="text-[var(--gold-accent)] text-base font-bold">₦{Number(ord.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Customer & Delivery Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-luxury text-[var(--text-secondary)]">
                          <div>
                            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Customer:</span>
                            <strong className="text-[var(--text-primary)]">{ord.customerName}</strong>
                            <div className="text-[11px] text-[var(--text-muted)]">{ord.customerPhone}</div>
                            <div className="text-[11px] text-[var(--text-muted)] truncate">{ord.customerEmail}</div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Delivery Destination:</span>
                            <strong className="text-[var(--text-primary)]">{ord.deliveryAddress}</strong>
                            <div className="text-[11px] text-[var(--gold-accent)] font-bold">
                              City: {ord.deliveryCity || 'Lagos'}{ord.deliveryState ? ` • State: ${ord.deliveryState}` : ''}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Fulfillment / Courier:</span>
                            <strong className="text-emerald-400">{ord.trackingDetails?.courierName || 'Shipbubble Live Dispatch'}</strong>
                            <div className="text-[11px] text-[var(--text-muted)]">Waybill: {ord.trackingDetails?.waybillNumber || 'Assigned on dispatch'}</div>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="pt-2 flex items-center gap-3 overflow-x-auto pb-1">
                          {(ord.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0">
                              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-black shrink-0">
                                <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt="" fill unoptimized className="object-cover" />
                              </div>
                              <div className="text-[11px] font-mono-luxury min-w-[120px]">
                                <div className="font-bold text-[var(--text-primary)] truncate">{item.productName}</div>
                                <div className="text-[var(--text-muted)]">{item.size} • ₦{Number(item.price).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Status Display & Super Admin Payout Release */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                          
                          {/* Current Fulfillment Stage Display */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">Fulfillment Stage:</span>
                            <span className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury font-bold text-[var(--gold-accent)] uppercase">
                              {ord.trackingStage >= 4 ? 'Stage 4: Delivered to Customer' : ord.trackingStage === 3 ? 'Stage 3: Dispatched via Courier' : ord.trackingStage === 2 ? 'Stage 2: Vendor Packaging' : 'Stage 1: Awaiting Vendor Dispatch'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isDelivered && (
                              <button
                                onClick={() => handleReleaseEscrow(ord.id)}
                                disabled={isActioning}
                                className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-mono-luxury uppercase font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>Release Escrow Payout</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedOrderModal(ord)}
                              className="px-3 py-1.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                              <span>Full Receipt</span>
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              disabled={isActioning}
                              className="p-1.5 rounded-xl border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete Order Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: SHIPMENTS & LOGISTICS DISPATCH HUB */}
          {/* ======================================================== */}
          {activeTab === 'logistics' && (
            <div className="space-y-6 animate-fadeIn">

              {/* Logistics Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                      Shipments & Logistics Control
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury font-bold uppercase">
                      {allShipments.length} Active Shipments
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury font-bold uppercase">
                      Shipbubble Live + Courier Fallback
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Manage multi-vendor door pickups, interstate motor park hubs, waybills, and delivery exceptions across all 36 states.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchOrdersList}
                    className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh Shipments</span>
                  </button>
                </div>
              </div>

              {/* 5 Master Logistics KPI Metric Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Total Shipments */}
                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Total Shipments</span>
                    <Truck className="h-4 w-4 text-[var(--gold-accent)]" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--gold-accent)]">
                    {allShipments.length}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                    {doorstepShipmentsCount} Doorstep · {parkShipmentsCount} Motor Park
                  </div>
                </div>

                {/* 2. Pending Pickups */}
                <div className="p-6 rounded-3xl surface-card border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Pending Pickups</span>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-amber-400">
                    {pendingShipmentsCount}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    Awaiting vendor pack or dispatch
                  </div>
                </div>

                {/* 3. Active Couriers */}
                <div className="p-6 rounded-3xl surface-card border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Courier Network</span>
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-blue-400">
                    6 Couriers
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] truncate">
                    GIG, Fez, Red Star, DHL, Parks
                  </div>
                </div>

                {/* 4. Shipping Fees Escrow */}
                <div className="p-6 rounded-3xl surface-card border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Shipping Fees Pool</span>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-400">
                    ₦{totalShippingFeesPool.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    Collected via Paystack checkout
                  </div>
                </div>

                {/* 5. Delivery Issues */}
                <div className={`p-6 rounded-3xl surface-card border space-y-2 ${
                  deliveryIssuesCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-[var(--border-subtle)]'
                }`}>
                  <div className="flex items-center justify-between text-rose-400">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Delivery Issues</span>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="font-editorial text-2xl sm:text-3xl font-bold text-rose-400">
                    {deliveryIssuesCount}
                  </div>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    {deliveryIssuesCount > 0 ? 'Action required by admin' : 'All delivery routes clean'}
                  </div>
                </div>

              </div>

              {/* Serviceability & Routing Advisory Banner */}
              <div className="p-4 sm:p-5 rounded-3xl surface-card border border-[var(--gold-accent)]/20 bg-[var(--gold-accent)]/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono-luxury">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <strong className="text-[var(--text-primary)] uppercase">Atelier Serviceability Protocol:</strong>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed max-w-3xl">
                    Door pickup couriers (GIG Logistics, Fez Delivery, DHL) directly collect from vendor ateliers in Lagos, Abuja, Port Harcourt, and major state capitals. If an atelier is in a regional town without direct doorstep pickup, ÌRÍSÍ automatically routes the shipment for <strong>Station Drop-off</strong> or <strong>Motor Park Hub</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    Doorstep: ₦4,500+
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    Park Hub: ₦2,200
                  </span>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={logisticsSearch}
                      onChange={(e) => setLogisticsSearch(e.target.value)}
                      placeholder="Search order ref, customer, vendor, waybill, or city..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                    />
                  </div>

                  {/* Courier select filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold shrink-0">Courier:</span>
                    <select
                      value={logisticsCourierFilter}
                      onChange={(e) => setLogisticsCourierFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    >
                      <option value="all">All Couriers (6)</option>
                      <option value="gig">GIG Logistics</option>
                      <option value="fez">Fez Delivery</option>
                      <option value="redstar">Red Star Express</option>
                      <option value="dhl">DHL Express</option>
                      <option value="park">Motor Park Bus Waybill</option>
                    </select>
                  </div>

                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  
                  {/* Method Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold mr-1">Method:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'doorstep', label: 'Doorstep Delivery' },
                      { id: 'park_pickup', label: 'Motor Park Hub' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setLogisticsMethodFilter(m.id as any)}
                        className={`px-3 py-1 rounded-full text-xs font-mono-luxury font-bold uppercase transition-all cursor-pointer ${
                          logisticsMethodFilter === m.id
                            ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold mr-1">Status:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'ready_for_pickup', label: 'Ready for Pickup' },
                      { id: 'picked_up', label: 'In Transit' },
                      { id: 'delivered', label: 'Delivered' },
                      { id: 'issue', label: 'Issues' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setLogisticsStatusFilter(st.id as any)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono-luxury font-bold uppercase transition-all cursor-pointer ${
                          logisticsStatusFilter === st.id
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* Shipments List */}
              {filteredShipments.length === 0 ? (
                <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3">
                  <Truck className="h-10 w-10 text-[var(--text-muted)] mx-auto" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    No Shipments Found
                  </h3>
                  <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-sm mx-auto">
                    No shipments match the selected filters. Clear your search or change criteria to view order dispatches.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredShipments.map((s, sIdx) => {
                    const isDelivered = s.trackingStage >= 4 || s.status === 'delivered';
                    const isInTransit = s.trackingStage === 3 || s.pickupStatus === 'picked_up';
                    const isReady = s.trackingStage === 2 || s.pickupStatus === 'ready_for_pickup';
                    const isParkPickup = s.deliveryMethod === 'park_pickup';

                    return (
                      <div
                        key={`${s.orderId}-${s.vendorId}-${sIdx}`}
                        className={`p-5 sm:p-6 rounded-3xl surface-card border transition-all space-y-4 shadow-sm hover:shadow-md ${
                          s.deliveryIssue
                            ? 'border-rose-500/50 bg-rose-500/[0.02]'
                            : isDelivered
                            ? 'border-emerald-500/40 bg-emerald-500/[0.01]'
                            : isInTransit
                            ? 'border-[var(--gold-accent)]/50'
                            : 'border-[var(--border-subtle)]'
                        }`}
                      >
                        {/* Top Line: Order Ref & Status Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => {
                                const ordMatch = orders.find(o => o.id === s.orderId);
                                if (ordMatch) setSelectedOrderModal(ordMatch);
                              }}
                              className="font-editorial text-xl font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] transition-colors cursor-pointer"
                            >
                              {s.orderNumber}
                            </button>

                            {/* Delivery Method Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase flex items-center gap-1 ${
                              isParkPickup
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              <Truck className="h-3 w-3" />
                              <span>{isParkPickup ? 'Motor Park Waybill' : 'Doorstep Courier'}</span>
                            </span>

                            {/* Serviceability Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase ${
                              s.serviceabilityType === 'pickup'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {s.serviceabilityType === 'pickup' ? '● Rider Door Pickup' : '▲ Station Drop-off'}
                            </span>

                            {s.deliveryIssue && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono-luxury font-bold uppercase animate-pulse flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Delivery Issue</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono-luxury">
                            <span className="text-[var(--text-muted)]">{s.orderDate}</span>
                            <span className="font-bold text-[var(--gold-accent)]">
                              Fee: ₦{Number(s.shippingFee).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Route Grid: Vendor Origin -> Courier Partner -> Customer Destination */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-luxury">
                          
                          {/* Vendor Origin */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                              <Store className="h-3 w-3 text-[var(--gold-accent)]" />
                              Vendor Atelier Origin:
                            </span>
                            <div className="font-bold text-[var(--text-primary)] text-sm">{s.vendorName}</div>
                            <div className="text-[11px] text-[var(--text-secondary)]">{s.vendorLocation}</div>
                            <div className="text-[10px] text-zinc-400 pt-1">
                              Weight Profile: <strong>{s.packageWeightKg}kg</strong> ({s.packageDimensions})
                            </div>
                          </div>

                          {/* Courier Partner & Waybill */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                              <Truck className="h-3 w-3 text-emerald-400" />
                              Assigned Courier & Waybill:
                            </span>
                            <div className="font-bold text-emerald-400 text-sm">{s.courierName}</div>
                            <div className="text-[11px] text-[var(--text-primary)] font-bold">
                              Waybill: {s.waybillNumber || <span className="text-[var(--text-muted)] italic">Awaiting dispatch</span>}
                            </div>
                            {isParkPickup && s.dropoffStation && (
                              <div className="text-[10px] text-amber-400 pt-1">
                                Terminal: <strong>{s.dropoffStation}</strong>
                              </div>
                            )}
                          </div>

                          {/* Customer Destination */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                              Customer Destination:
                            </span>
                            <div className="font-bold text-[var(--text-primary)] text-sm">{s.customerName}</div>
                            <div className="text-[11px] text-[var(--text-secondary)] truncate">{s.deliveryAddress}</div>
                            <div className="text-[10px] text-[var(--gold-accent)] pt-1 font-bold">
                              {s.deliveryCity}{s.deliveryState ? `, ${s.deliveryState}` : ''} • {s.customerPhone}
                            </div>
                          </div>

                        </div>

                        {/* Garment Items Mini-Strip */}
                        {s.items.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold shrink-0">
                              Garments ({s.items.length}):
                            </span>
                            {s.items.map((it, itIdx) => (
                              <div key={itIdx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury shrink-0">
                                <span className="font-bold text-[var(--text-primary)] truncate max-w-[150px]">{it.productName}</span>
                                <span className="text-[var(--text-muted)]">Size: {it.size || 'M'}</span>
                                <span className="text-[var(--gold-accent)] font-bold">×{it.quantity || 1}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Delivery Issue Alert Box if flagged */}
                        {s.deliveryIssue && (
                          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span><strong>Issue Note:</strong> {s.deliveryIssue}</span>
                            </div>
                            <button
                              onClick={() => handleOpenEditShipment(s)}
                              className="px-3 py-1 rounded-full bg-rose-500 text-black text-[10px] font-bold uppercase hover:bg-rose-400 cursor-pointer shrink-0"
                            >
                              Resolve Exception
                            </button>
                          </div>
                        )}

                        {/* 4-Stage Progress Stepper Bar */}
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {[
                            { num: 1, label: 'Stage 1: Confirmed' },
                            { num: 2, label: 'Stage 2: Atelier Packed' },
                            { num: 3, label: 'Stage 3: In Transit' },
                            { num: 4, label: 'Stage 4: Delivered' }
                          ].map((st) => {
                            const isDone = s.trackingStage >= st.num;
                            const isCurrent = s.trackingStage === st.num;

                            return (
                              <div key={st.num} className="space-y-1">
                                <div className={`h-1.5 w-full rounded-full transition-all ${
                                  isDone ? 'bg-[var(--gold-accent)]' : 'bg-[var(--bg-secondary)]'
                                }`} />
                                <div className={`text-[10px] font-mono-luxury text-center truncate ${
                                  isCurrent
                                    ? 'text-[var(--gold-accent)] font-bold'
                                    : isDone
                                    ? 'text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)]'
                                }`}>
                                  {st.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">Pickup Status:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase ${
                              isDelivered
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isInTransit
                                ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30'
                                : isReady
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {s.pickupStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick Advance Button */}
                            {s.trackingStage < 4 && (
                              <button
                                onClick={() => handleQuickAdvanceShipment(s, s.trackingStage + 1)}
                                className="px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold text-[var(--text-primary)] transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <ArrowRight className="h-3 w-3 text-[var(--gold-accent)]" />
                                <span>
                                  {s.trackingStage === 1
                                    ? 'Advance: Packed'
                                    : s.trackingStage === 2
                                    ? 'Advance: In Transit'
                                    : 'Advance: Delivered'}
                                </span>
                              </button>
                            )}

                            {/* Full Management Modal Button */}
                            <button
                              onClick={() => handleOpenEditShipment(s)}
                              className="px-4 py-1.5 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold hover:bg-[#d8b357] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              <span>Manage Courier & Waybill</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: COMPLETE CATALOG & PRODUCT MODERATION */}
          {/* ======================================================== */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                      Marketplace Catalog Moderation
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury font-bold uppercase">
                      {products.length} Products Live
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Monitor, inspect, feature on lookbook, or remove garments from any Nigerian designer.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/vendor-portal/publish"
                    target="_blank"
                    className="px-4 py-2 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold hover:bg-[#d8b357] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Add New Drop</span>
                  </Link>

                  <button
                    onClick={fetchProductsList}
                    className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['all', 'native', 'streetwear', 'footwear', 'jewelry', 'outerwear', 'accessories'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setProductCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                        productCategoryFilter === cat
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {cat} {cat !== 'all' && categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[280px]">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name, brand..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              {/* Products Grid */}
              {isLoadingProducts ? (
                <LuxuryLoader
                  fullScreen={false}
                  label="Ì R Í S Í"
                  sublabel="Loading Catalog Products from Database..."
                />
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center surface-card rounded-3xl border border-[var(--border-subtle)] space-y-3">
                  <ShoppingBag className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    No products found
                  </h3>
                  <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                    Try adjusting your search query or category filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const isActioning = actionLoadingId === p.id;

                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all flex flex-col justify-between space-y-3 shadow-md group"
                      >
                        <div className="space-y-3">
                          <div
                            onClick={() => setSelectedProductModal(p)}
                            className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black cursor-pointer"
                          >
                            <Image
                              src={p.imageUrl || p.image_url || '/images/products/BlackTrapStarHoodie.jpg'}
                              alt={p.name}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {p.is_featured && (
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-bold uppercase">
                                Lookbook Featured
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs font-mono-luxury">
                              <span className="text-[var(--gold-accent)] uppercase font-bold text-[10px]">{p.category || 'Fashion'}</span>
                              <strong className="text-[var(--text-primary)]">₦{Number(p.price || 0).toLocaleString()}</strong>
                            </div>
                            <h4
                              onClick={() => setSelectedProductModal(p)}
                              className="font-editorial text-base font-bold text-[var(--text-primary)] line-clamp-1 mt-0.5 cursor-pointer hover:text-[var(--gold-accent)] transition-colors"
                            >
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono-luxury truncate">
                              Vendor: {p.vendorName || p.vendor_name || 'Designer'}
                            </p>
                          </div>
                        </div>

                        {/* Super Admin Action Bar */}
                        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedProductModal(p)}
                            className="px-3 py-1 rounded-xl text-[10px] font-mono-luxury uppercase font-bold surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3 text-[var(--gold-accent)]" />
                            <span>View Details</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleProductFeatured(p.id, p.is_featured)}
                              disabled={isActioning}
                              className={`p-1.5 rounded-xl border border-[var(--border-subtle)] transition-all cursor-pointer ${
                                p.is_featured
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'hover:border-[var(--gold-accent)] text-[var(--text-muted)] hover:text-amber-400'
                              }`}
                              title={p.is_featured ? 'Remove from Homepage Lookbook' : 'Highlight on Homepage Lookbook'}
                            >
                              <Star className={`h-3.5 w-3.5 ${p.is_featured ? 'fill-current' : ''}`} />
                            </button>

                            <Link
                              href={`/shop/${p.id}`}
                              target="_blank"
                              className="p-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                              title="Open in Customer Live Shop"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              disabled={isActioning}
                              className="p-1.5 rounded-xl border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete from Marketplace"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: CATEGORIES & SUBCATEGORIES MANAGER */}
          {/* ======================================================== */}
          {activeTab === 'categories' && (
            <AdminCategoriesManager />
          )}

          {/* ======================================================== */}
          {/* TAB 4: BRAND GOVERNANCE & APPROVALS */}
          {/* ======================================================== */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                    Brand Governance & Verification
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Review designer onboarding, inspect Nigerian bank settlement accounts, and manage storefront status.
                  </p>
                </div>

                <button
                  onClick={fetchVendorsList}
                  className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingVendors ? 'animate-spin' : ''}`} />
                  <span>Refresh Brands</span>
                </button>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Total Registered Brands</span>
                  <strong className="font-editorial text-3xl font-bold text-[var(--text-primary)]">{vendors.length}</strong>
                </div>
                <div className="p-5 rounded-3xl surface-card border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <span className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block">Pending Review</span>
                  <strong className="font-editorial text-3xl font-bold text-amber-400">{pendingCount}</strong>
                </div>
                <div className="p-5 rounded-3xl surface-card border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <span className="text-[10px] font-mono-luxury uppercase text-emerald-400 font-bold block">Approved & Verified</span>
                  <strong className="font-editorial text-3xl font-bold text-emerald-400">{approvedCount}</strong>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl surface-card border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setApprovalFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                        approvalFilter === filter
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[280px]">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search brand, manager, location..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              {/* Vendors List Cards */}
              {isLoadingVendors ? (
                <LuxuryLoader
                  fullScreen={false}
                  label="Ì R Í S Í"
                  sublabel="Loading Brand Submissions from Database..."
                />
              ) : filteredVendors.length === 0 ? (
                <div className="p-12 text-center surface-card rounded-3xl border border-[var(--border-subtle)] space-y-3">
                  <Store className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    No brands matching your filter
                  </h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVendors.map((vendor) => {
                    const isApproved = vendor.isVerified || vendor.approvalStatus === 'approved';
                    const isPending = vendor.approvalStatus === 'pending' || !vendor.isVerified;
                    const isActioning = actionLoadingId === vendor.id;

                    return (
                      <div
                        key={vendor.id}
                        className="p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/40 transition-all space-y-5 shadow-sm"
                      >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] font-editorial font-bold text-2xl flex items-center justify-center shrink-0 mt-0.5">
                              {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                                  {vendor.name}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase ${
                                  isApproved
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                                }`}>
                                  ● {isApproved ? 'Verified & Active' : 'Pending Review'}
                                </span>

                                {/* Specialty Badge */}
                                {vendor.specialty === 'native_tailoring' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold bg-[#e6c367]/15 text-[#e6c367] border border-[#e6c367]/30 flex items-center gap-1">
                                    <span>✂️</span> Bespoke Native Tailoring Atelier
                                  </span>
                                ) : vendor.specialty === 'footwear' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                    <span>👞</span> Footwear & Slides Studio
                                  </span>
                                ) : vendor.specialty === 'caps' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                    <span>🧢</span> Caps & Headwear
                                  </span>
                                ) : vendor.specialty === 'accessories' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span>💍</span> Jewelry & Accessories
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                    <span>🧥</span> Ready-to-Wear Boutique
                                  </span>
                                )}

                                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono-luxury uppercase text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                                  {vendor.vendorType === 'fashion_designer' ? 'Fashion Designer (Made to Measure)' : 'Boutique Seller (Ready-to-Wear)'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs font-mono-luxury text-[var(--text-secondary)] flex-wrap">
                                <span>Lead Designer / Manager: <strong className="text-[var(--text-primary)]">{vendor.designerName}</strong></span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[var(--gold-accent)]" />{vendor.location || `${vendor.city || ''}, ${vendor.state || ''}`}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isPending && (
                              <button
                                onClick={() => handleApproveBrand(vendor.id)}
                                disabled={isActioning}
                                className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-mono-luxury uppercase font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg"
                              >
                                {isActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span>Approve & Activate Brand</span>
                              </button>
                            )}

                            <button
                              onClick={() => setRejectionModalVendor(vendor)}
                              disabled={isActioning}
                              className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:border-rose-500 text-rose-400 transition-all cursor-pointer"
                            >
                              Return / Notes
                            </button>

                            <Link
                              href={`/brand/${encodeURIComponent(vendor.name)}`}
                              target="_blank"
                              className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                              title="Storefront Preview"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>

                        {/* Detailed 3-Column Inspection Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono-luxury">
                          {/* 1. Settlement Banking Details */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-1">
                              <Building className="h-3 w-3 text-[var(--gold-accent)]" />
                              Settlement Bank Account
                            </span>
                            <div className="text-[var(--text-primary)] font-bold tracking-wider">
                              {vendor.accountNumber || 'Not provided'} • {vendor.bankName || 'Bank'}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] truncate">
                              Beneficiary: <strong className="text-[var(--text-primary)]">{vendor.accountName || vendor.name}</strong>
                            </div>
                          </div>

                          {/* 2. Physical Workshop / Studio Location */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                              Workshop / Studio Address
                            </span>
                            <div className="text-[var(--text-primary)] font-bold text-[11px] line-clamp-2">
                              {vendor.address || vendor.location || 'Address pending'}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)]">
                              Region: {vendor.city ? `${vendor.city}, ` : ''}{vendor.state || 'Nigeria'}
                            </div>
                          </div>

                          {/* 3. Direct Contact & WhatsApp Concierge */}
                          <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-1">
                              <Phone className="h-3 w-3 text-[var(--gold-accent)]" />
                              Direct Contact & Verification
                            </span>
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              {vendor.phone && (
                                <a
                                  href={`tel:${vendor.phone}`}
                                  className="px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-colors inline-flex items-center gap-1"
                                >
                                  <Phone className="h-2.5 w-2.5 text-[var(--gold-accent)]" />
                                  <span>{vendor.phone}</span>
                                </a>
                              )}
                              {vendor.email && (
                                <a
                                  href={`mailto:${vendor.email}`}
                                  className="px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-colors inline-flex items-center gap-1"
                                >
                                  <Mail className="h-2.5 w-2.5 text-[var(--gold-accent)]" />
                                  <span className="max-w-[120px] truncate">{vendor.email}</span>
                                </a>
                              )}
                              {(vendor.whatsapp || vendor.phone) && (
                                <a
                                  href={`https://wa.me/${(vendor.whatsapp || vendor.phone).replace(/[^0-9]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${vendor.name}, this is ÌRÍSÍ Merchant Concierge regarding your atelier registration.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-400 hover:bg-emerald-500/25 transition-colors inline-flex items-center gap-1 font-bold"
                                >
                                  <MessageCircle className="h-2.5 w-2.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-0.5 text-[10px] text-[var(--text-muted)]">
                              {vendor.instagram && <span>IG: @{vendor.instagram}</span>}
                              {vendor.tiktok && <span>TT: @{vendor.tiktok}</span>}
                              <span>•</span>
                              <span>Joined: {new Date(vendor.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ESCROW & TREASURY - DYNAMIC & INTERACTIVE */}
          {/* ======================================================== */}
          {activeTab === 'finance' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  Escrow Settlements & Treasury
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                  Live platform balances, gross sales, merchant escrow holdings, and calculated platform commissions.
                </p>
              </div>

              {/* 4 Financial Tiles - Filterable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setFinanceFilter('all')}
                  className={`p-6 rounded-3xl surface-card border transition-all space-y-1 text-left cursor-pointer ${
                    financeFilter === 'all' ? 'border-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)]/30' : 'border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50'
                  }`}
                >
                  <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Gross Marketplace Volume</span>
                  <strong className="font-editorial text-3xl font-bold text-[var(--gold-accent)]">₦{financialStats.totalGMV.toLocaleString()}</strong>
                  <span className="text-[10px] font-mono-luxury text-zinc-400 block">{orders.length} transactions processed</span>
                </button>

                <button
                  onClick={() => setFinanceFilter('locked')}
                  className={`p-6 rounded-3xl surface-card border transition-all space-y-1 text-left cursor-pointer ${
                    financeFilter === 'locked' ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-500/10' : 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50'
                  }`}
                >
                  <span className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block">Active Escrow Locked</span>
                  <strong className="font-editorial text-3xl font-bold text-amber-400">₦{financialStats.escrowLocked.toLocaleString()}</strong>
                  <span className="text-[10px] font-mono-luxury text-zinc-400 block">Pending customer delivery</span>
                </button>

                <button
                  onClick={() => setFinanceFilter('settled')}
                  className={`p-6 rounded-3xl surface-card border transition-all space-y-1 text-left cursor-pointer ${
                    financeFilter === 'settled' ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/10' : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-[10px] font-mono-luxury uppercase text-emerald-400 font-bold block">Settled to Vendors</span>
                  <strong className="font-editorial text-3xl font-bold text-emerald-400">₦{financialStats.settledPayouts.toLocaleString()}</strong>
                  <span className="text-[10px] font-mono-luxury text-zinc-400 block">Delivered & confirmed</span>
                </button>

                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Platform Fee (10%)</span>
                  <strong className="font-editorial text-3xl font-bold text-cyan-400">₦{financialStats.platformCommission.toLocaleString()}</strong>
                  <span className="text-[10px] font-mono-luxury text-zinc-400 block">Calculated revenue</span>
                </div>
              </div>

              {/* Vendor Escrow Balances Table - Filterable & Searchable */}
              <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                      Vendor Payout Balances & Settlement Accounts
                    </h3>
                    <span className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                      Pending escrow vs settled payouts mapped to verified Nigerian bank accounts • Click any brand to view payout statement
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={vendorPayoutSearch}
                        onChange={(e) => setVendorPayoutSearch(e.target.value)}
                        placeholder="Search brand, bank..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setVendorPayoutFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                          vendorPayoutFilter === 'all'
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                            : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        All ({vendorEscrowBreakdown.length})
                      </button>

                      <button
                        onClick={() => setVendorPayoutFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                          vendorPayoutFilter === 'pending'
                            ? 'bg-amber-500 text-black'
                            : 'surface-card border border-amber-500/30 text-amber-400 hover:border-amber-500'
                        }`}
                      >
                        Pending Money ({vendorEscrowBreakdown.filter(v => v.pendingEscrow > 0).length})
                      </button>

                      <button
                        onClick={() => setVendorPayoutFilter('settled')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                          vendorPayoutFilter === 'settled'
                            ? 'bg-emerald-600 text-white'
                            : 'surface-card border border-emerald-500/30 text-emerald-400 hover:border-emerald-500'
                        }`}
                      >
                        Paid / Settled ({vendorEscrowBreakdown.filter(v => v.settledPayouts > 0).length})
                      </button>
                    </div>
                  </div>
                </div>

                {filteredVendorsPayout.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
                    No vendor payout records matching your filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-luxury">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px]">
                          <th className="pb-3 font-bold">Brand / Designer</th>
                          <th className="pb-3 font-bold">Total Sales</th>
                          <th className="pb-3 font-bold">Pending Escrow</th>
                          <th className="pb-3 font-bold">Paid / Settled</th>
                          <th className="pb-3 font-bold">Settlement Bank Account</th>
                          <th className="pb-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredVendorsPayout.map((v) => (
                          <tr
                            key={v.vendorId}
                            onClick={() => setSelectedVendorPayoutModal(v)}
                            className="hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                          >
                            <td className="py-3 font-bold text-[var(--text-primary)]">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                                <span>{v.vendorName}</span>
                              </div>
                              <span className="text-[10px] text-[var(--text-muted)] block pl-5.5">{v.ordersCount} orders placed</span>
                            </td>
                            <td className="py-3 text-[var(--text-primary)] font-bold">₦{v.totalSales.toLocaleString()}</td>
                            <td className="py-3 font-bold">
                              {v.pendingEscrow > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px]">
                                  ₦{v.pendingEscrow.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">₦0</span>
                              )}
                            </td>
                            <td className="py-3 font-bold">
                              {v.settledPayouts > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px]">
                                  ₦{v.settledPayouts.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">₦0</span>
                              )}
                            </td>
                            <td className="py-3 text-[var(--text-secondary)]">
                              <div>{v.accountNumber} • {v.bankName}</div>
                              <span className="text-[10px] text-[var(--text-muted)]">{v.accountName}</span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVendorPayoutModal(v);
                                }}
                                className="px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase font-bold hover:border-[var(--gold-accent)] text-[var(--gold-accent)] transition-all cursor-pointer"
                              >
                                View Payouts
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Transaction Accounting Ledger with Filter & Search */}
              <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                      Transaction Accounting Ledger
                    </h3>
                    <span className="text-xs font-mono-luxury text-[var(--text-muted)]">
                      Showing {filteredLedger.length} of {orders.length} orders • Click any row to view full receipt
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={financeSearch}
                        onChange={(e) => setFinanceSearch(e.target.value)}
                        placeholder="Search ref, buyer..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      {(['all', 'locked', 'settled'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setFinanceFilter(filter)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                            financeFilter === filter
                              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                              : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredLedger.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
                    No transactions matching your filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-luxury">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px]">
                          <th className="pb-3 font-bold">Order Ref</th>
                          <th className="pb-3 font-bold">Customer</th>
                          <th className="pb-3 font-bold">Items Total</th>
                          <th className="pb-3 font-bold">Delivery Fee</th>
                          <th className="pb-3 font-bold">Grand Total</th>
                          <th className="pb-3 font-bold">Escrow Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredLedger.map((ord) => (
                          <tr
                            key={ord.id}
                            onClick={() => setSelectedOrderModal(ord)}
                            className="hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                          >
                            <td className="py-3 font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Eye className="h-3 w-3 text-[var(--gold-accent)]" />
                              <span>{ord.orderNumber}</span>
                            </td>
                            <td className="py-3 text-[var(--text-secondary)]">{ord.customerName}</td>
                            <td className="py-3 text-[var(--text-primary)]">₦{Number(ord.subtotal || 0).toLocaleString()}</td>
                            <td className="py-3 text-[var(--gold-accent)]">₦{Number(ord.shippingFee || 0).toLocaleString()}</td>
                            <td className="py-3 font-bold text-[var(--text-primary)]">₦{Number(ord.totalAmount || 0).toLocaleString()}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                ord.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                {ord.status || 'Escrow Locked'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SHOPPERS & CUSTOMERS DIRECTORY */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                    Verified Shoppers Directory
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Directory of buyers across Nigeria • Click on any shopper to see their complete purchase history and spent totals.
                  </p>
                </div>

                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={shopperSearch}
                    onChange={(e) => setShopperSearch(e.target.value)}
                    placeholder="Search shopper name, email, phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              {filteredShoppers.length === 0 ? (
                <div className="p-12 text-center surface-card rounded-3xl border border-[var(--border-subtle)] space-y-3">
                  <Users className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-40" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    No customers found
                  </h3>
                  <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                    Try adjusting your search query.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono-luxury">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px]">
                          <th className="pb-3 font-bold">Shopper Name</th>
                          <th className="pb-3 font-bold">Email Address</th>
                          <th className="pb-3 font-bold">Phone Number</th>
                          <th className="pb-3 font-bold">Location</th>
                          <th className="pb-3 font-bold">Orders</th>
                          <th className="pb-3 font-bold">Lifetime Spend</th>
                          <th className="pb-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredShoppers.map((c, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedShopperModal(c)}
                            className="hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                              <span>{c.name}</span>
                            </td>
                            <td className="py-3.5 text-[var(--text-secondary)]">{c.email}</td>
                            <td className="py-3.5 text-[var(--text-secondary)]">{c.phone}</td>
                            <td className="py-3.5 text-[var(--text-secondary)]">
                              {c.city}{c.state ? `, ${c.state}` : ''}
                            </td>
                            <td className="py-3.5 text-[var(--gold-accent)] font-bold">{c.ordersCount}</td>
                            <td className="py-3.5 font-bold text-emerald-400">₦{c.totalSpend.toLocaleString()}</td>
                            <td className="py-3.5 text-right">
                              <span className="px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase font-bold text-[var(--gold-accent)]">
                                View Profile
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: VIP CONCIERGE & WHATSAPP HUB                      */}
          {/* ======================================================== */}
          {activeTab === 'concierge' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <span>VIP Concierge & WhatsApp Hub</span>
                    <span className={`text-[10px] font-mono-luxury px-3 py-1 rounded-full uppercase font-bold ${
                      conciergeEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {conciergeEnabled ? 'Widget Live' : 'Widget Disabled'}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                    Direct VIP support connecting shoppers to your WhatsApp for sizing calibration, custom orders, and escrow reassurance.
                  </p>
                </div>

                {/* Quick Test Button */}
                <a
                  href={generateWhatsAppUrl(conciergePhoneInput, 'Hello Admin, this is a live test from Ìrísí Platform Command Center.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-mono-luxury uppercase font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Test Connection on WhatsApp</span>
                </a>
              </div>

              {/* 3 Executive Concierge Stat Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Active Phone Tile */}
                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Active Support Line</span>
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                    +{conciergeConfig.whatsappNumber}
                  </div>
                  <p className="text-[11px] font-mono-luxury text-emerald-400 flex items-center gap-1.5 pt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Routing live customer inquiries</span>
                  </p>
                </div>

                {/* Response SLA */}
                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Operating Hours</span>
                    <Clock className="h-4 w-4 text-[var(--gold-accent)]" />
                  </div>
                  <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">
                    {conciergeConfig.businessHours.split('(')[0] || '8 AM – 10 PM'}
                  </div>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-muted)] pt-1">
                    7 Days a week nationwide coverage
                  </p>
                </div>

                {/* Conversion Impact */}
                <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="text-[10px] font-mono-luxury uppercase font-bold">Escrow Guarantee Integration</span>
                    <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)]" />
                  </div>
                  <div className="font-editorial text-2xl font-bold text-emerald-400">
                    100% Protected
                  </div>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-muted)] pt-1">
                    Direct bank transfer verification supported
                  </p>
                </div>

              </div>

              {/* Main Configuration Card */}
              <div className="surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6">
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    Concierge Configuration
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-0.5">
                    Update the WhatsApp destination phone number and widget visibility across the store in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* WhatsApp Number Field */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-muted)] block">
                      Support WhatsApp Phone Number:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={conciergePhoneInput}
                        onChange={(e) => setConciergePhoneInput(e.target.value)}
                        placeholder="e.g. 2348030000000"
                        className="w-full pl-4 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                      />
                    </div>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                      Include country code without plus sign (e.g., 2348123456789 for Nigeria).
                    </p>
                  </div>

                  {/* Operational Hours */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-muted)] block">
                      Operating Hours Notice:
                    </label>
                    <input
                      type="text"
                      value={conciergeHoursInput}
                      onChange={(e) => setConciergeHoursInput(e.target.value)}
                      placeholder="e.g. 8:00 AM – 10:00 PM WAT (7 Days)"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                    />
                    <p className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                      Displayed on the customer-facing concierge card.
                    </p>
                  </div>

                  {/* Concierge Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-muted)] block">
                      Concierge Advisor Name:
                    </label>
                    <input
                      type="text"
                      value={conciergeNameInput}
                      onChange={(e) => setConciergeNameInput(e.target.value)}
                      placeholder="e.g. Ìrísí Customer Support"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                    />
                  </div>

                  {/* Widget Enable Toggle */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-muted)] block">
                      Customer Widget Visibility:
                    </label>
                    <button
                      type="button"
                      onClick={() => setConciergeEnabled(!conciergeEnabled)}
                      className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                        conciergeEnabled
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'
                      }`}
                    >
                      <span>{conciergeEnabled ? 'Floating Widget Enabled' : 'Widget Disabled'}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${conciergeEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    </button>
                    <p className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                      Toggles the floating concierge pill on customer-facing pages.
                    </p>
                  </div>

                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                    Changes take effect across all browsers immediately upon saving.
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = saveConciergeConfig({
                        whatsappNumber: conciergePhoneInput.trim(),
                        businessHours: conciergeHoursInput.trim(),
                        advisorName: conciergeNameInput.trim(),
                        isEnabled: conciergeEnabled
                      });
                      setConciergeConfig(updated);
                      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
                      setActionSuccessMsg('WhatsApp Concierge settings updated successfully!');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--gold-accent)] hover:bg-[var(--gold-hover)] text-black text-xs font-mono-luxury uppercase font-bold shadow-lg transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </button>
                </div>

              </div>

              {/* Instant Response Toolkit (Quick-Copy Scripts for WhatsApp) */}
              <div className="surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold mb-2">
                    <Sparkles className="h-3 w-3" />
                    <span>Rapid WhatsApp Reply Toolkit</span>
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    Instant Admin Reply Scripts
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-0.5">
                    Click to copy professional responses to paste directly into your WhatsApp chats with shoppers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Sizing & Body Twin Advice',
                      category: 'Sizing Help',
                      script: `Hello! For our bespoke Senator sets and hoodies, our Twin Fit algorithm matches your chest and height. Share your height (cm) and chest size, and we will guarantee the exact fit or exchange it 100% free under Ìrísí Escrow.`
                    },
                    {
                      title: 'Delivery & State Dispatch Times',
                      category: 'Shipping',
                      script: `Good day! Deliveries within major centers arrive in 24-48 hours. Nationwide deliveries to all other states take 2-4 business days with live doorstep tracking and SMS updates.`
                    },
                    {
                      title: 'Bank Transfer & Escrow Details',
                      category: 'Payment Reassurance',
                      script: `Hello! Yes, you can pay via direct bank transfer into Ìrísí Escrow. Your funds remain 100% protected and are only disbursed to the designer after you receive the package and confirm it fits perfectly.`
                    },
                    {
                      title: 'Custom Alterations & Embroidery',
                      category: 'Bespoke Customization',
                      script: `Hello! Our verified designers can customize embroidery thread (gold/silver) or adjust sleeve and trouser lengths to your exact measurements. Please share your custom notes!`
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between hover:border-[var(--gold-accent)]/40 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                            Template #{idx + 1}
                          </span>
                        </div>
                        <h4 className="font-editorial text-base font-bold text-[var(--text-primary)]">
                          {item.title}
                        </h4>
                        <p className="text-xs font-mono-luxury text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                          &quot;{item.script}&quot;
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.script);
                          setCopiedTemplateIdx(idx);
                          setTimeout(() => setCopiedTemplateIdx(null), 2500);
                        }}
                        className={`w-full py-2 px-3 rounded-xl border text-[11px] font-mono-luxury uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          copiedTemplateIdx === idx
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'surface-card border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)]'
                        }`}
                      >
                        {copiedTemplateIdx === idx ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* FULL ORDER RECEIPT & INSPECTION MODAL */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                  Official Order Dossier
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  {selectedOrderModal.orderNumber}
                </h3>
              </div>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Customer & Delivery Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-luxury">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Customer Contact</span>
                <div className="font-bold text-[var(--text-primary)]">{selectedOrderModal.customerName}</div>
                <div>Phone: {selectedOrderModal.customerPhone}</div>
                <div className="truncate">Email: {selectedOrderModal.customerEmail}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Delivery Destination</span>
                <div className="font-bold text-[var(--text-primary)] text-xs">{selectedOrderModal.deliveryAddress}</div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--gold-accent)] font-bold">
                  <span>City: {selectedOrderModal.deliveryCity || 'Lagos'}</span>
                  {selectedOrderModal.deliveryState && <span>• State: {selectedOrderModal.deliveryState}</span>}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <span className="text-xs font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
                Purchased Pieces ({selectedOrderModal.items?.length || 0})
              </span>

              <div className="divide-y divide-[var(--border-subtle)]">
                {(selectedOrderModal.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs font-mono-luxury">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black shrink-0">
                        <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt="" fill unoptimized className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{item.productName}</div>
                        <div className="text-[var(--text-muted)]">Size: {item.size} • Qty: {item.quantity} • Vendor: {item.vendorName}</div>
                      </div>
                    </div>

                    <strong className="text-[var(--gold-accent)] shrink-0">₦{Number(item.price * (item.quantity || 1)).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono-luxury">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[var(--text-primary)]">₦{Number(selectedOrderModal.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Delivery Fee:</span>
                <span className="font-bold text-[var(--gold-accent)]">₦{Number(selectedOrderModal.shippingFee || 0).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-[var(--gold-accent)] text-lg">₦{Number(selectedOrderModal.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL PRODUCT DOSSIER MODAL */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                  Product Dossier & Moderation
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  {selectedProductModal.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedProductModal(null)}
                className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black">
              <Image
                src={selectedProductModal.imageUrl || selectedProductModal.image_url || '/images/products/BlackTrapStarHoodie.jpg'}
                alt={selectedProductModal.name}
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono-luxury">
              <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Category</span>
                <strong className="text-[var(--gold-accent)] uppercase">{selectedProductModal.category}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Retail Price</span>
                <strong className="text-[var(--text-primary)] text-base">₦{Number(selectedProductModal.price || 0).toLocaleString()}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Designer / Brand</span>
                <strong className="text-[var(--text-primary)]">{selectedProductModal.vendorName || selectedProductModal.vendor_name || 'Designer Store'}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Lookbook Status</span>
                <strong className={selectedProductModal.is_featured ? 'text-amber-400' : 'text-[var(--text-muted)]'}>
                  {selectedProductModal.is_featured ? 'Featured on Lookbook' : 'Standard Catalog'}
                </strong>
              </div>
            </div>

            {selectedProductModal.description && (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-secondary)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Product Description</span>
                <p className="leading-relaxed">{selectedProductModal.description}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  handleToggleProductFeatured(selectedProductModal.id, selectedProductModal.is_featured);
                  setSelectedProductModal({ ...selectedProductModal, is_featured: !selectedProductModal.is_featured });
                }}
                className="px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold uppercase hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Star className={`h-3.5 w-3.5 ${selectedProductModal.is_featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{selectedProductModal.is_featured ? 'Remove from Lookbook' : 'Feature on Lookbook'}</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/shop/${selectedProductModal.id}`}
                  target="_blank"
                  className="px-4 py-2 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury font-bold uppercase hover:bg-[#d8b357] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Live Shop</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                <button
                  onClick={() => {
                    handleDeleteProduct(selectedProductModal.id, selectedProductModal.name);
                    setSelectedProductModal(null);
                  }}
                  className="p-2 rounded-full border border-[var(--border-subtle)] hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                  title="Delete from Marketplace"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REJECT / RETURN FEEDBACK MODAL */}
      {rejectionModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  Return Submission for Correction
                </h3>
                <span className="text-xs font-mono-luxury text-[var(--text-muted)]">
                  Brand: {rejectionModalVendor.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
              When returned, the vendor's profile fields will unlock so they can correct their store details, bio, or contact information and resubmit for approval.
            </p>

            <form onSubmit={handleRejectBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Correction Feedback Note (Sent to Vendor)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Please update your store contact phone number and provide an active Instagram handle."
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed focus:border-rose-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalVendor(null)}
                  className="px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:bg-[var(--bg-surface)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoadingId === rejectionModalVendor.id}
                  className="px-6 py-2.5 rounded-full bg-rose-500 text-white text-xs font-mono-luxury uppercase font-bold hover:bg-rose-600 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === rejectionModalVendor.id ? <Sparkles className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>Return to Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHOPPER DOSSIER & COMPLETE ORDERS MODAL */}
      {selectedShopperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                  Customer Profile & Purchasing Dossier
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {selectedShopperModal.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedShopperModal(null)}
                className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Lifetime Platform Spend</span>
                <strong className="font-editorial text-2xl font-bold text-emerald-400">
                  ₦{Number(selectedShopperModal.totalSpend || 0).toLocaleString()}
                </strong>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Orders Placed</span>
                <strong className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">
                  {selectedShopperModal.ordersCount} {selectedShopperModal.ordersCount === 1 ? 'Order' : 'Orders'}
                </strong>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Average Order Value (AOV)</span>
                <strong className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  ₦{Math.round((selectedShopperModal.totalSpend || 0) / (selectedShopperModal.ordersCount || 1)).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Shopper Contact Details */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-luxury text-[var(--text-secondary)]">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Email Address</span>
                <span className="text-[var(--text-primary)]">{selectedShopperModal.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Phone Number</span>
                <span className="text-[var(--text-primary)]">{selectedShopperModal.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Delivery Destination</span>
                <span className="text-[var(--gold-accent)] font-bold">
                  {selectedShopperModal.city}{selectedShopperModal.state ? `, ${selectedShopperModal.state}` : ''}
                </span>
              </div>
            </div>

            {/* Itemized Order History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                  Complete Order History ({selectedShopperModal.orders?.length || 0})
                </h4>
                <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                  Sorted newest to oldest
                </span>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {(selectedShopperModal.orders || []).map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-editorial text-base font-bold text-[var(--text-primary)]">
                          {ord.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono-luxury uppercase font-bold ${
                          ord.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ord.status || 'Escrow Secured'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono-luxury">
                        <span className="text-[var(--text-muted)]">{ord.date || ord.createdAt}</span>
                        <span className="text-[var(--gold-accent)] font-bold text-sm">
                          ₦{Number(ord.totalAmount || 0).toLocaleString()}
                        </span>
                        <button
                          onClick={() => setSelectedOrderModal(ord)}
                          className="px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase font-bold hover:border-[var(--gold-accent)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {(ord.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded-xl surface-card border border-[var(--border-subtle)] shrink-0">
                          <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-black shrink-0">
                            <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt="" fill unoptimized className="object-cover" />
                          </div>
                          <div className="text-[10px] font-mono-luxury pr-2">
                            <div className="font-bold text-[var(--text-primary)] truncate max-w-[110px]">{item.productName}</div>
                            <div className="text-[var(--text-muted)]">Qty: {item.quantity || 1} • Size: {item.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedShopperModal(null)}
                className="px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                Close Shopper Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VENDOR PAYOUT & SETTLEMENT DOSSIER MODAL */}
      {selectedVendorPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                  Vendor Payout Statement & Settlement Dossier
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {selectedVendorPayoutModal.vendorName}
                </h3>
              </div>

              <button
                onClick={() => setSelectedVendorPayoutModal(null)}
                className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Payout Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Gross Garment Sales</span>
                <strong className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  ₦{Number(selectedVendorPayoutModal.totalSales || 0).toLocaleString()}
                </strong>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block">Pending Escrow (Held)</span>
                <strong className="font-editorial text-2xl font-bold text-amber-400">
                  ₦{Number(selectedVendorPayoutModal.pendingEscrow || 0).toLocaleString()}
                </strong>
                <span className="text-[10px] font-mono-luxury text-zinc-400 block">Pending customer delivery</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-mono-luxury uppercase text-emerald-400 font-bold block">Paid Out / Settled</span>
                <strong className="font-editorial text-2xl font-bold text-emerald-400">
                  ₦{Number(selectedVendorPayoutModal.settledPayouts || 0).toLocaleString()}
                </strong>
                <span className="text-[10px] font-mono-luxury text-zinc-400 block">Funds released to bank</span>
              </div>
            </div>

            {/* Nigerian Settlement Bank Account Card */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                Verified Nigerian Settlement Bank Account
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-luxury">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Bank Name</span>
                  <strong className="text-[var(--text-primary)]">{selectedVendorPayoutModal.bankName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">NUBAN Account Number</span>
                  <strong className="text-[var(--gold-accent)] font-mono text-sm">{selectedVendorPayoutModal.accountNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Beneficiary Name</span>
                  <strong className="text-[var(--text-primary)]">{selectedVendorPayoutModal.accountName}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Garment Sales Ledger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                  Itemized Garments Sold ({selectedVendorPayoutModal.itemsSold?.length || 0})
                </h4>
                <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                  90% Vendor Payout • 10% Platform Fee
                </span>
              </div>

              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left text-xs font-mono-luxury">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px]">
                      <th className="pb-2.5 font-bold">Order Ref</th>
                      <th className="pb-2.5 font-bold">Garment</th>
                      <th className="pb-2.5 font-bold">Customer</th>
                      <th className="pb-2.5 font-bold">Sale Price</th>
                      <th className="pb-2.5 font-bold text-emerald-400">90% Payout</th>
                      <th className="pb-2.5 font-bold">Status</th>
                      <th className="pb-2.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {(selectedVendorPayoutModal.itemsSold || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                        <td className="py-2.5 font-bold text-[var(--text-primary)]">{item.orderNumber}</td>
                        <td className="py-2.5 text-[var(--text-primary)]">
                          <div>{item.productName}</div>
                          <span className="text-[10px] text-[var(--text-muted)]">Size: {item.size} • Qty: {item.quantity}</span>
                        </td>
                        <td className="py-2.5 text-[var(--text-secondary)]">
                          <div>{item.customerName}</div>
                          <span className="text-[10px] text-[var(--text-muted)]">{item.customerCity}</span>
                        </td>
                        <td className="py-2.5 text-[var(--text-primary)]">₦{Number(item.price).toLocaleString()}</td>
                        <td className="py-2.5 font-bold text-emerald-400">₦{Number(item.payoutAmount).toLocaleString()}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.isDelivered ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.isDelivered ? 'Paid / Settled' : 'Pending Escrow'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {!item.isDelivered ? (
                            <button
                              onClick={() => {
                                handleReleaseEscrow(item.orderId);
                                setSelectedVendorPayoutModal(null);
                              }}
                              className="px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold uppercase hover:bg-emerald-400 transition-all cursor-pointer"
                            >
                              Release
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedVendorPayoutModal(null)}
                className="px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. SHIPMENT MANAGEMENT & COURIER REASSIGNMENT MODAL */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg surface-card rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-7 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center font-bold">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                    Order Ref: {editingShipment.orderNumber}
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    Manage Dispatch & Waybill
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingShipment(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Shipment Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Vendor Atelier:</span>
                <strong className="text-[var(--text-primary)]">{editingShipment.vendorName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Destination:</span>
                <strong className="text-[var(--text-primary)]">{editingShipment.deliveryCity}, {editingShipment.customerName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Delivery Method:</span>
                <span className="font-bold text-[var(--gold-accent)] uppercase">
                  {editingShipment.deliveryMethod === 'park_pickup' ? 'Motor Park Bus Hub' : 'Doorstep Courier'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Auto Weight:</span>
                <span>{editingShipment.packageWeightKg}kg ({editingShipment.packageDimensions})</span>
              </div>
            </div>

            <form onSubmit={handleSaveShipment} className="space-y-4 text-xs font-mono-luxury">
              
              {/* Courier Partner Selection */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Courier Partner / Logistics Provider:
                </label>
                <div className="space-y-2">
                  <select
                    value={
                      ['GIG Logistics Express', 'Fez Delivery', 'Red Star Express', 'DHL Express Nigeria', 'Gokada Last-Mile', 'Motor Park Bus Waybill'].includes(editCourierName)
                        ? editCourierName
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setEditCourierName(e.target.value);
                      } else {
                        setEditCourierName('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  >
                    <option value="GIG Logistics Express">GIG Logistics Express (Doorstep & Drop-off)</option>
                    <option value="Fez Delivery">Fez Delivery (Intra/Interstate)</option>
                    <option value="Red Star Express">Red Star Express (FedEx Partner)</option>
                    <option value="DHL Express Nigeria">DHL Express Nigeria (Priority)</option>
                    <option value="Gokada Last-Mile">Gokada Last-Mile (Instant Dispatch)</option>
                    <option value="Motor Park Bus Waybill">Motor Park Interstate Bus Waybill (Hub to Hub)</option>
                    <option value="custom">Custom Logistics Partner...</option>
                  </select>

                  {(!['GIG Logistics Express', 'Fez Delivery', 'Red Star Express', 'DHL Express Nigeria', 'Gokada Last-Mile', 'Motor Park Bus Waybill'].includes(editCourierName) || editCourierName === '') && (
                    <input
                      type="text"
                      placeholder="Enter courier name..."
                      value={editCourierName}
                      onChange={(e) => setEditCourierName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Waybill / Tracking Number */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Waybill / Tracking Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. GIG-73829104, WAYBILL-8291"
                  value={editWaybillNumber}
                  onChange={(e) => setEditWaybillNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono"
                />
              </div>

              {/* Pickup Status & Tracking Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Pickup Status:
                  </label>
                  <select
                    value={editPickupStatus}
                    onChange={(e) => setEditPickupStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  >
                    <option value="pending">Pending (Awaiting Vendor)</option>
                    <option value="ready_for_pickup">Ready for Pickup / Drop-off</option>
                    <option value="picked_up">Picked Up by Courier</option>
                    <option value="delivered">Delivered to Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Tracking Stage:
                  </label>
                  <select
                    value={editTrackingStage}
                    onChange={(e) => setEditTrackingStage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  >
                    <option value={1}>Stage 1: Confirmed</option>
                    <option value={2}>Stage 2: Packed at Atelier</option>
                    <option value={3}>Stage 3: In Transit with Courier</option>
                    <option value={4}>Stage 4: Delivered to Customer</option>
                  </select>
                </div>
              </div>

              {/* Delivery Issue Note */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold flex items-center justify-between">
                  <span>Delivery Exception / Issue Note:</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Leave blank if no issues</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Courier attempted delivery, customer requested Saturday drop-off..."
                  value={editDeliveryIssue}
                  onChange={(e) => setEditDeliveryIssue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="py-3 rounded-2xl surface-card border border-[var(--border-subtle)] uppercase font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShipment}
                  className="py-3 rounded-2xl bg-[var(--gold-accent)] text-black uppercase font-bold hover:bg-[#d8b357] shadow-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingShipment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-black" />
                      <span>Save Shipment</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
