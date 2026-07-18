import React from 'react';
import ContactForm from '../components/ContactForm';

export default function Contact() {
  return (
    <main className="pt-24 bg-brand-gray min-h-screen">
      <div className="bg-brand-blue py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Contact Us</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg">
          Reach out to the Capital Brix team for inquiries and bookings.
        </p>
      </div>
      <ContactForm />
    </main>
  );
}
