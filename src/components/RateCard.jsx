import { rateCircular } from '../data/site';

const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

function Group({ title, rows }) {
  return (
    <div className="min-w-0">
      <h3 className="font-heading text-xl text-[#10243E] mb-3">{title}</h3>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-[15px] sm:text-base border-collapse">
          <caption className="sr-only">{title} rates, {rateCircular.label}</caption>
          <thead>
            <tr className="border-b-2 border-[#D4AF37] text-left">
              <th scope="col" className="py-2.5 pr-3 font-semibold text-[#10243E]">Project</th>
              <th scope="col" className="py-2.5 pl-3 font-semibold text-[#10243E] text-right whitespace-nowrap">₹ / sq yd</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, rate]) => (
              <tr key={name} className="border-b border-gray-100">
                <th scope="row" className="py-3 pr-3 font-normal text-gray-700 text-left">{name}</th>
                <td className="py-3 pl-3 text-right font-semibold text-[#9C7C1C] whitespace-nowrap tabular-nums">{fmt(rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Mirrikh's official rate circular, rendered as two narrow tables that never
 *  need horizontal scrolling on a 360px phone. */
export default function RateCard() {
  return (
    <section id="rate-card" className="bg-white py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">Rate card</p>
        <h2 className="font-heading text-3xl lg:text-4xl text-[#10243E] leading-tight mb-3">
          {rateCircular.label}
        </h2>
        <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-3xl">{rateCircular.note}</p>
        <div className="grid md:grid-cols-2 gap-10">
          <Group title="Residential" rows={rateCircular.residential} />
          <Group title="Industrial" rows={rateCircular.industrial} />
        </div>
        <p className="mt-6 text-sm text-gray-500">
          The circular lists rates only. Ask us which plots are open for booking in a project before you plan a visit.
        </p>
      </div>
    </section>
  );
}
