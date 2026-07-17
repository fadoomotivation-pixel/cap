# Capital Brix — Dholera Smart City Website

Premium 3D landing website for **Capital Brix LLP — exclusive channel partner of
Mirrikh Infratech** — Dholera SIR plot investments with the real Mirrikh "Mayur"
project portfolio (Greenz II, Evana, Enclave 5, Signature, Swastik, Industrial
Park + delivered projects).
Built with React 19 + Vite, three.js (react-three-fiber) 3D hero, framer-motion
animations, and full SEO for "Dholera" searches (meta tags, JSON-LD
RealEstateAgent + FAQPage schema, robots.txt, sitemap.xml).

## Content edit karna ho?

Saara content ek file me hai — **`src/data/site.js`**:

- 📞 **Phone/WhatsApp** — `site.phone` (abhi `+91 70489 17300` — Capital Brix ka public number)
- 📧 **Lead email** — `site.leadEmail` (form submissions yahan aati hain); `site.email` public display ke liye
- 🏗️ Projects, prices, FAQs, testimonials — sab isi file me

## Lead capture kaise kaam karta hai

1. **Enquiry form** → [FormSubmit](https://formsubmit.co) ke through `site.email`
   par aata hai. **Pehli submission par activation email aayega — usse confirm
   karna zaroori hai**, uske baad saari leads seedha inbox me.
2. **WhatsApp** — floating button + har project card ka "Get Price List" button
   pre-filled message ke saath WhatsApp kholta hai.
3. **Call** — click-to-call links.

## Google se leads (SEO) ke liye deploy ke baad

1. Site capitalbrix.com par point karo (Vercel me domain add karo)
2. `index.html`, `public/robots.txt`, `public/sitemap.xml` me `capitalbrix.com` set hai —
   (ab real domain set hai) verify karo
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
