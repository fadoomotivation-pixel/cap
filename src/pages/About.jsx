import React from 'react';
import Partnership from '../components/Partnership';
import Testimonials from '../components/Testimonials';

export default function About() {
  return (
    <main>
      <div className="container" style={{ paddingTop: '10rem', paddingBottom: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>About <span className="text-gold">Us</span></h1>
      </div>
      <Partnership />
      <Testimonials />
    </main>
  );
}
