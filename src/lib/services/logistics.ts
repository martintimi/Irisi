/**
 * ÌRÍSÍ Nigerian Live Logistics & Carrier Service
 * Integrates with Shipbubble, Terminal Africa, and Intelligent State-to-State Distance Matrices.
 */

import {
  getProductWeightProfile,
  computeVendorPackageMetrics,
  GarmentWeightProfile,
  CumulativePackageMetrics
} from '@/lib/logistics/weightProfiles';
import {
  getMotorParksForState,
  checkLocationServiceability,
  MotorParkTerminal,
  LocationServiceabilityResult
} from '@/lib/logistics/motorParks';

export {
  getProductWeightProfile,
  computeVendorPackageMetrics,
  getMotorParksForState,
  checkLocationServiceability
};

export interface PackageShippingRequest {
  vendorId: string;
  vendorName: string;
  originState: string;
  originCity: string;
  destinationState: string;
  destinationCity: string;
  vendorAddress?: string;
  deliveryAddress?: string;
  itemCount?: number;
  totalWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  items?: any[];
}

export interface LiveCarrierRate {
  courierName: string;
  serviceType: string;
  courierServiceType: 'pickup' | 'dropoff';
  fee: number;
  estimatedDeliveryDays: string;
  isSameCity: boolean;
  isPayOnPickup?: boolean;
  hasDoorstepPickup: boolean;
  dropoffStation?: string;
  instructions: string;
  requestToken?: string;
  serviceCode?: string;
  courierId?: string;
}

export interface PackageRateResult {
  vendorId: string;
  vendorName: string;
  origin: string;
  destination: string;
  isSameCity: boolean;
  packageWeightKg: number;
  packageDimensions: string;
  serviceability: LocationServiceabilityResult;
  doorstep: LiveCarrierRate;
  parkPickup: LiveCarrierRate;
  motorParks: MotorParkTerminal[];
}

// Nigerian Geo-Regional Zones for accurate courier matrix
const REGIONS: Record<string, string> = {
  'Lagos': 'SouthWest',
  'Ogun': 'SouthWest',
  'Oyo': 'SouthWest',
  'Osun': 'SouthWest',
  'Ondo': 'SouthWest',
  'Ekiti': 'SouthWest',

  'FCT - Abuja': 'NorthCentral',
  'Abuja': 'NorthCentral',
  'Abuja (FCT)': 'NorthCentral',
  'Kwara': 'NorthCentral',
  'Kogi': 'NorthCentral',
  'Niger': 'NorthCentral',
  'Plateau': 'NorthCentral',
  'Nasarawa': 'NorthCentral',
  'Benue': 'NorthCentral',

  'Rivers': 'SouthSouth',
  'Delta': 'SouthSouth',
  'Edo': 'SouthSouth',
  'Akwa Ibom': 'SouthSouth',
  'Cross River': 'SouthSouth',
  'Bayelsa': 'SouthSouth',

  'Anambra': 'SouthEast',
  'Enugu': 'SouthEast',
  'Imo': 'SouthEast',
  'Abia': 'SouthEast',
  'Ebonyi': 'SouthEast',

  'Kano': 'NorthWest',
  'Kaduna': 'NorthWest',
  'Katsina': 'NorthWest',
  'Sokoto': 'NorthWest',
  'Kebbi': 'NorthWest',
  'Zamfara': 'NorthWest',
  'Jigawa': 'NorthWest',

  'Borno': 'NorthEast',
  'Bauchi': 'NorthEast',
  'Gombe': 'NorthEast',
  'Adamawa': 'NorthEast',
  'Yobe': 'NorthEast',
  'Taraba': 'NorthEast',
};

function normalizeState(stateName: string): string {
  const s = (stateName || '').toLowerCase().trim();
  if (s.includes('lagos')) return 'Lagos';
  if (s.includes('abuja') || s.includes('fct')) return 'Abuja (FCT)';
  if (s.includes('oyo') || s.includes('ibadan')) return 'Oyo';
  if (s.includes('ogun') || s.includes('abeokuta') || s.includes('ijebu')) return 'Ogun';
  if (s.includes('rivers') || s.includes('port harcourt')) return 'Rivers';
  if (s.includes('kano')) return 'Kano';
  if (s.includes('kaduna')) return 'Kaduna';
  if (s.includes('edo') || s.includes('benin')) return 'Edo';
  if (s.includes('delta') || s.includes('warri') || s.includes('asaba')) return 'Delta';
  if (s.includes('enugu')) return 'Enugu';
  if (s.includes('anambra') || s.includes('onitsha') || s.includes('awka')) return 'Anambra';
  if (s.includes('ondo') || s.includes('akure')) return 'Ondo';
  if (s.includes('osun') || s.includes('osogbo')) return 'Osun';
  if (s.includes('kwara') || s.includes('ilorin')) return 'Kwara';
  if (s.includes('plateau') || s.includes('jos')) return 'Plateau';
  if (s.includes('imo') || s.includes('owerri')) return 'Imo';
  if (s.includes('abia') || s.includes('aba')) return 'Abia';
  if (s.includes('akwa ibom') || s.includes('uyo')) return 'Akwa Ibom';
  if (s.includes('cross river') || s.includes('calabar')) return 'Cross River';

  const match = Object.keys(REGIONS).find(k => k.toLowerCase() === s);
  return match || 'Lagos';
}

export const WAYBILL_SAFETY_BUFFER = 300; // Flat ₦300 safety margin added to courier waybill

/**
 * Backward compatibility wrapper for existing imports
 */
export function estimateItemWeightKg(item: { name?: string; category?: string; weightKg?: number }): number {
  return getProductWeightProfile(item).weightKg;
}

// In-memory address cache to prevent repeated validation requests to Shipbubble
const addressCodeCache = new Map<string, number>();

/**
 * Validate and retrieve a Shipbubble address_code for a given address
 */
export async function getOrValidateAddressCode(
  apiKey: string,
  params: { name: string; email: string; phone: string; address: string; city: string; state: string }
): Promise<number | null> {
  const cleanState = normalizeState(params.state);
  const cleanCity = (params.city || 'Lagos').trim();
  const rawAddress = (params.address || cleanCity).trim();
  const cacheKey = `${rawAddress.toLowerCase()}_${cleanCity.toLowerCase()}_${cleanState.toLowerCase()}`;

  if (addressCodeCache.has(cacheKey)) {
    return addressCodeCache.get(cacheKey)!;
  }

  try {
    const formattedAddress = rawAddress.toLowerCase().includes('nigeria')
      ? rawAddress
      : `${rawAddress}, ${cleanCity}, ${cleanState}, Nigeria`;

    const res = await fetch('https://api.shipbubble.com/v1/shipping/address/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: params.name || 'IRISI Atelier',
        email: params.email || 'dispatch@irisi.ng',
        phone: params.phone || '+2348012345678',
        address: formattedAddress
      }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store'
    });

    const data = await res.json();
    if (data.status === 'success' && data.data?.address_code) {
      const code = Number(data.data.address_code);
      addressCodeCache.set(cacheKey, code);
      return code;
    }
  } catch (err) {
    console.warn('[Shipbubble API] Address validation call failed:', err);
  }
  return null;
}

/**
 * Fetch live rates from Shipbubble or Intelligent Nigerian Distance Matrix
 */
export async function calculateLiveShippingRate(pkg: PackageShippingRequest): Promise<PackageRateResult> {
  const originState = normalizeState(pkg.originState || 'Lagos');
  const originCity = (pkg.originCity || 'Lagos').trim();
  const destState = normalizeState(pkg.destinationState || 'Lagos');
  const destCity = (pkg.destinationCity || 'Lagos').trim();
  
  // Auto-calculate weight if not explicitly passed
  let packageWeight = Math.max(0.4, pkg.totalWeightKg || 0.8);
  let dimsText = `${pkg.lengthCm || 32}×${pkg.widthCm || 24}×${pkg.heightCm || 6}cm`;

  if (pkg.items && Array.isArray(pkg.items) && pkg.items.length > 0) {
    const computed = computeVendorPackageMetrics(pkg.items.map(i => ({ product: i.product || i, quantity: i.quantity || 1 })));
    packageWeight = computed.totalWeightKg;
    dimsText = `${computed.lengthCm}×${computed.widthCm}×${computed.heightCm}cm`;
  }

  // 1. Check Location Serviceability (Does this vendor city support courier door pickup?)
  const serviceability = checkLocationServiceability(originCity, originState);
  const destinationParks = getMotorParksForState(destState);
  const primaryPark = destinationParks[0];

  const isSameCity = !!(
    originCity.toLowerCase() === destCity.toLowerCase() ||
    (originState === destState && (
      originCity.toLowerCase().includes(destCity.toLowerCase()) ||
      destCity.toLowerCase().includes(originCity.toLowerCase())
    ))
  );

  const isSameState = originState.toLowerCase() === destState.toLowerCase();
  const originRegion = REGIONS[originState] || 'SouthWest';
  const destRegion = REGIONS[destState] || 'SouthWest';
  const isSameRegion = originRegion === destRegion;

  // Extra weight surcharge for packages exceeding standard 2kg tier (₦600 per extra kg)
  const extraWeightSurcharge = packageWeight > 2 ? Math.ceil(packageWeight - 2) * 600 : 0;

  // 2. Real Shipbubble Live Carrier API Integration
  const shipbubbleKey = process.env.SHIPBUBBLE_API_KEY;
  if (shipbubbleKey && !isSameCity) {
    try {
      const senderCode = await getOrValidateAddressCode(shipbubbleKey, {
        name: pkg.vendorName || 'IRISI Atelier',
        email: 'atelier@irisi.ng',
        phone: '+2348012345678',
        address: pkg.vendorAddress || `${originCity}, ${originState}`,
        city: originCity,
        state: originState
      });

      const receiverCode = await getOrValidateAddressCode(shipbubbleKey, {
        name: 'IRISI Customer',
        email: 'shopper@irisi.ng',
        phone: '+2348098765432',
        address: pkg.deliveryAddress || `${destCity}, ${destState}`,
        city: destCity,
        state: destState
      });

      if (senderCode && receiverCode) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pickupDate = tomorrow.toISOString().split('T')[0];

        const packageItems = (pkg.items && pkg.items.length > 0)
          ? pkg.items.map(item => {
              const p = item.product || item;
              const unitWeight = estimateItemWeightKg(p);
              return {
                name: p.name || 'Garment Piece',
                description: `${p.category || 'Apparel'} (${p.vendorName || 'Atelier'})`,
                unit_weight: Number(unitWeight.toFixed(2)),
                unit_amount: Number(p.price || 20000),
                quantity: Number(item.quantity || 1)
              };
            })
          : [
              {
                name: 'Fashion Garment Package',
                description: 'Tailored Luxury Fashion',
                unit_weight: Number(packageWeight.toFixed(2)),
                unit_amount: 35000,
                quantity: 1
              }
            ];

        const response = await fetch('https://api.shipbubble.com/v1/shipping/fetch_rates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${shipbubbleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender_address_code: senderCode,
            reciever_address_code: receiverCode,
            pickup_date: pickupDate,
            category_id: 74794423, // Shipbubble official "Fashion wears" category ID
            package_items: packageItems,
            package_dimension: {
              length: pkg.lengthCm || 32,
              width: pkg.widthCm || 24,
              height: pkg.heightCm || 6
            }
          }),
          signal: AbortSignal.timeout(5000),
          cache: 'no-store'
        });

        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data?.couriers) && data.data.couriers.length > 0) {
          const bestCourier = data.data.cheapest_courier || data.data.couriers[0];
          const rawFee = Number(bestCourier.total) || Number(bestCourier.rate_card_amount) || 4500;
          const courierServiceType: 'pickup' | 'dropoff' = bestCourier.service_type === 'dropoff' ? 'dropoff' : 'pickup';
          const dropStation = bestCourier.dropoff_station?.name || serviceability.nearestStationRecommendation;

          return {
            vendorId: pkg.vendorId,
            vendorName: pkg.vendorName,
            origin: `${originCity}, ${originState}`,
            destination: `${destCity}, ${destState}`,
            isSameCity: false,
            packageWeightKg: packageWeight,
            packageDimensions: dimsText,
            serviceability: {
              ...serviceability,
              hasDoorstepPickup: courierServiceType === 'pickup',
              serviceType: courierServiceType,
              badgeLabel: courierServiceType === 'pickup' ? 'Shipbubble Door Pickup Active' : 'Courier Station Drop-off',
              instructionToVendor: courierServiceType === 'pickup'
                ? `Assigned courier (${bestCourier.courier_name}) will pick up directly from your atelier.`
                : `Assigned courier (${bestCourier.courier_name}) operates drop-off in ${originCity}. Drop off at ${dropStation}.`
            },
            doorstep: {
              courierName: bestCourier.courier_name || 'GIG Logistics / Fez Delivery',
              serviceType: courierServiceType === 'pickup' ? 'Doorstep Express Courier' : 'Courier Station Drop-off',
              courierServiceType,
              fee: Math.round(rawFee) + WAYBILL_SAFETY_BUFFER,
              estimatedDeliveryDays: bestCourier.delivery_eta || '2-4 business days',
              isSameCity: false,
              hasDoorstepPickup: courierServiceType === 'pickup',
              dropoffStation: courierServiceType === 'dropoff' ? dropStation : undefined,
              instructions: courierServiceType === 'pickup'
                ? `${bestCourier.courier_name} rider will collect from your atelier address.`
                : `Drop parcel off at ${dropStation}. Delivered directly to buyer's doorstep.`,
              requestToken: data.data.request_token,
              serviceCode: bestCourier.service_code,
              courierId: String(bestCourier.courier_id)
            },
            parkPickup: {
              courierName: `${primaryPark?.name || 'Interstate Bus'} Waybill`,
              serviceType: 'Pay Driver on Collection',
              courierServiceType: 'dropoff',
              fee: 0,
              estimatedDeliveryDays: '1-2 business days',
              isSameCity: false,
              isPayOnPickup: true,
              hasDoorstepPickup: false,
              dropoffStation: `Destination: ${primaryPark?.name}`,
              instructions: `Drop at local interstate park. Hand to bus driver heading to ${destCity}. Customer collects and pays driver directly.`
            },
            motorParks: destinationParks
          };
        }
      }
    } catch (err) {
      console.warn('[Logistics API] Shipbubble live rate call failed, using Nigerian distance matrix fallback:', err);
    }
  }

  // 3. High-Accuracy Nigerian Matrix Engine (All include +₦300 Waybill Buffer)
  let baseDoorstepFee = 4500;
  let deliveryEta = '2-4 business days';
  let courierName = 'GIG Logistics / Red Star Express';

  if (isSameCity) {
    baseDoorstepFee = 1500;
    deliveryEta = 'Same-day / 24h Express';
    courierName = 'Direct Dispatch Rider (Local)';
  } else if (isSameState) {
    baseDoorstepFee = 2200;
    deliveryEta = '1-2 business days';
    courierName = 'Intra-State Express Courier (Fez / GIGL)';
  } else if (isSameRegion) {
    baseDoorstepFee = 2800;
    deliveryEta = '1-2 business days';
    courierName = 'Regional Linehaul Drop (GIG Logistics)';
  } else if (
    (originRegion === 'SouthWest' && destRegion === 'NorthCentral') ||
    (originRegion === 'NorthCentral' && destRegion === 'SouthWest') ||
    (originRegion === 'SouthWest' && destRegion === 'SouthSouth')
  ) {
    baseDoorstepFee = 3800;
    deliveryEta = '2-3 business days';
    courierName = 'Interstate Linehaul (GIG Logistics / DHL)';
  } else {
    baseDoorstepFee = 4800;
    deliveryEta = '3-5 business days';
    courierName = 'National Express (DHL / Fez Interstate)';
  }

  const finalDoorstepFee = baseDoorstepFee + WAYBILL_SAFETY_BUFFER + extraWeightSurcharge;
  const doorstepServiceType: 'pickup' | 'dropoff' = serviceability.hasDoorstepPickup ? 'pickup' : 'dropoff';

  return {
    vendorId: pkg.vendorId,
    vendorName: pkg.vendorName,
    origin: `${originCity}, ${originState}`,
    destination: `${destCity}, ${destState}`,
    isSameCity,
    packageWeightKg: packageWeight,
    packageDimensions: dimsText,
    serviceability,
    doorstep: {
      courierName,
      serviceType: isSameCity
        ? 'Direct Dispatch Rider'
        : doorstepServiceType === 'pickup'
        ? 'Doorstep Express Courier'
        : 'Courier Office Drop-off',
      courierServiceType: doorstepServiceType,
      fee: finalDoorstepFee,
      estimatedDeliveryDays: deliveryEta,
      isSameCity,
      hasDoorstepPickup: doorstepServiceType === 'pickup',
      dropoffStation: doorstepServiceType === 'dropoff' ? serviceability.nearestStationRecommendation : undefined,
      instructions: doorstepServiceType === 'pickup'
        ? 'Courier rider will arrive at your workshop to pick up the parcel.'
        : `Door pickup unavailable in ${originCity}. Drop off at nearest ${serviceability.nearestStationRecommendation}.`
    },
    parkPickup: {
      courierName: `${primaryPark?.name || 'Motor Park Bus'} Waybill`,
      serviceType: 'Pay Driver on Collection',
      courierServiceType: 'dropoff',
      fee: 0,
      estimatedDeliveryDays: isSameCity ? 'N/A (Use Direct Rider)' : '1-2 business days (Overnight Bus)',
      isSameCity,
      isPayOnPickup: true,
      hasDoorstepPickup: false,
      dropoffStation: `Destination: ${primaryPark?.name}`,
      instructions: `Drop parcel at local interstate park. Customer picks up at ${primaryPark?.name} and pays the collection fee.`
    },
    motorParks: destinationParks
  };
}

export interface ShipmentBookingRequest {
  orderNumber: string;
  orderId?: string;
  vendorId?: string;
  vendorName: string;
  vendorPhone: string;
  vendorAddress: string;
  vendorCity: string;
  vendorState: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryMethod?: 'doorstep' | 'park_pickup';
  courierName?: string;
  selectedParkTerminal?: string;
  itemCount?: number;
  totalWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  requestToken?: string;
  serviceCode?: string;
  courierId?: string;
  items?: any[];
}

export interface ShipmentBookingResult {
  success: boolean;
  error?: string;
  trackingNumber: string;
  waybillNumber: string;
  courierName: string;
  deliveryMethod: 'doorstep' | 'park_pickup';
  courierServiceType: 'pickup' | 'dropoff';
  trackingUrl: string;
  status: string;
  shipmentId?: string;
  instructions: string;
  dropoffStation?: string;
}

/**
 * Dispatch automated courier pickup via Shipbubble (GIG Logistics, Fez, Red Star)
 * or generate verified Motor Park Waybill code
 */
export async function createShipbubbleShipment(req: ShipmentBookingRequest): Promise<ShipmentBookingResult> {
  const isPark = req.deliveryMethod === 'park_pickup';

  // Check if vendor's address has doorstep pickup
  const serviceability = checkLocationServiceability(req.vendorCity, req.vendorState);
  const courierServiceType: 'pickup' | 'dropoff' = (!isPark && serviceability.hasDoorstepPickup) ? 'pickup' : 'dropoff';

  const shipbubbleKey = process.env.SHIPBUBBLE_API_KEY;

  if (shipbubbleKey && !isPark && req.requestToken && req.serviceCode && req.courierId) {
    try {
      const response = await fetch('https://api.shipbubble.com/v1/shipping/labels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${shipbubbleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_token: req.requestToken,
          service_code: req.serviceCode,
          courier_id: req.courierId
        }),
        signal: AbortSignal.timeout(6000),
        cache: 'no-store'
      });

      const data = await response.json();
      if (data.status === 'success' && data.data) {
        const resolvedTracking = data.data.order_id || data.data.tracking_number || data.data.waybill_number || '';
        const courierAssigned = data.data.courier?.name || req.courierName || 'Shipbubble Courier';
        return {
          success: true,
          trackingNumber: resolvedTracking,
          waybillNumber: resolvedTracking,
          courierName: courierAssigned,
          deliveryMethod: 'doorstep',
          courierServiceType,
          trackingUrl: data.data.tracking_url || (resolvedTracking ? `https://app.shipbubble.com/track/${resolvedTracking}` : ''),
          status: courierServiceType === 'pickup' ? 'pickup_scheduled' : 'ready_for_dropoff',
          shipmentId: data.data.order_id || resolvedTracking,
          instructions: courierServiceType === 'pickup'
            ? `Courier rider (${courierAssigned}) will arrive at your workshop to collect the parcel.`
            : `Drop off parcel at nearest station. Courier will deliver to customer.`,
          dropoffStation: serviceability.nearestStationRecommendation
        };
      }

      // Shipbubble returned an explicit failure (e.g., Insufficient wallet balance)
      const errorMsg = data.message || data.error || 'Shipbubble shipment label could not be created';
      return {
        success: false,
        error: errorMsg,
        trackingNumber: '',
        waybillNumber: '',
        courierName: req.courierName || 'Shipbubble Courier',
        deliveryMethod: 'doorstep',
        courierServiceType,
        trackingUrl: '',
        status: 'label_pending_wallet',
        instructions: `Label creation pending: ${errorMsg}. Dispatch will proceed once funded.`,
        dropoffStation: serviceability.nearestStationRecommendation
      };
    } catch (err: any) {
      console.warn('[Logistics API] Shipbubble label creation call failed:', err);
      return {
        success: false,
        error: err.message || 'Network error connecting to Shipbubble API',
        trackingNumber: '',
        waybillNumber: '',
        courierName: req.courierName || 'Shipbubble Courier',
        deliveryMethod: 'doorstep',
        courierServiceType,
        trackingUrl: '',
        status: 'booking_network_error',
        instructions: 'Could not connect to courier gateway. Will retry automatically.',
        dropoffStation: serviceability.nearestStationRecommendation
      };
    }
  }

  // Motor Park Waybill
  if (isPark) {
    const terminalName = req.selectedParkTerminal || `${req.deliveryState} Central Motor Park`;
    return {
      success: true,
      trackingNumber: '',
      waybillNumber: '',
      courierName: `${terminalName} (Interstate Bus Waybill)`,
      deliveryMethod: 'park_pickup',
      courierServiceType: 'dropoff',
      trackingUrl: `/track-order?orderNumber=${encodeURIComponent(req.orderNumber)}`,
      status: 'pending_packaging',
      instructions: `Package garment and drop at your local interstate bus park. Hand to driver heading to ${terminalName}. Customer pays collection fee upon arrival.`,
      dropoffStation: terminalName
    };
  }

  // Doorstep Courier without token or offline
  return {
    success: false,
    error: 'No valid courier booking token provided.',
    trackingNumber: '',
    waybillNumber: '',
    courierName: req.courierName || 'Pending Courier Assignment',
    deliveryMethod: 'doorstep',
    courierServiceType,
    trackingUrl: '',
    status: 'pending_booking',
    instructions: `${req.courierName || 'Assigned courier'} dispatch rider will arrive at your registered atelier address once label is generated.`,
    dropoffStation: serviceability.nearestStationRecommendation
  };
}
