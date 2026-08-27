import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HomeAbout from '../components/HomeAbout';
import Projects from '../components/Projects';
import Partnership from '../components/Partnership';
import Leadership from '../components/Leadership';
import HomeArticles from '../components/HomeArticles';
import FAQ from '../components/FAQ';
import ContactForm from '../components/ContactForm';

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <HomeAbout />
      <Projects />
      <Partnership />
      <Leadership />
      <HomeArticles />
      <FAQ />
      <ContactForm />
    </main>
  );
}
