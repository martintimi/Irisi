'use client';

import React, { useRef, useState } from 'react';
import {
  Printer, X, Copy, Check, ShieldCheck, Truck,
  MapPin, Phone, User, Package, Calendar, Share2,
  PenTool, MessageCircle, AlertCircle
} from 'lucide-react';
import IrisiIcon from '@/components/common/IrisiIcon';

interface ShippingWaybillModalProps {
  order: any;
  vendorProfile: any;
  onClose: () => void;
}

export default function ShippingWaybillModal({
  order,
  vendorProfile,
  onClose
}: ShippingWaybillModalProps) {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedMarkerText, setCopiedMarkerText] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const waybillNo =
    order.waybillNumber ||
    order.trackingDetails?.waybillNumber ||
    order.orderNumber ||
    'Pending';

  const isParkPickup =
    order.deliveryMethod === 'park_pickup' ||
    order.packageMethods?.[order.items?.[0]?.vendorId] === 'park_pickup';

  const destinationTerminal = order.dropoffStation || order.selectedParkTerminal || '';
  const destinationAddress = isParkPickup && destinationTerminal
    ? `${destinationTerminal} (${order.deliveryCity || 'Terminal Pickup'})`
    : (order.deliveryAddress || `${order.deliveryCity || 'Nigeria'}`);

  const vendorName = vendorProfile?.brandName || order.items?.[0]?.vendorName || 'Verified Partner';
  const vendorCity = vendorProfile?.city || 'Lagos';
  const vendorState = vendorProfile?.state || 'Lagos';
  const vendorPhone = vendorProfile?.phone || '09070332145';
  const vendorAddress = vendorProfile?.location || `${vendorCity}, ${vendorState}`;

  const customerName = order.customerName || 'Valued Customer';
  const customerPhone = order.customerPhone || 'N/A';
  const courierName = order.courierName || (isParkPickup ? 'Motor Park Bus Waybill' : 'Shipbubble Courier');

  const itemsSummary = (order.items || []).map((i: any) =>
    `• ${i.productName || i.name} (Size: ${i.size || 'M'}${i.colorName || i.color ? `, Color: ${i.colorName || i.color}` : ''}, Qty: ${i.quantity || 1})`
  ).join('\n');

  // Text for handwriting on parcel bag or carton with a marker
  const markerBagText = `-------------------------
📦 IRISI DISPATCH LABEL
-------------------------
TO: ${customerName}
TEL: ${customerPhone}
DESTINATION: ${destinationAddress}
WAYBILL NO: ${waybillNo}
COURIER: ${courierName}
PIECES:
${itemsSummary || '• Garment Parcel'}
PAYMENT: ${isParkPickup ? 'Pay Driver on Collection at Park' : 'Prepaid Escrow (Do Not Collect Cash)'}
FROM: ${vendorName} (${vendorPhone})
-------------------------`;

  const handleCopyMarkerText = () => {
    navigator.clipboard.writeText(markerBagText);
    setCopiedMarkerText(true);
    setTimeout(() => setCopiedMarkerText(false), 2200);
  };

  const handleCopyTrackingOnly = () => {
    navigator.clipboard.writeText(waybillNo);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*IRISI WAYBILL & DISPATCH MANIFEST*\n\n` +
      `*Order #:* ${order.orderNumber || order.id}\n` +
      `*Waybill / Tracking:* ${waybillNo}\n` +
      `*Delivery Type:* ${isParkPickup ? 'Park Pickup (Interstate Bus)' : 'Doorstep Courier Express'}\n` +
      `*Courier/Transporter:* ${courierName}\n\n` +
      `*PIECES IN PARCEL:*\n${itemsSummary}\n\n` +
      `*RECIPIENT:*\n` +
      `• Name: ${customerName}\n` +
      `• Phone: ${customerPhone}\n` +
      `• Destination: ${destinationAddress}\n\n` +
      `*SENDER:*\n` +
      `• Store: ${vendorName}\n` +
      `• Phone: ${vendorPhone}\n` +
      `• Origin: ${vendorCity}, ${vendorState}\n\n` +
      `*PAYMENT NOTE:*\n` +
      (isParkPickup
        ? `⚠️ Customer pays transport fee directly to driver upon parcel collection at park.`
        : `✅ 100% Escrow Secured. No payment to be collected from customer.`)
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      
      {/* Modal Window Container with controlled max height and scrolling */}
      <div className="w-full max-w-xl bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header (Excluded from Print) */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)] print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[var(--gold-accent)]" />
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight">
                Package Label & Dispatch
              </h3>
              <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                {isParkPickup ? 'Motor Park Interstate Waybill' : 'Doorstep Courier Delivery'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono-luxury text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Share Waybill Details via WhatsApp"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Smooth Scroll Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 overscroll-contain">

          {/* ── SECTION 1: NIGERIAN VENDOR BAG MARKER GUIDE (PRIMARY ACTION) ── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 space-y-3 print:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <PenTool className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-editorial text-base font-bold text-[var(--text-primary)]">
                    No Printer? Write On Bag With Marker
                  </h4>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                    You don't need a printer. Write these details directly on your parcel bag or carton:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyMarkerText}
                className="px-3 py-1.5 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                {copiedMarkerText ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-black" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Label</span>
                  </>
                )}
              </button>
            </div>

            {/* Formatted Marker Card */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs space-y-1 text-[var(--text-primary)] select-all leading-relaxed">
              <div>
                <span className="text-[var(--gold-accent)] font-bold">TO: </span>
                <span className="font-semibold">{customerName}</span>
              </div>
              <div>
                <span className="text-[var(--gold-accent)] font-bold">TEL: </span>
                <span className="font-semibold">{customerPhone}</span>
              </div>
              <div>
                <span className="text-[var(--gold-accent)] font-bold">DESTINATION: </span>
                <span className="font-semibold">{destinationAddress}</span>
              </div>
              <div>
                <span className="text-[var(--gold-accent)] font-bold">WAYBILL NO: </span>
                <span className="font-bold text-emerald-400">{waybillNo}</span>
              </div>
              <div>
                <span className="text-[var(--gold-accent)] font-bold">FROM: </span>
                <span>{vendorName} ({vendorPhone})</span>
              </div>
              {isParkPickup ? (
                <div className="pt-1 text-[11px] text-amber-400 font-bold border-t border-amber-500/20">
                  ⚠️ NOTE: Customer pays collection transport fee to driver at park terminal.
                </div>
              ) : (
                <div className="pt-1 text-[11px] text-emerald-400 font-bold border-t border-emerald-500/20">
                  ✅ NOTE: 100% Escrow Secured. Do not collect delivery cash.
                </div>
              )}
            </div>

            {/* WhatsApp Share Button */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                Send to dispatch rider, park driver, or customer:
              </span>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 text-xs font-mono-luxury font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* ── SECTION 2: PRINTABLE WAYBILL SLIP (OPTIONAL FOR PRINTER OWNERS) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-luxury text-[var(--text-secondary)] print:hidden">
              <span className="uppercase font-bold tracking-wider">Standard Printable Waybill (Optional)</span>
              <span>For thermal & desktop paper printers</span>
            </div>

            <div
              ref={printRef}
              id="printable-shipping-waybill"
              className="bg-white text-black p-5 sm:p-6 rounded-2xl border-2 border-black font-sans shadow-inner space-y-4 select-text"
            >
              {/* Top Barcode Header */}
              <div className="flex items-start justify-between border-b-2 border-black pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black tracking-tighter font-serif uppercase">
                      Ì R Í S Í
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-black text-white px-1.5 py-0.5 font-bold rounded">
                      {isParkPickup ? 'PARK WAYBILL' : 'ESCROW PARCEL'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-700 block mt-0.5">
                    {isParkPickup ? 'Interstate Motor Park Logistics Manifest' : 'Automated Doorstep Courier Transit Waybill'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Tracking / Waybill No.</span>
                  <span className="text-base font-mono font-black tracking-wider text-black block">
                    {waybillNo}
                  </span>
                </div>
              </div>

              {/* Visual Barcode Graphic */}
              <div className="py-2 px-3 bg-gray-50 rounded-lg border border-gray-300 flex flex-col items-center justify-center">
                <div className="h-10 w-full max-w-sm flex items-stretch justify-center gap-[2px] overflow-hidden">
                  {[
                    3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3,
                    1, 2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className={`bg-black ${idx % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}
                      style={{ width: `${w * 2}px` }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-gray-800 mt-1">
                  *{waybillNo}*
                </span>
              </div>

              {/* Sender & Recipient Grid */}
              <div className="grid grid-cols-2 gap-3 border-y-2 border-black py-3 text-xs">
                
                {/* SENDER (FROM) */}
                <div className="border-r border-gray-300 pr-2.5 space-y-1">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-gray-500 block">
                    1. SENDER (DISPATCH ATELIER/STORE)
                  </span>
                  <h4 className="font-bold text-sm text-black leading-tight uppercase">
                    {vendorName}
                  </h4>
                  <p className="text-[11px] text-gray-700 leading-snug line-clamp-2">
                    {vendorAddress}
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-black pt-0.5">
                    Origin: <strong>{vendorCity}, {vendorState}</strong>
                  </p>
                  <p className="text-[11px] font-mono text-gray-800">
                    Tel: {vendorPhone}
                  </p>
                </div>

                {/* RECIPIENT (TO) */}
                <div className="pl-2.5 space-y-1">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-gray-500 block">
                    2. RECIPIENT ({isParkPickup ? 'PARK PICKUP DESTINATION' : 'DELIVERY DESTINATION'})
                  </span>
                  <h4 className="font-bold text-sm text-black leading-tight uppercase">
                    {customerName}
                  </h4>
                  <p className="text-[11px] text-gray-800 font-medium leading-snug">
                    {destinationAddress}
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-black pt-0.5">
                    City: <strong>{order.deliveryCity || 'Nigeria'}</strong>
                  </p>
                  <p className="text-[11px] font-mono font-bold text-black bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                    Tel: {customerPhone}
                  </p>
                </div>

              </div>

              {/* Package Contents Table */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase font-black tracking-wider text-gray-500 block">
                  3. PACKAGE CONTENTS & PIECES
                </span>

                <div className="border border-gray-300 rounded-lg overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-gray-100 p-2 font-mono font-bold text-[10px] text-gray-600 uppercase border-b border-gray-300">
                    <span className="col-span-8">Item Description</span>
                    <span className="col-span-2 text-center">Size</span>
                    <span className="col-span-2 text-right">Qty</span>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 p-2 items-center text-[11px]">
                        <div className="col-span-8 font-semibold text-black truncate pr-1">
                          <div className="truncate">{item.productName || item.name || 'Garment / Piece'}</div>
                          {(item.colorName || item.color) && (
                            <div className="text-[10px] text-gray-500 font-normal">
                              Color: {item.colorName || item.color}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 text-center font-mono font-bold text-gray-800">
                          {item.size || 'One Size'}
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-black">
                          ×{item.quantity || 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping Service & Escrow Badge Footer */}
              <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-gray-500 block">
                    Service Class
                  </span>
                  <span className="font-bold font-mono text-xs text-black block">
                    {isParkPickup
                      ? 'INTERSTATE MOTOR PARK BUS WAYBILL'
                      : 'DOORSTEP COURIER EXPRESS'}
                  </span>
                  <span className="text-[10px] text-gray-600 block">
                    {courierName}
                  </span>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-gray-500 block">
                    Payment Status
                  </span>
                  {isParkPickup ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                        PAY ON COLLECTION
                      </span>
                      <span className="text-[9px] font-mono text-gray-600 block">
                        Customer Pays Driver at Park
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                        100% ESCROW SECURED
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 block">
                        Do Not Collect Delivery Cash
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Driver Instructions Banner */}
              <div className="bg-gray-100 p-2.5 rounded-lg border border-gray-300 text-[10px] font-mono text-gray-700 leading-snug">
                {isParkPickup ? (
                  <>
                    <strong>MOTOR PARK DRIVER INSTRUCTIONS:</strong> Contact passenger/recipient ({customerPhone}) upon bus arrival at destination terminal. Collect park waybill collection fee on handover.
                  </>
                ) : (
                  <>
                    <strong>COURIER DISPATCH INSTRUCTIONS:</strong> Call recipient ({customerPhone}) prior to arrival. Verify parcel seal intact upon handover. Parcel is 100% prepaid.
                  </>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer (Copy tracking, Print, Close) */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3 print:hidden shrink-0">
          <button
            type="button"
            onClick={handleCopyTrackingOnly}
            className="flex items-center gap-1.5 text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {copiedTracking ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Waybill Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Tracking #</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print (Optional)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

