const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Site Information
  siteName: {
    type: String,
    default: 'SBMI - Shree Bhanwal Mata Industries'
  },
  tagline: {
    type: String,
    default: 'Premium Quality Spices'
  },
  // branding links
  companyLogo: {
    public_id: String,
    url: String
  },
  favIcon: {
    public_id: String,
    url: String
  },
  
  // Contact Information
  supportEmail: {
    type: String,
    default: 'support@sbmi.com'
  },
  supportPhone: {
    type: String,
    default: '+91-XXXXXXXXXX'
  },
  companyAddress: {
    type: String,
    default: 'Baliali, Punjab, India'
  },
  /** Shown in header when the user has no saved address (e.g. "Ships across India" or your warehouse city) */
  deliveryAreaLabel: {
    type: String,
    default: ''
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    linkedin: String
  },

  // SEO & Analytics
  metaTitle: {
    type: String,
    default: 'SBMI - Shree Bhanwal Mata Industries'
  },
  metaDescription: {
    type: String,
    default: 'Premium Quality Spices and Food Products'
  },
  metaKeywords: String,
  googleAnalyticsId: String,

  // UI Content
  footerText: {
    type: String,
    default: '© 2024 SBMI - Shree Bhanwal Mata Industries. All Rights Reserved.'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  
  // Payment Settings
  codEnabled: {
    type: Boolean,
    default: true
  },
  onlinePaymentsEnabled: {
    type: Boolean,
    default: true
  },
  codMinOrder: {
    type: Number,
    default: 0
  },
  codMaxOrder: {
    type: Number,
    default: 50000
  },
  codExtraFee: {
    type: Number,
    default: 0
  },
  
  // Policies
  refundPolicyText: {
    type: String,
    default: 'We offer 7-day return and refund policy on selected products.'
  },
  shippingPolicyText: {
    type: String,
    default: 'We ship within 2-3 business days.'
  },
  privacyPolicyText: String,
  termsAndConditionsText: String,
  
  // Other Settings
  gstNumber: String,
  fssaiNumber: String,

  // Homepage Settings
  homepageDealsHeader: {
    type: String,
    default: '🔥 SBMI Smart Deals | Spices & Pantry'
  },
  homepageRecommendationMode: {
    type: String,
    default: 'personalized'
  },
  homepageCategories: {
    type: [
      {
        title: String,
        badge: String,
        img: String,
        category: String
      }
    ],
    default: [
      {
        title: 'Premium Spices',
        badge: '🌶️ Hot Deals',
        img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400',
        category: 'Spices'
      },
      {
        title: 'Spice Powders',
        badge: '🧂 Pure Ground',
        img: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400',
        category: 'Powders'
      },
      {
        title: 'Gourmet Blends',
        badge: '🥘 Rich Masalas',
        img: 'https://images.unsplash.com/photo-1532336414038-cf190733eb37?auto=format&fit=crop&q=80&w=400',
        category: 'Blends'
      },
      {
        title: 'Organic Pantry',
        badge: '🌿 100% Organic',
        img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
        category: 'Organic'
      }
    ]
  },
  
  // Product Offers (replaces dummy hardcoded offers on product page)
  productOffers: {
    type: [
      {
        title: String,
        description: String
      }
    ],
    default: [
      {
        title: 'Cashback',
        description: 'Up to ₹50.00 cashback as SBMI Pay Balance.'
      },
      {
        title: 'Bank Offer',
        description: '10% instant discount on major Bank Credit Cards.'
      },
      {
        title: 'Partner Offers',
        description: 'Get GST invoice and save up to 18% on business purchases.'
      }
    ]
  },
  
  // Dynamic Bulk Business Card on Homepage
  bulkBusinessCard: {
    title: { type: String, default: 'SBMI Bulk Business' },
    description: { type: String, default: 'Register your business and save up to 18% GST input tax credit plus volume discounts on bulk masala ordering!' },
    badge1: { type: String, default: '⚡ GST Invoice' },
    badge2: { type: String, default: '📦 Catering Packs' },
    buttonText: { type: String, default: 'Register Wholesale Account' },
    link: { type: String, default: '/login' },
    isActive: { type: Boolean, default: true }
  },

  // Homepage Deals Cards Settings
  homepageCards: {
    card1: {
      title: { type: String, default: 'Continue Shopping Deals' },
      isActive: { type: Boolean, default: true }
    },
    card2: {
      title: { type: String, default: 'SBMI Hot Deals' },
      isActive: { type: Boolean, default: true }
    },
    dealOfDay: {
      title: { type: String, default: 'Deal of the Day' },
      isActive: { type: Boolean, default: true }
    }
  },

  // Default Hero Gradient for when ads are empty
  defaultHeroGradient: {
    type: String,
    default: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  },

  // Footer Directory Links
  footerLinks: {
    type: [
      {
        title: String,
        links: [{ label: String, url: String }]
      }
    ],
    default: [
      {
        title: 'Get to Know Us',
        links: [
          { label: 'About Us', url: '/about' },
          { label: 'Careers', url: '/careers' },
          { label: 'Press Releases', url: '/press' },
          { label: 'SBMI Science', url: '/about' }
        ]
      },
      {
        title: 'Make Money with Us',
        links: [
          { label: 'Sell on SBMI', url: '/login' },
          { label: 'Sell under Accelerator', url: '/login' },
          { label: 'Protect & Build Your Brand', url: '/login' },
          { label: 'Global Trade Supply', url: '/login' }
        ]
      },
      {
        title: 'Let Us Help You',
        links: [
          { label: 'Your Account', url: '/profile' },
          { label: 'Returns Centre', url: '/orders' },
          { label: 'Help & Support', url: '/support' },
          { label: '100% Purchase Protection', url: '/terms' }
        ]
      }
    ]
  },

  // Homepage Feature Trust Badges (the bar with Free Delivery, 100% Authentic, etc.)
  featureBadges: {
    type: [
      {
        icon: { type: String, default: '🚚' },
        title: { type: String },
        subtitle: { type: String },
        isActive: { type: Boolean, default: true }
      }
    ],
    default: [
      { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500', isActive: true },
      { icon: '✓', title: '100% Authentic', subtitle: 'Premium quality guaranteed', isActive: true },
      { icon: '↻', title: 'Easy Returns', subtitle: '7-day return policy', isActive: true },
      { icon: '🔒', title: 'Secure Payments', subtitle: 'Safe & encrypted checkout', isActive: true }
    ]
  },

  // Configurable Section Headings for homepage
  sectionHeadings: {
    dealsSubtitle: { type: String, default: 'AI-calibrated loss-proof discounts based on stock levels, seller ratings, and trust reviews' },
    browsingHistoryTitle: { type: String, default: '🍂 Based on your browsing history' },
    browsingHistorySubtitle: { type: String, default: 'Top recommendations curated dynamically by your trust patterns' },
    newsletterTitle: { type: String, default: 'Stay Updated!' },
    newsletterSubtitle: { type: String, default: 'Subscribe to our newsletter for exclusive offers and updates' }
  },

  // Footer Bottom Legal Links
  footerLegalLinks: {
    type: [{ label: String, url: String }],
    default: [
      { label: 'Conditions of Use', url: '/terms' },
      { label: 'Privacy Notice', url: '/privacy' },
      { label: 'Shipping & Returns', url: '/shipping' }
    ]
  },

  // About Page Content
  aboutPageContent: {
    storyText: { type: String, default: '' },
    missionText: { type: String, default: '' },
    whyChooseUs: {
      type: [{ icon: String, title: String, description: String }],
      default: [
        { icon: '🌿', title: '100% Pure', description: 'No artificial colors, preservatives, or additives' },
        { icon: '✓', title: 'Quality Tested', description: 'Every batch undergoes rigorous quality checks' },
        { icon: '🚚', title: 'Fast Delivery', description: 'Quick and reliable delivery across India' },
        { icon: '💰', title: 'Best Prices', description: 'Premium quality at affordable prices' }
      ]
    }
  },

  // AI Shopping Assistant
  aiAssistantEnabled: { type: Boolean, default: true },
  aiAssistantGreeting: { type: String, default: "Hi! I'm your SBMI shopping assistant. How can I help you find the perfect spices today?" }
}, {
  timestamps: true
});

// Only allow one settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
