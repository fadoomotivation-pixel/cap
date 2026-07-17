import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { site } from '../data/site';

export default function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const onSubmit = async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    try {
      // FormSubmit: pehli baar submit par activation email aayega
      // (site.email inbox check karo) — uske baad leads seedha inbox me.
      const res = await fetch(`https://formsubmit.co/ajax/${site.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          _subject: `🔥 Dholera Lead: ${data.name} (${data.interest})`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error('submit failed');
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

  return (
    <section className="section contact" id="contact">
      <div className="container contact__grid">
        <motion.div
          className="contact__info"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">Talk to a Dholera Expert</p>
          <h2>
            Get the Latest <span className="text-gold">Price List &amp; Layout</span>
          </h2>
          <p className="section__sub">
            Share your details and we&rsquo;ll call you back within working hours with
            current availability, pricing and a free site-visit plan.
          </p>

          <ul className="contact__channels">
            <li>
              <Phone size={18} />
              <a href={`tel:+${site.phone}`}>{site.phoneDisplay}</a>
            </li>
            <li>
              <MessageCircle size={18} />
              <a href={wa} target="_blank" rel="noreferrer">
                WhatsApp us — instant reply
              </a>
            </li>
            <li>
              <Mail size={18} />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li>
              <MapPin size={18} />
              <span>{site.address}</span>
            </li>
          </ul>
        </motion.div>

        <motion.form
          className="contact__form"
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {status === 'sent' ? (
            <div className="contact__success">
              <CheckCircle2 size={44} />
              <h3>Enquiry received!</h3>
              <p>Our Dholera expert will call you shortly. For instant details, ping us on WhatsApp.</p>
              <a className="btn btn--gold" href={wa} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="f-name">Full Name *</label>
                <input id="f-name" name="name" required placeholder="Your name" autoComplete="name" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-phone">Phone / WhatsApp *</label>
                  <input
                    id="f-phone"
                    name="phone"
                    required
                    type="tel"
                    pattern="[0-9+ \-]{10,15}"
                    placeholder="+91 98XXX XXXXX"
                    autoComplete="tel"
                  />
                </div>
                <div className="field">
                  <label htmlFor="f-email">Email</label>
                  <input id="f-email" name="email" type="email" placeholder="you@email.com" autoComplete="email" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="f-interest">Interested In *</label>
                  <select id="f-interest" name="interest" required defaultValue="Residential Plot">
                    <option>Residential Plot</option>
                    <option>Industrial Plot</option>
                    <option>Commercial Plot</option>
                    <option>Site Visit</option>
                    <option>Not sure — need guidance</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-budget">Budget</label>
                  <select id="f-budget" name="budget" defaultValue="₹10–20 Lakh">
                    <option>Under ₹10 Lakh</option>
                    <option>₹10–20 Lakh</option>
                    <option>₹20–50 Lakh</option>
                    <option>₹50 Lakh+</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="f-msg">Message</label>
                <textarea id="f-msg" name="message" rows="3" placeholder="Anything specific you want to know?" />
              </div>

              <button className="btn btn--gold btn--lg btn--full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : (
                  <>
                    Get Call Back <Send size={16} />
                  </>
                )}
              </button>

              {status === 'error' && (
                <p className="contact__error">
                  Form send nahi hua — please{' '}
                  <a href={wa} target="_blank" rel="noreferrer">WhatsApp us directly</a> or call {site.phoneDisplay}.
                </p>
              )}
              <p className="contact__privacy">
                100% privacy. Your details are used only to contact you about Dholera plots.
              </p>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
}
