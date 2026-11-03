import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Target, Eye, ShieldCheck, Leaf, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SectionHeading from '../../components/common/SectionHeading';
import Button from '../../components/common/Button';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To eliminate avoidable food waste by providing a safe, rapid, and compassionate technology platform connecting food surplus donors directly with local shelters, orphanages, and families.',
    },
    {
      icon: Eye,
      title: 'Our Vision',
      description:
        'A world where no edible food is ever discarded, where businesses and households act as conscientious stewards of nourishment, and where every neighborhood supports its most vulnerable members.',
    },
    {
      icon: ShieldCheck,
      title: 'Safety & Trust First',
      description:
        'Every donor listing requires registered SMS OTP authentication, detailed temperature and handling disclosures, and mutual collection confirmation before meals count as rescued.',
    },
    {
      icon: Leaf,
      title: 'Environmental Stewardship',
      description:
        'Food rotting in landfills generates potent methane gas. Every rescued kilogram reduces greenhouse emissions, water consumption, and agricultural strain.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-20">
      {/* Hero Header */}
      <section>
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-burntOrange/10 text-burntOrange text-xs font-bold uppercase tracking-wider border border-burntOrange/20">
              <Sparkles className="w-4 h-4" />
              Our Purpose & Story
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-chocolate tracking-tight">
              Good food deserves <br />
              <span className="text-burntOrange underline decoration-burntOrange/30 decoration-wavy underline-offset-8">
                another chance.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-chocolate/80 leading-relaxed font-normal">
              Food Link was founded on a simple observation: every evening, thousands of restaurants, banquets, and supermarkets dispose of delicious, freshly prepared food simply because there is no seamless, trusted bridge to the orphanages and shelters just a few streets away.
            </p>
          </div>
        </Container>
      </section>

      {/* Values & Pillars Grid */}
      <section className="py-12 bg-cream-100/60 border-y border-chocolate/10">
        <Container>
          <SectionHeading
            badge="The Foundation"
            title="The Pillars of"
            highlight="Food Link"
            description="Our community platform is anchored on transparency, safety, and mutual dignity."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="clay-card p-8 bg-white border border-chocolate/10 flex items-start gap-5 shadow-clay-card"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cream-200 text-burntOrange flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-chocolate mb-2">
                      {v.title}
                    </h3>
                    <p className="text-sm text-chocolate/75 leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* The Impact Reality */}
      <section>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange/10 text-burntOrange">
                The Food Paradox
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-chocolate leading-tight">
                One third of all produced food is never eaten.
              </h2>

              <p className="text-base text-chocolate/80 leading-relaxed">
                Globally, over 1.3 billion tons of food are wasted annually, even as community shelters struggle to provide basic nutrition. In our cities, catering companies, hotel banquets, and grocery outlets routinely face unpredictable surplus demand.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Surplus meals are listed in under two minutes by verified donors.',
                  'Every published listing requires mobile OTP to prevent unverified entries.',
                  'Nearby registered shelters claim the exact portions needed, avoiding over-claiming.',
                  'Real impact records generate only after physical collection is mutually confirmed.',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-chocolate/85 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Card */}
            <div className="clay-card p-8 sm:p-10 bg-white border border-chocolate/10 shadow-clay-card space-y-6">
              <h3 className="text-2xl font-bold font-heading text-chocolate">
                Our Commitment to Community Dignity
              </h3>
              <p className="text-sm text-chocolate/75 leading-relaxed">
                Food Link is not about handouts — it is about community solidarity and environmental sanity. We treat every donor as a neighborhood hero and every receiver with utmost respect.
              </p>

              <div className="p-5 rounded-2xl bg-cream-100 border border-chocolate/10 flex items-center gap-4">
                <Users className="w-10 h-10 text-burntOrange shrink-0" />
                <div>
                  <div className="font-heading font-bold text-chocolate text-base">
                    Community Driven
                  </div>
                  <div className="text-xs text-chocolate/70">
                    Built for local impact, powered by neighborly cooperation.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/register">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Join Food Link Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
