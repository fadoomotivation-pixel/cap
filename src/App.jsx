import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Partnership from './components/Partnership';
import WhyDholera from './components/WhyDholera';
import Projects from './components/Projects';
import Connectivity from './components/Connectivity';
import Process from './components/Process';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import './index.css';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Partnership />
        <WhyDholera />
        <Projects />
        <Connectivity />
        <Process />
        <Testimonials />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
