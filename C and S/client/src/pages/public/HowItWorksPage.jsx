import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Utensils,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Truck,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SectionHeading from '../../components/common/SectionHeading';
import Button from '../../components/common/Button';

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState('donor');

  const donorSteps = [
    {
      step: '01',
      title: 'Register & Complete Profile',
      desc: 'Sign up as a restaurant, bakery, supermarket or individual household. Enter your business name and primary pickup address.',
      icon: Users,
    },
    {
      step: '02',
      title: 'List Surplus Food Details',
      desc: 'Specify food name, category, quantity, food preparation time, safe storage instructions, and strict collection deadline.',
      icon: Utensils,
    },
    {
      step: '03',
      title: 'Verify via Mobile SMS OTP',
      desc: 'For safety and genuine intent, every newly published listing requires a 6-digit SMS OTP verification sent to your registered mobile phone.',
      icon: Smartphone,
    },
    {
      step: '04',
      title: 'Review Receiver Requests',
      desc: 'Certified local NGOs, orphanages, or shelters submit requests. You approve the request and mark the food ready for collection.',
      icon: ShieldCheck,
    },
    {
      step: '05',
      title: 'Pickup & Community Impact',
      desc: 'The receiver arrives at your specified address to collect the food. Once handover is completed, the rescued meal is logged to your impact dashboard.',
      icon: CheckCircle2,
    },
  ];

  const receiverSteps = [
    {
      step: '01',
      title: 'Register as Receiver',
      desc: 'Create an account as an NGO, orphanage, community shelter, or individual in need of food assistance.',
      icon: Users,
    },
    {
      step: '02',
      title: 'Browse Available Food Nearby',
      desc: 'Explore real-time listings filtered by food category, pickup location proximity, and collection deadlines.',
      icon: Search,
    },
    {
      step: '03',
      title: 'Submit Portion Request',
      desc: 'Enter the exact quantity required and optional note to the donor explaining your community needs.',
      icon: Utensils,
    },
    {
      step: '04',
      title: 'Receive Approval & Coordinate Pickup',
      desc: 'Once approved, receive instant notifications with pickup instructions, donor contact details, and route directions.',
      icon: Truck,
    },
    {
      step: '05',
      title: 'Confirm Successful Collection',
      desc: 'Inspect the items at pickup and confirm completion on your phone. Only confirmed collections count toward platform rescued impact.',
      icon: CheckCircle2,
    },
  ];

  const currentSteps = activeRole === 'donor' ? donorSteps : receiverSteps;

  return (
    <div className="py-12 sm:py-16 space-y-20">
      {/* Page Header */}
      <section>
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange/10 text-burntOrange border border-burntOrange/20">
              <Sparkles className="w-3.5 h-3.5" />
              Transparent Community Guidelines
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-chocolate tracking-tight">
              How Food Link <span className="text-burntOrange">Works</span>
            </h1>

            <p className="text-base sm:text-lg text-chocolate/80">
              A transparent, safe and verified end-to-end process ensuring surplus food reaches people safely and without delay.
            </p>
          </div>
        </Container>
      </section>

      {/* Role Switcher Tabs */}
      <section>
        <Container>
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 bg-white rounded-2xl border border-chocolate/15 shadow-sm">
              <button
                onClick={() => setActiveRole('donor')}
                className={`px-6 py-2.5 rounded-xl font-heading font-bold text-sm transition-all cursor-pointer ${
                  activeRole === 'donor'
                    ? 'bg-burntOrange text-white shadow-clay-btn'
                    : 'text-chocolate/80 hover:text-chocolate hover:bg-cream-100'
                }`}
              >
                For Surplus Food Donors
              </button>
              <button
                onClick={() => setActiveRole('receiver')}
                className={`px-6 py-2.5 rounded-xl font-heading font-bold text-sm transition-all cursor-pointer ${
                  activeRole === 'receiver'
                    ? 'bg-burntOrange text-white shadow-clay-btn'
                    : 'text-chocolate/80 hover:text-chocolate hover:bg-cream-100'
                }`}
              >
                For Food Receivers (NGOs & Shelters)
              </button>
            </div>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentSteps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="clay-card p-8 bg-white border border-chocolate/10 flex flex-col justify-between shadow-clay-card relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4 text-4xl font-extrabold font-heading text-chocolate/10 select-none">
                    {s.step}
                  </div>

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cream-200 text-burntOrange flex items-center justify-center mb-5 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="font-heading font-bold text-lg text-chocolate mb-2.5">
                      {s.title}
                    </h3>

                    <p className="text-sm text-chocolate/75 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Role Specific Callout */}
          <div className="mt-12 text-center">
            {activeRole === 'donor' ? (
              <Link to="/register?role=donor">
                <Button variant="primary" size="lg" leftIcon={<Heart className="w-5 h-5 fill-white/20" />}>
                  Register as a Food Donor
                </Button>
              </Link>
            ) : (
              <Link to="/register?role=receiver">
                <Button variant="primary" size="lg" leftIcon={<Users className="w-5 h-5" />}>
                  Register as a Food Receiver
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </section>

      {/* Safety & Protocol Banner */}
      <section className="py-12 bg-white border-y border-chocolate/10">
        <Container>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-burntOrange">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-heading font-bold text-xl text-chocolate">
                Our Food Safety & Verification Standards
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-chocolate/80">
              <div className="p-5 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-2">
                <h4 className="font-bold text-chocolate">Mandatory Mobile OTP</h4>
                <p>
                  Every publication draft must be confirmed with SMS OTP. Anonymous or unverified publications cannot go live.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-2">
                <h4 className="font-bold text-chocolate">Safe Handling Disclosures</h4>
                <p>
                  Donors provide clear preparation timestamps and safe refrigeration instructions before any listing is accepted.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-2">
                <h4 className="font-bold text-chocolate">Pickup Window Deadlines</h4>
                <p>
                  Listings automatically expire once their safety window passes, preventing outdated or compromised pickups.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-2">
                <h4 className="font-bold text-chocolate">Confirmed Handover</h4>
                <p>
                  Only items personally inspected and confirmed by the receiver at pickup qualify as completed rescued food.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
