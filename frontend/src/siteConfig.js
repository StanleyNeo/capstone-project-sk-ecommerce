// Day 4 - siteConfig.js : THE template file (template rule #1)
// Rebrand = edit this file + reseed data/*.json. Components stay untouched.
const siteConfig = {
  businessName: 'NeoMart',
  tagline: 'A demo store — same engine, any business',
  currencySymbol: '$',
  colors: {
    primary: '#1f6feb',   // header, active filter, checkout
    accent:  '#f5a623'    // add-to-cart, cart badge
  },
  categories: ['electronics', 'fitness', 'home', 'books'],
  hero: {
    title: 'Everything for work, workout and home',
    subtitle: '20 demo products · served live from our own Express + MongoDB API'
  }
};

export default siteConfig;