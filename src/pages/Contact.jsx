import React from 'react';
import ContactForm from '../components/ContactForm';
import Seo from '../components/Seo';
import PageIntro from '../components/PageIntro';
import { pageSeo } from '../lib/seo';

export default function Contact() {
  return (
    <main className="bg-[#f5f5f7] min-h-screen">
    <Seo {...pageSeo.contact} />
      <PageIntro
        eyebrow="Noida office"
        title="Talk to Capital Brix"
        lede="Call, WhatsApp, or leave a name and a phone number. We use it to book a site visit or answer a plot question."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />
      <ContactForm />
    </main>
  );
}
