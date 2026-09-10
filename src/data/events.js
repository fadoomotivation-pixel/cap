// Past events — Dholera awareness programmes and trade shows hosted by
// Mirrikh Infratech Pvt. Ltd., the developer whose Dholera projects Capital
// Brix markets as an authorised sales channel partner.
//
// ── Photographs ─────────────────────────────────────────────────────────────
// Every entry here once carried an `img` hotlinked straight from
// mirrikh.com/wp-content/uploads/ — their banner, on their bandwidth, on our
// page. Mirrikh's notice of 8 Sep 2026 required that to come off, and the
// permission granted on 10 Sep 2026 covers their **project images only**, not
// event photographs. So there is no external URL here and there must never be
// one again.
//
// To put a real photograph on a card: drop the file in `public/events/` and set
// `image: '/events/<file>.webp'`. Same convention as `public/projects/`. The
// file must be one WE host, and one we are authorised to use. Without an image
// the card renders generated art, which is deliberately fine — a card with no
// photo still tells someone where and when we were.
//
// ── The list ────────────────────────────────────────────────────────────────
// This was originally scraped, and it showed: 31 rows, one titled "1", eight
// identical "Mirrikh Awareness Program / India / 2024" placeholders, Dehradun
// listed twice for 12 May 2024 (once with a trailing space), and two spelling
// mistakes. Those are gone. What is left is the events we can actually name a
// place and a date for — 18 real rows instead of 31 rows of noise.
//
// `sort` is what the page orders by; it exists because "2024" and
// "29 Dec 2024" cannot be compared as text.

export const events = [
  { title: 'SPARK 2024',                 location: 'Delhi',        date: '29 Dec 2024', sort: '2024-12-29' },
  { title: 'Mirrikh Event',              location: 'Dehradun',     date: '22 Dec 2024', sort: '2024-12-22' },
  { title: 'Mirrikh Event',              location: 'Delhi',        date: '4 Nov 2024',  sort: '2024-11-04' },
  { title: 'Mirrikh Event',              location: 'Faridabad',    date: '25 Aug 2024', sort: '2024-08-25' },
  { title: 'Mirrikh Event',              location: 'Gurugram',     date: '27 May 2024', sort: '2024-05-27' },
  { title: 'Mirrikh Event',              location: 'Yamunanagar',  date: '26 May 2024', sort: '2024-05-26' },
  { title: 'Mirrikh Event',              location: 'Gorakhpur',    date: '19 May 2024', sort: '2024-05-19' },
  { title: 'Mirrikh Event',              location: 'Dehradun',     date: '12 May 2024', sort: '2024-05-12' },
  { title: 'Mirrikh Event',              location: 'Dehradun',     date: '17 Mar 2024', sort: '2024-03-17' },
  { title: 'Mirrikh Event',              location: 'Odisha',       date: '10 Mar 2024', sort: '2024-03-10' },
  { title: 'Mirrikh Event',              location: 'Gurugram',     date: '20 Jan 2024', sort: '2024-01-20' },
  { title: 'Mirrikh Event',              location: 'Banswara',     date: '17 Jan 2024', sort: '2024-01-17' },
  { title: 'Dholera Awareness Programme', location: 'Shirpur',     date: '29 Oct 2023', sort: '2023-10-29' },
  { title: 'Dholera Awareness Programme', location: 'Vapi',        date: '19 Apr 2023', sort: '2023-04-19' },

  // Trade shows and business summits. Only the year is on record for these.
  { title: 'GPBS 2025',                  location: 'Gandhinagar',  date: '2025', sort: '2025-01-01' },
  { title: 'Vibrant Gujarat 2024',       location: 'Gandhinagar',  date: '2024', sort: '2024-01-01' },
  { title: 'GPBS 2024',                  location: 'Rajkot',       date: '2024', sort: '2024-01-02' },
  { title: 'IVY 2024',                   location: 'Surat',        date: '2024', sort: '2024-01-03' },
];
