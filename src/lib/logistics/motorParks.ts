/**
 * ÌRÍSÍ Nigerian Logistics - Interstate Motor Park Terminals & Hub Serviceability Directory
 * 
 * Maps verified inter-state transport terminals across all Nigerian states for
 * Park Pickup / Waybill services, as well as serviceability checks for courier door pickup.
 */

export interface MotorParkTerminal {
  id: string;
  name: string;
  state: string;
  city: string;
  landmark: string;
  popularLines: string[];
  estimatedDays: string;
  defaultWaybillFee: number;
}

export const NIGERIAN_MOTOR_PARKS: Record<string, MotorParkTerminal[]> = {
  'Lagos': [
    {
      id: 'lag-ojota',
      name: 'Ojota New Garage & Inter-State Terminal',
      state: 'Lagos',
      city: 'Ojota',
      landmark: 'Along Ikorodu Road, Ojota Inter-State Central',
      popularLines: ['Peace Mass', 'Young Shall Grow', 'GIGM', 'GUO Transport'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1500,
    },
    {
      id: 'lag-jibowu',
      name: 'Jibowu Luxury Bus Terminal (Yaba/Fadeyi)',
      state: 'Lagos',
      city: 'Yaba / Jibowu',
      landmark: 'Ikorodu Road Corridor, Jibowu',
      popularLines: ['ABC Transport', 'Chisco', 'God Bless Ezenwata', 'Ekeson'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 2000,
    },
    {
      id: 'lag-oshodi',
      name: 'Oshodi Transport Interchange (Terminal 3)',
      state: 'Lagos',
      city: 'Oshodi',
      landmark: 'Terminal 3 Inter-State Bus Hub',
      popularLines: ['GIGM', 'Oshodi Inter-State Co-op'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1500,
    },
    {
      id: 'lag-mazamaza',
      name: 'Maza Maza / Mile 2 Inter-State Terminal',
      state: 'Lagos',
      city: 'Mile 2 / Amuwo',
      landmark: 'Badagry Expressway, Maza Maza Park',
      popularLines: ['Young Shall Grow', 'GUO', 'Peace Mass'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1500,
    },
  ],

  'Abuja (FCT)': [
    {
      id: 'abj-utako',
      name: 'Utako Ultra-Modern Motor Park & Terminal',
      state: 'Abuja (FCT)',
      city: 'Utako District',
      landmark: 'Opposite Arab Contractors, Utako',
      popularLines: ['GIGM', 'Peace Mass', 'ABC Transport', 'Young Shall Grow'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 2000,
    },
    {
      id: 'abj-jabi',
      name: 'Jabi Central Motor Park',
      state: 'Abuja (FCT)',
      city: 'Jabi',
      landmark: 'Near Jabi Lake Mall corridor, Obafemi Awolowo Way',
      popularLines: ['Kano Line', 'Kaduna Express', 'Plateau Riders'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1800,
    },
  ],

  'Oyo': [
    {
      id: 'oyo-iworoad',
      name: 'Iwo Road Inter-State Interchange Terminal',
      state: 'Oyo',
      city: 'Ibadan',
      landmark: 'Iwo Road Roundabout Inter-State Line',
      popularLines: ['Peace Mass', 'Oyo Express', 'GIGM Ibadan Hub'],
      estimatedDays: '1 business day',
      defaultWaybillFee: 1500,
    },
    {
      id: 'oyo-ojoo',
      name: 'Ojoo Northern Expressway Motor Park',
      state: 'Oyo',
      city: 'Ibadan (Ojoo)',
      landmark: 'Lagos-Ibadan Expressway Northern Exit',
      popularLines: ['Abuja Intercity', 'Kwara Shuttle'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1500,
    },
  ],

  'Rivers': [
    {
      id: 'riv-waterlines',
      name: 'Waterlines Bus Terminal & GIGM Hub',
      state: 'Rivers',
      city: 'Port Harcourt',
      landmark: 'Aba Road, Waterlines Junction, PH',
      popularLines: ['GIGM', 'ABC Transport', 'Peace Mass'],
      estimatedDays: '2-3 business days',
      defaultWaybillFee: 2200,
    },
    {
      id: 'riv-mile1',
      name: 'Mile 1 Central Park (Diobu)',
      state: 'Rivers',
      city: 'Port Harcourt',
      landmark: 'Ikwerre Road, Mile 1 Diobu',
      popularLines: ['Young Shall Grow', 'God Bless Ezenwata'],
      estimatedDays: '2-3 business days',
      defaultWaybillFee: 2000,
    },
  ],

  'Anambra': [
    {
      id: 'ana-upperiweka',
      name: 'Upper Iweka Central Transport Hub',
      state: 'Anambra',
      city: 'Onitsha',
      landmark: 'Onitsha-Enugu Expressway, Upper Iweka Flyover',
      popularLines: ['GUO Transport', 'Peace Mass', 'Young Shall Grow', 'Ezenwata'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1800,
    },
  ],

  'Enugu': [
    {
      id: 'enu-holyghost',
      name: 'Holy Ghost Cathedral Inter-State Park',
      state: 'Enugu',
      city: 'Enugu Central',
      landmark: 'Near Railway Station, Holy Ghost Roundabout',
      popularLines: ['Peace Mass Transit HQ', 'Royal Mass', 'Young Shall Grow'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1800,
    },
  ],

  'Kano': [
    {
      id: 'kan-sabongari',
      name: 'Sabon Gari Luxury Bus Terminal',
      state: 'Kano',
      city: 'Kano (Sabon Gari)',
      landmark: 'France Road / New Road, Sabon Gari',
      popularLines: ['Kano State Transport', 'Chisco', 'Young Shall Grow'],
      estimatedDays: '2-3 business days',
      defaultWaybillFee: 2500,
    },
  ],

  'Edo': [
    {
      id: 'edo-oluku',
      name: 'Oluku Inter-State Bus Terminal',
      state: 'Edo',
      city: 'Benin City',
      landmark: 'Benin-Ore Expressway, Oluku Junction',
      popularLines: ['GIGM Central Hub', 'Edo City Transport'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1800,
    },
  ],

  'Ogun': [
    {
      id: 'ogu-kuto',
      name: 'Kuto Central Motor Park Abeokuta',
      state: 'Ogun',
      city: 'Abeokuta',
      landmark: 'Kuto Roundabout, Abeokuta',
      popularLines: ['Gateway Transit', 'Lagos Intercity'],
      estimatedDays: '1 business day',
      defaultWaybillFee: 1400,
    },
    {
      id: 'ogu-ijebu',
      name: 'Ijebu-Ode Central Inter-State Park',
      state: 'Ogun',
      city: 'Ijebu-Ode',
      landmark: 'Expressway Bypass, Ibadan Road Ijebu-Ode',
      popularLines: ['Ogun Eastern Shuttle', 'Peace Mass Stop'],
      estimatedDays: '1 business day',
      defaultWaybillFee: 1400,
    },
  ],

  'Kwara': [
    {
      id: 'kwa-maraba',
      name: 'Maraba Motor Park Ilorin',
      state: 'Kwara',
      city: 'Ilorin',
      landmark: 'Muritala Mohammed Way, Maraba, Ilorin',
      popularLines: ['Kwara Express', 'Peace Mass'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1700,
    },
  ],

  'Delta': [
    {
      id: 'del-asaba',
      name: 'Asaba Inter-State Bus Terminal',
      state: 'Delta',
      city: 'Asaba',
      landmark: 'Benin-Onitsha Expressway Corridor, Asaba',
      popularLines: ['GIGM', 'Agofure', 'Peace Mass'],
      estimatedDays: '1-2 business days',
      defaultWaybillFee: 1900,
    },
  ],

  'Kaduna': [
    {
      id: 'kad-mando',
      name: 'Mando Central Transport Terminal',
      state: 'Kaduna',
      city: 'Kaduna (Mando)',
      landmark: 'Mando Airport Road, Kaduna North',
      popularLines: ['Kaduna Express', 'GIGM Kaduna', 'Kano Lines'],
      estimatedDays: '2-3 business days',
      defaultWaybillFee: 2200,
    },
  ],
};

/**
 * Returns available motor park terminals for a given Nigerian state
 */
export function getMotorParksForState(stateName: string): MotorParkTerminal[] {
  const s = (stateName || '').toLowerCase().trim();

  for (const [key, parks] of Object.entries(NIGERIAN_MOTOR_PARKS)) {
    if (key.toLowerCase() === s || s.includes(key.toLowerCase()) || key.toLowerCase().includes(s)) {
      return parks;
    }
  }

  // Fallback default state terminal if exact state is not in custom dictionary
  const cleanState = stateName || 'Destination State';
  return [
    {
      id: `park-${cleanState.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: `${cleanState} Central Inter-State Bus Terminal`,
      state: cleanState,
      city: 'State Capital Central Terminal',
      landmark: 'Main Inter-State Motor Park Waybill Station',
      popularLines: ['Peace Mass', 'GIGM', 'State Line Transit'],
      estimatedDays: '2-3 business days',
      defaultWaybillFee: 1800,
    },
  ];
}

/**
 * Serviceability Engine:
 * Identifies whether a vendor's registered city supports Doorstep Courier Pickup
 * (where a dispatch rider comes to the vendor's workshop)
 * or requires Drop-off at Courier Office (GIG/DHL) or Motor Park.
 */
const DOORSTEP_PICKUP_HUBS = [
  // Lagos (Full Coverage)
  'lagos', 'ikeja', 'victoria island', 'vi', 'lekki', 'ikoyi', 'yaba', 'surulere',
  'maryland', 'gbagada', 'magodo', 'ogba', 'agege', 'oshodi', 'isolo',
  'ajah', 'chevron', 'sangotedo', 'ilupeju', 'marina', 'festac', 'alaba', 'ipaja',
  // Abuja FCT (Full Core Coverage)
  'abuja', 'fct', 'maitama', 'wuse', 'garki', 'asokoro', 'utako', 'jabi', 'gwarinpa',
  'cbd', 'central business district', 'apo', 'guzape', 'life camp', 'lugbe',
  // Rivers
  'port harcourt', 'gra', 'trans-amadi', 'd-line',
  // Oyo
  'ibadan', 'bodija', 'dugbe', 'jericho', 'ring road',
  // Kano
  'kano', 'kano municipal', 'nassarawa', 'fagge',
  // Edo
  'benin', 'benin city', 'gra benin',
  // Delta
  'asaba', 'warri',
  // Enugu
  'enugu', 'enugu central', 'independence layout',
];

export interface LocationServiceabilityResult {
  hasDoorstepPickup: boolean;
  serviceType: 'pickup' | 'dropoff';
  statusBadge: 'green' | 'amber';
  badgeLabel: string;
  instructionToVendor: string;
  nearestStationRecommendation: string;
}

export function checkLocationServiceability(
  city: string,
  state: string
): LocationServiceabilityResult {
  const c = (city || '').toLowerCase().trim();
  const s = (state || '').toLowerCase().trim();

  // Lagos and Abuja core have guaranteed doorstep dispatch riders anywhere
  const isLagos = s.includes('lagos') || c.includes('lagos');
  const isAbuja = s.includes('abuja') || s.includes('fct') || c.includes('abuja');

  const matchesHub = DOORSTEP_PICKUP_HUBS.some(
    (hub) => c.includes(hub) || hub.includes(c)
  );

  if (isLagos || isAbuja || matchesHub) {
    return {
      hasDoorstepPickup: true,
      serviceType: 'pickup',
      statusBadge: 'green',
      badgeLabel: 'Doorstep Courier Pickup Active',
      instructionToVendor:
        'Dispatch rider will arrive at your registered atelier address to collect the parcel.',
      nearestStationRecommendation: 'Direct Rider Pickup at Atelier',
    };
  }

  if (matchesHub) {
    return {
      hasDoorstepPickup: true,
      serviceType: 'pickup',
      statusBadge: 'green',
      badgeLabel: 'Doorstep Courier Pickup Active',
      instructionToVendor:
        'Courier rider will collect the package directly from your workshop.',
      nearestStationRecommendation: 'Direct Rider Pickup at Atelier',
    };
  }

  // Non-core area or satellite town: Vendor drops at local courier office or motor park
  const stateParks = getMotorParksForState(state);
  const recommendedStation =
    stateParks[0]?.name || `${state} Courier Drop-off Terminal`;

  return {
    hasDoorstepPickup: false,
    serviceType: 'dropoff',
    statusBadge: 'amber',
    badgeLabel: 'Courier Drop-off / Park Terminal Only',
    instructionToVendor: `Doorstep dispatch rider pickup is not yet available in your neighborhood (${city}). Drop off at your nearest GIG/DHL station or ${recommendedStation}.`,
    nearestStationRecommendation: recommendedStation,
  };
}
