import React from 'react';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <main className="pt-24 bg-brand-gray min-h-screen">
      <div className="bg-brand-blue py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Our Projects</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg">
          Explore all our NA-approved, title-clear projects in Dholera SIR.
        </p>
      </div>
      <Projects />
    </main>
  );
}
