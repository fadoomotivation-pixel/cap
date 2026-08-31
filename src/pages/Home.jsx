import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HomeAbout from '../components/HomeAbout';
import Projects from '../components/Projects';
import Partnership from '../components/Partnership';
import Leadership from '../components/Leadership';
import Awards from '../components/Awards';
import HomeArticles from '../components/HomeArticles';
import FAQ from '../components/FAQ';
import ContactForm from '../components/ContactForm';
import Seo from '../components/Seo';
import { pageSeo, absoluteUrl } from '../lib/seo';

// Person schema for the founder — strengthens E-E-A-T signals that Google
// weighs for money/trust queries like "buy plot in Dholera".
const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jasvinder Singh',
  jobTitle: 'Founder & CEO',
  worksFor: { '@type': 'Organization', name: 'Capital Brix' },
  image: absoluteUrl('/award-jasvinder-singh-jagran-achievers-2026.jpg'),
  award: 'Jagran Achievers Award 2026, Almaty, Kazakhstan',
  knowsAbout: ['Dholera Smart City', 'Dholera SIR', 'Real estate investment', 'Land acquisition'],
};

export default function Home() {
  return (
    <main>
      <Seo {...pageSeo.home} jsonLd={founderSchema} />
      <Hero />
      <Stats />
      <HomeAbout />
      <Projects />
      <Partnership />
      <Leadership />
      <Awards />
      <HomeArticles />
      <FAQ />
      <ContactForm />
    </main>
  );
}
