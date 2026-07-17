import React from 'react';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <main>
      <div className="container" style={{ paddingTop: '10rem' }}>
        <h1 style={{ textAlign: 'center' }}>Our <span className="text-gold">Projects</span></h1>
      </div>
      <Projects />
    </main>
  );
}
