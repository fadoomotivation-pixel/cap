import React from 'react';
import Hero from '../components/Hero';
import Partnership from '../components/Partnership';
import Projects from '../components/Projects';
import ContactForm from '../components/ContactForm';

export default function Home() {
  return (
    <main>
      <Hero />
      <Partnership />
      <Projects />
      <ContactForm />
    </main>
  );
}
