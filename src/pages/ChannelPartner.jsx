import React from 'react';
import Seo from '../components/Seo';
import { pageSeo } from '../lib/seo';
import LeadForm from '../components/LeadForm';
import { site } from '../data/site';
import { FileCheck2, MapPin, IndianRupee, Users } from 'lucide-react';

/**
 * The inbound half of channel-partner recruitment.
 *
 * The outbound half — a registry import and a telecaller working a list — is
 * a commodity: any competitor can buy or scrape the same names on the same
 * day. This page is the part that compounds. It is found by a broker who is
 * already searching for inventory to sell, which makes them a warmer lead
 * than a hundred cold calls, and once it ranks it keeps producing without
 * anybody dialling.
 *
 * It targets one cluster nothing else on the site claims — "Dholera channel
 * partner", "Dholera broker tie-up" — so it competes with no other page of
 * ours. Add it to public/sitemap.xml or it is not prerendered.
 *
 * Copy rule, same as everywhere: say who develops and who sells. Capital Brix
 * is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd., and
 * never anything stronger.
 */

const WHY = [
  {
    Icon: FileCheck2,
    title: 'Title-clear, NA-approved inventory',
    body: 'Plots in Dholera SIR that your buyer can have verified independently — NA approval and clear title, with the paperwork available before anybody commits.',
  },
  {
    Icon: MapPin,
    title: 'One region, known deeply',
    body: 'We sell Dholera and nothing else. When your client asks about the expressway, the airport timeline or which phase a plot sits in, you get a straight answer instead of a brochure.',
  },
  {
    Icon: IndianRupee,
    title: 'Clear commercial terms',
    body: 'Partner terms are agreed in writing before your first booking — what you earn, when it is paid, and what happens on a cancellation. No surprises at payout.',
  },
  {
    Icon: Users,
    title: 'Site visits handled',
    body: 'Bring the client; we run the Dholera visit, the documentation walkthrough and the developer introduction. You stay the relationship owner throughout.',
  },
];

const STEPS = [
  ['You tell us about your desk', 'Name, city, how long you have been in the market, and the kind of client you usually sell to.'],
  ['We share inventory and terms', 'Current availability, pricing, and the partner agreement — in writing, before you commit to anything.'],
  ['You are onboarded', 'Marketing material, project documentation and a named person on our side who picks up when you call.'],
];

export default function ChannelPartner() {
  return (
    <main className="pt-24 bg-brand-gray min-h-screen">
      <Seo {...pageSeo.channelPartner} />

      <section className="bg-brand-blue py-16 md:py-20 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            For brokers, agents and consultants
          </p>
          <h1 className="text-3xl md:text-5xl font-heading font-bold mb-5 text-white">
            Become a Capital Brix channel partner
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg">
            Sell NA-approved, title-clear plots in Dholera SIR — developed by
            Mirrikh Infratech Pvt. Ltd. and marketed by Capital Brix LLP as an
            authorised sales channel partner. Written terms, documentation your
            client can verify, and site visits we run for you.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9C7C1C] mb-2">
            Why partner with us
          </p>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#10243E] mb-8">
            What you actually get
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {WHY.map(({ Icon, title, body }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#f26522] flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-[#10243E] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-14 md:pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9C7C1C] mb-2">
            How it works
          </p>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#10243E] mb-8">
            Three steps, no cost to join
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <span className="inline-flex w-8 h-8 rounded-full bg-[#10243E] text-white text-sm font-bold items-center justify-center mb-4">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[#10243E] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The form sits below the reasons, the same order the event page
          settled on: somebody who has decided to act scrolls past the
          argument, and somebody still deciding needs the argument first. */}
      <section className="pb-20" id="apply">
        <div className="max-w-2xl mx-auto px-4">
          <LeadForm
            source="channel-partner"
            headline="Talk to us about a partnership"
            sub="Tell us your name, number and the city you work in. Somebody from the team calls within one working day with inventory and terms."
          />
          <p className="text-xs text-gray-400 text-center mt-4">
            Prefer to talk first? Call{' '}
            <a href={`tel:+${site.phone}`} className="text-[#9C7C1C] hover:underline">
              +91 70489 17300
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
