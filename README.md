# Capital Brix — Dholera Smart City Website

Premium 3D landing website for **Capital Brix** — Dholera SIR plot investments.
Built with React 19 + Vite, three.js (react-three-fiber) 3D hero, framer-motion
animations, and full SEO for "Dholera" searches (meta tags, JSON-LD
RealEstateAgent + FAQPage schema, robots.txt, sitemap.xml).

## Content edit karna ho?

Saara content ek file me hai — **`src/data/site.js`**:

- 📞 **Phone/WhatsApp number** — `site.phone` (abhi placeholder `919999999999` hai, apna number daalo)
- 📧 **Lead email** — `site.email` (form submissions yahan aati hain)
- 🏗️ Projects, prices, FAQs, testimonials — sab isi file me

## Lead capture kaise kaam karta hai

1. **Enquiry form** → [FormSubmit](https://formsubmit.co) ke through `site.email`
   par aata hai. **Pehli submission par activation email aayega — usse confirm
   karna zaroori hai**, uske baad saari leads seedha inbox me.
2. **WhatsApp** — floating button + har project card ka "Get Price List" button
   pre-filled message ke saath WhatsApp kholta hai.
3. **Call** — click-to-call links.

## Google se leads (SEO) ke liye deploy ke baad

1. Site ko domain par deploy karo (Vercel/Netlify — `npm run build`, output `dist/`)
2. `index.html`, `public/robots.txt`, `public/sitemap.xml` me `capitalbrix.in`
   ki jagah apna real domain daalo
3. [Google Search Console](https://search.google.com/search-console) me site
   add karke sitemap submit karo
4. Google Business Profile banao — "Dholera plots" local searches ke liye

## Commands

```bash
npm install     # dependencies
npm run dev     # local dev server
npm run build   # production build → dist/
npm run preview # built site preview
npm run lint    # oxlint
```
