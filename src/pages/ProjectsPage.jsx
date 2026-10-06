import React from 'react';
import Projects from '../components/Projects';
import Seo from '../components/Seo';
import PageIntro from '../components/PageIntro';
import { pageSeo } from '../lib/seo';
import { plotRates } from '../data/site';

export default function ProjectsPage() {
  return (
    <main className="bg-[#f5f5f7] min-h-screen">
    <Seo {...pageSeo.projects} />
      {/* "Our Projects" under a Mirrikh eyebrow used to read as though Capital
          Brix developed them. The heading names the developer. */}
      <PageIntro
        eyebrow="Developed by Mirrikh Infratech Pvt. Ltd."
        title="Mirrikh Infratech projects in Dholera"
        lede={`NA-approved, title-clear residential and industrial projects, marketed by Capital Brix LLP as an authorised sales channel partner. ${plotRates.sentence} Verified ${plotRates.verified}.`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Projects' }]}
      />
      <Projects />
    </main>
  );
}
