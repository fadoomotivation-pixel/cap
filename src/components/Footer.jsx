import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { site } from '../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <a href="#top" className="nav__brand" aria-label={site.name}>
            <span className="nav__logo">CB</span>
            <span className="nav__name">
              Capital <em>Brix</em>
              <small>{site.tagline}</small>
            </span>
          </a>
          <p className="footer__about">
            Capital Brix helps investors across India &amp; NRIs own NA-approved,
            title-clear residential and industrial plots in the Dholera SIR growth
            corridor — with guided site visits and full documentation support.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><a href="#why-dholera">Why Dholera</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#connectivity">Location Advantage</a></li>
            <li><a href="#process">How It Works</a></li>
            <li><a href="#faq">FAQs</a></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul className="footer__contact">
            <li><Phone size={15} /> <a href={`tel:+${site.phone}`}>{site.phoneDisplay}</a></li>
            <li><Mail size={15} /> <a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><MapPin size={15} /> {site.address}</li>
          </ul>
        </div>
      </div>

      <div className="container footer__seo">
        <p>
          Dholera Smart City plots · Residential plots in Dholera SIR · Industrial plots
          Dholera · Dholera plot price 2026 · Investment in Dholera Special Investment
          Region · Plots near Dholera International Airport · Ahmedabad–Dholera Expressway
          projects
        </p>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p className="footer__disclaimer">
          Disclaimer: Prices, distances and infrastructure timelines are indicative and
          subject to change. Real estate investment is subject to market risk — please
          verify all documents independently before purchase.
        </p>
      </div>
    </footer>
  );
}
