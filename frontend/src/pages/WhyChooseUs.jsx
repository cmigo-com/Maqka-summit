import React from 'react';

const REASONS = [
  { title: 'Safety-First Planning', text: 'Every itinerary is built around acclimatization, with emergency protocols on every trek.' },
  { title: 'Experienced Local Guides', text: 'Our guides have years of experience on Kenya\u2019s mountains and know every route in detail.' },
  { title: 'Transparent Pricing', text: 'What you see is what you pay — no hidden fees, with flexible installment payments available.' },
  { title: 'Small, Personal Groups', text: 'We cap group sizes so you get real attention from your guide, not just a number on a list.' },
  { title: 'Full Logistics Handled', text: 'Porters, cooks, camping gear and park permits are taken care of so you can focus on the trek.' },
  { title: 'A Wide Range of Adventures', text: 'From easy half-day hikes to multi-day summit expeditions, there\u2019s a trek for every fitness level.' },
];

export default function WhyChooseUs() {
  return (
    <div className="section">
      <h1>Why Choose Maqka Summit</h1>
      <div className="grid-3">
        {REASONS.map((r) => (
          <div className="card" key={r.title}>
            <h3>{r.title}</h3>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
