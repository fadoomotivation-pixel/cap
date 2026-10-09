import React from 'react';
import Projects, { projectSlug } from '../components/Projects';
import DeveloperTrust from '../components/DeveloperTrust';
import LeadForm from '../components/LeadForm';
import Seo from '../components/Seo';
import PageIntro from '../components/PageIntro';
import { pageSeo, SITE_URL, absoluteUrl } from '../lib/seo';
import { plotRates, projects, projectsMap, developer } from '../data/site';

// ItemList of the projects rendered as cards on this page, each a Product with
// the developer as brand and — only where a "starting at" figure is printed in
// the developer's collateral and shown on the card — an AggregateOffer.
// Schema mirrors what is visible; nothing here is not on the page.
const verified = projects.filter((p) => p.verified);

const projectsLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${absoluteUrl('/projects')}#page`,
      name: 'Mirrikh Infratech projects near Dholera Smart City',
      url: absoluteUrl('/projects'),
      isPartOf: { '@type': 'WebSite', url: SITE_URL },
      about: 'Residential, industrial and villa projects near Dholera Smart City, developed by Mirrikh Infratech Pvt. Ltd. and marketed by Capital Brix LLP as an authorised sales channel partner.',
      mainEntity: { '@id': `${absoluteUrl('/projects')}#list` },
    },
    {
      '@type': 'ItemList',
      '@id': `${absoluteUrl('/projects')}#list`,
      name: 'Current Mirrikh Infratech projects marketed by Capital Brix',
      numberOfItems: verified.length,
      itemListElement: verified.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/projects/${projectSlug(p.name)}`),
        item: {
          '@type': 'Product',
          name: `${p.name}, near Dholera Smart City`,
          url: absoluteUrl(`/projects/${projectSlug(p.name)}`),
          image: absoluteUrl(p.image),
          category: p.type,
          description: `${p.units} at ${p.location}. NA, NOC, Title Clear & Unit Plan Pass. Developed by Mirrikh Infratech Pvt. Ltd., marketed by Capital Brix LLP.`,
          brand: { '@type': 'Brand', name: 'Mirrikh Infratech' },
          ...(p.startingPrice ? {
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: p.startingPrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: 'Capital Brix LLP', url: SITE_URL },
            },
          } : {}),
        },
      })),
    },
    {
      '@type': 'Organization',
      '@id': `${absoluteUrl('/projects')}#developer`,
      name: developer.name,
      url: 'https://www.mirrikh.com',
      foundingDate: String(developer.since),
      award: developer.awards.map((a) => `${a.title} (${a.year})`),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: absoluteUrl('/projects') },
      ],
    },
  ],
};

export default function ProjectsPage() {
  return (
    <main className="bg-white min-h-screen">
      <Seo {...pageSeo.projects} jsonLd={projectsLd} />
      {/* The heading names the developer, so nobody reads these as Capital
          Brix's own projects. */}
      <PageIntro
        eyebrow="Developed by Mirrikh Infratech Pvt. Ltd."
        title="Mirrikh Infratech projects near Dholera Smart City"
        lede={`Residential plots from ₹12.75 lakh, industrial units from ₹26.5 lakh and 3BHK villas — every project NA, NOC, Title Clear & Unit Plan Pass. Marketed by Capital Brix LLP as an authorised sales channel partner. ${plotRates.sentence}`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Projects' }]}
      />

      <Projects variant="all" />

      {/* Where the projects are — the developer's own pins on the DSIRDA plan */}
      <section className="bg-[#f5f5f7] py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">Locations</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#10243E] leading-tight mb-5">
              Around the SIR boundary, near the expressway and airport
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Mirrikh’s projects sit in the villages around Dholera Smart City — Fedra, Kamiyala and Rojka
              to the north-west, Moti Boru to the north-east near the expressway and airport, and Haripura
              in Dhandhuka taluka. They are near Dholera Smart City, not inside the Special Investment Region.
            </p>
            <p className="text-sm text-gray-500">
              On a site visit we drive the expressway, the ABCD building, the Tata fab perimeter and the
              project you are considering in one morning from Ahmedabad.
            </p>
          </div>
          <figure className="lg:col-span-7">
            <img
              src={projectsMap.src}
              alt={projectsMap.alt}
              width={projectsMap.w}
              height={projectsMap.h}
              loading="lazy"
              decoding="async"
              className="w-full h-auto rounded-sm border border-gray-200 bg-white"
            />
            <figcaption className="mt-2 text-[11px] text-gray-400">{projectsMap.credit}</figcaption>
          </figure>
        </div>
      </section>

      <DeveloperTrust />

      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-xl mx-auto px-6">
          <LeadForm
            source="projects"
            headline="Get the price list and a site-visit slot"
            sub="Tell us which project you are looking at. We will send the current price, availability and approvals, and offer you a site-visit date."
          />
        </div>
      </section>
    </main>
  );
}
