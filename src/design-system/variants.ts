export const websiteVariants = {
  ecommerceTemplate: {
    theme: 'agency-preview',
    components: ['navbar', 'hero', 'card', 'stats', 'carousel-style gallery', 'collapse', 'footer'],
    sectionTone: 'editorial commerce with product cards, proof, and clear basket intent'
  },
  localBusinessTemplate: {
    theme: 'corporate',
    components: ['navbar', 'hero', 'stats', 'card', 'steps', 'collapse', 'footer'],
    sectionTone: 'trust-first lead generation'
  },
  saasTemplate: {
    theme: 'winter',
    components: ['navbar', 'hero', 'mockup-browser', 'stats', 'card', 'timeline', 'footer'],
    sectionTone: 'product-led explanation and conversion'
  },
  portfolioTemplate: {
    theme: 'cupcake',
    components: ['navbar', 'hero', 'card', 'badge', 'carousel-style gallery', 'footer'],
    sectionTone: 'visual showcase with strong personal positioning'
  },
  agencyTemplate: {
    theme: 'corporate',
    components: ['navbar', 'hero', 'card', 'stats', 'steps', 'collapse', 'footer'],
    sectionTone: 'premium service agency'
  },
  landingPageTemplate: {
    theme: 'emerald',
    components: ['navbar', 'hero', 'stats', 'card', 'collapse', 'footer'],
    sectionTone: 'focused single-offer conversion'
  }
} as const;
