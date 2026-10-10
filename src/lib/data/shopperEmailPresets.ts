// Fun, stylish Nigerian presets for Admin Shopper Communications

export interface ShopperEmailPreset {
  id: string;
  label: string;
  badgeText: string;
  subject: string;
  headline: string;
  bodyText: string;
  buttonLabel: string;
  buttonUrl: string;
}

export const SHOPPER_EMAIL_PRESETS: ShopperEmailPreset[] = [
  {
    id: 'weekend_vibes',
    label: '🎉 Weekend Drip & Fresh Drops',
    badgeText: '✨ WEEKEND LOOKBOOK & DRIP',
    subject: 'Weekend Drip Alert! Fresh Senator Sets & Boutique Drops on ÌRÍSÍ 🔥',
    headline: 'Your Weekend Look Is Waiting For You! 🙌',
    bodyText: `The weekend is here, and you know how we do it on ÌRÍSÍ! Verified Nigerian designers have just refreshed their racks with sharp Senator sets, luxury kaftans, and stylish pieces for your wardrobe.

Whether you have an owambe, an evening dinner, or relaxed Sunday vibes, every piece is tailored to perfection and 100% Escrow Protected.

No stress, no stories. Step into your best look today!`,
    buttonLabel: 'Shop Weekend Drip Now',
    buttonUrl: 'https://irisimi-nig.vercel.app/shop',
  },
  {
    id: 'new_month',
    label: '✨ Happy New Month Greetings',
    badgeText: '🥂 NEW MONTH CELEBRATION',
    subject: 'Happy New Month from the ÌRÍSÍ Family! 🌟 More Blessings & Fresh Fits',
    headline: 'Happy New Month! May Your Month Be Full of Wins & Good Drip ✨',
    bodyText: `Welcome to a brand new month! From all of us at ÌRÍSÍ, we pray this new month brings you prosperity, good health, and peace of mind.

To celebrate with you, our verified fashion houses have dropped exclusive new month collections. Check out the latest bespoke native wears and trending footwear.

Thank you for being part of our luxury family!`,
    buttonLabel: 'Explore New Month Collections',
    buttonUrl: 'https://irisimi-nig.vercel.app/shop',
  },
  {
    id: 'apology_bonus',
    label: '🙏 Order Check-in & Apology',
    badgeText: '💌 COURTESY CHECK-IN',
    subject: 'A Quick Word From the ÌRÍSÍ Team Regarding Your Order 🙏',
    headline: 'We Truly Value You · VIP Courtesy Check-In',
    bodyText: `Hello! We wanted to personally reach out from the ÌRÍSÍ platform management team to check on you and make sure your experience with us was top-notch.

If you experienced any slight delay or hitch with interstate transit, please accept our sincere apologies. We hold our designers and logistics partners to the highest standards.

Your satisfaction is our number one priority. If you need any assistance, our VIP Concierge team is always active on WhatsApp to assist you immediately!`,
    buttonLabel: 'Chat with Concierge on WhatsApp',
    buttonUrl: 'https://wa.me/2349070332145',
  },
  {
    id: 'vip_exclusive',
    label: '💎 VIP Early Access Drop',
    badgeText: '👑 VIP EARLY ACCESS',
    subject: 'Exclusive VIP Access: Limited Designer Pieces Just Landed 💎',
    headline: 'You Have Early Access to Limited Boutique Pieces!',
    bodyText: `As one of our valued clients on ÌRÍSÍ, we are giving you first access to limited bespoke drops before they open to the public marketplace.

These pieces are crafted in limited quantities with premium authentic fabrics. Once they are gone, that's it!

Step into your best look with zero stress. Remember, every purchase is 100% secured by ÌRÍSÍ Escrow until you receive and approve it.`,
    buttonLabel: 'Claim Your VIP Fit',
    buttonUrl: 'https://irisimi-nig.vercel.app/shop',
  },
  {
    id: 'custom_blank',
    label: '✍️ Custom Freeform Message',
    badgeText: '👑 ÌRÍSÍ EXECUTIVE NOTICE',
    subject: 'Special Update from ÌRÍSÍ Luxury Fashion',
    headline: 'A Special Message For You from ÌRÍSÍ',
    bodyText: 'Type your custom message here...',
    buttonLabel: 'Visit ÌRÍSÍ Marketplace',
    buttonUrl: 'https://irisimi-nig.vercel.app/shop',
  }
];
