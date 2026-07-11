export const reusableWebsiteSections = {
  HeaderSection: 'navbar bg-base-100/85 backdrop-blur border-b border-base-300',
  HeroSection: 'hero min-h-[calc(100vh-4.5rem)]',
  ServicesSection: 'grid md:grid-cols-3 gap-6 card-driven service comparison',
  TestimonialsSection: 'grid md:grid-cols-3 gap-6 customer proof cards',
  PricingSection: 'grid md:grid-cols-3 gap-6 price cards',
  FaqSection: 'space-y-3 DaisyUI collapse components',
  ContactSection: 'card bg-base-100 shadow-xl form controls',
  GallerySection: 'responsive image gallery with local placeholder assets',
  CtaSection: 'hero bg-primary text-primary-content rounded-box',
  FooterSection: 'footer footer-horizontal footer-center'
} as const;
