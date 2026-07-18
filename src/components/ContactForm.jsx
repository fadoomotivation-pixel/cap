import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { site } from '../data/site';

export default function ContactForm() {
  return (
    <section className="section-padding bg-gray-50" id="contact">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <p className="text-brand-orange font-bold uppercase tracking-wider text-sm mb-2">Get in Touch</p>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-blue mb-4">
            Contact Capital Brix
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ready to invest in India's first greenfield smart city? Our experts are here to help you secure the best plots in Dholera SIR.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Contact Info Sidebar */}
          <div className="w-full lg:w-1/3 bg-brand-blue text-white p-8 md:p-12">
            <h3 className="text-2xl font-bold font-heading mb-6">Contact Information</h3>
            <p className="text-white/80 mb-10">
              Fill up the form and our Team will get back to you within 24 hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="text-brand-orange mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Phone</h4>
                  <p className="text-white/80">+91 70489 17300</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-brand-orange mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Email</h4>
                  <p className="text-white/80">info@mirrikh.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="text-brand-orange mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-lg">Address</h4>
                  <p className="text-white/80 leading-relaxed">{site.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="w-full lg:w-2/3 p-8 md:p-12">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => e.preventDefault()}>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input type="text" placeholder="John" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input type="text" placeholder="Doe" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <input type="tel" placeholder="+91 00000 00000" className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Message</label>
                <textarea rows="4" placeholder="Write your message..." className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"></textarea>
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="btn-orange w-full md:w-auto justify-center">
                  Send Message
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
