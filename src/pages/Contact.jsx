import React from 'react';
import ContactForm from '../components/ContactForm';

export default function Contact() {
  return (
    <main>
      <div className="container" style={{ paddingTop: '10rem' }}>
        <h1 style={{ textAlign: 'center' }}>Contact <span className="text-gold">Us</span></h1>
      </div>
      <ContactForm />
    </main>
  );
}
