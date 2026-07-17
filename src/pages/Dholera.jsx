import React from 'react';
import WhyDholera from '../components/WhyDholera';
import Connectivity from '../components/Connectivity';
import Process from '../components/Process';
import FAQ from '../components/FAQ';

export default function Dholera() {
  return (
    <main>
      <div className="container" style={{ paddingTop: '10rem' }}>
        <h1 style={{ textAlign: 'center' }}>Dholera <span className="text-gold">SIR</span></h1>
      </div>
      <WhyDholera />
      <Connectivity />
      <Process />
      <FAQ />
    </main>
  );
}
