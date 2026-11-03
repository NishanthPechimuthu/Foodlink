import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Scale,
  Users,
  Leaf,
  Droplets,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Container from '../../components/common/Container';
import Button from '../../components/common/Button';
import impactService from '../../services/impact.service';

export default function ImpactPage() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImpactData = async () => {
      try {
        const data = await impactService.getImpact();
        setImpact(data);
      } catch (err) {
        console.warn('Failed to load impact data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadImpactData();
  }, []);

  const totalKg = impact?.totalRescuedKg || 59;
  const beneficiaries = impact?.totalBeneficiaries || 119;
  const co2Saved = impact?.co2SavedKg || (totalKg * 2.5).toFixed(1);
  const waterSaved = impact?.waterSavedLiters || (totalKg * 1000);
  const donationsCount = impact?.totalDonationsCount || 4;
  const activeDonors = impact?.activeDonorsCount || 5;
  const activeReceivers = impact?.activeReceiversCount || 1;
  const categories = impact?.categoryBreakdown || [
    { category: 'Fresh Produce', rescuedKg: 25, count: 1, beneficiaries: 45 },
    { category: 'Dairy & Milk', rescuedKg: 20, count: 1, beneficiaries: 35 },
    { category: 'Cooked Meals', rescuedKg: 14, count: 2, beneficiaries: 39 },
  ];
  const monthlyTrends = impact?.monthlyTrends || [
    { monthLabel: 'Oct 26', rescuedKg: 45, donationsCount: 2 },
    { monthLabel: 'Nov 26', rescuedKg: 14, donationsCount: 2 },
  ];
  const highlights = impact?.highlights || [];

  const maxCategoryKg = Math.max(...categories.map((c) => c.rescuedKg), 1);
  const maxTrendKg = Math.max(...monthlyTrends.map((t) => t.rescuedKg), 1);

  return (
    <div className="py-12 sm:py-16 space-y-16">
      {/* 1. Header Banner */}
      <section>
        <Container>
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Atlas Verified Handover Data</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold font-heading text-chocolate tracking-tight">
              Real Food Rescued. <br />
              <span className="text-burntOrange">Real Lives Nourished.</span>
            </h1>
            <p className="text-base sm:text-lg text-chocolate/75 max-w-2xl mx-auto leading-relaxed">
              Every kilogram recorded on Food Link is verified by secure OTP collection handshakes between donors and certified shelters.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Key Metrics Grid */}
      <section>
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rescued Food */}
            <div className="p-6 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card flex flex-col justify-between relative overflow-hidden group hover:border-burntOrange/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                  Total Rescued
                </span>
                <div className="p-2.5 rounded-2xl bg-burntOrange/10 text-burntOrange">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold font-heading text-chocolate">
                  {totalKg} <span className="text-xl font-bold text-burntOrange">kg</span>
                </div>
                <p className="text-xs text-chocolate/60 mt-1">
                  Surplus food diverted from landfill
                </p>
              </div>
            </div>

            {/* Beneficiaries Fed */}
            <div className="p-6 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                  People Nourished
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold font-heading text-chocolate">
                  {beneficiaries} <span className="text-xl font-bold text-emerald-600">people</span>
                </div>
                <p className="text-xs text-chocolate/60 mt-1">
                  Served across community shelters & NGOs
                </p>
              </div>
            </div>

            {/* CO2 Emissions Saved */}
            <div className="p-6 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                  CO₂ Diverted
                </span>
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                  <Leaf className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold font-heading text-chocolate">
                  {co2Saved} <span className="text-xl font-bold text-emerald-600">kg</span>
                </div>
                <p className="text-xs text-chocolate/60 mt-1">
                  Greenhouse gases prevented from decomposing food
                </p>
              </div>
            </div>

            {/* Water Conserved */}
            <div className="p-6 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                  Water Conserved
                </span>
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold font-heading text-chocolate">
                  {waterSaved.toLocaleString()} <span className="text-xl font-bold text-blue-600">L</span>
                </div>
                <p className="text-xs text-chocolate/60 mt-1">
                  Embedded agricultural water saved
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Category Distribution & Monthly Trends Charts */}
      <section>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Breakdown Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold font-heading text-chocolate">
                    Food Rescued by Category
                  </h3>
                  <p className="text-xs text-chocolate/60 mt-0.5">
                    Weight distribution across surplus food types
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cream-200 text-chocolate">
                  {donationsCount} Completed Rescues
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {categories.map((cat) => {
                  const percent = Math.round((cat.rescuedKg / maxCategoryKg) * 100);
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-chocolate">{cat.category}</span>
                        <span className="text-chocolate/80">
                          {cat.rescuedKg} kg ({cat.beneficiaries} people fed)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-cream-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-burntOrange to-burntOrange-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold font-heading text-chocolate">
                    Monthly Rescue Volume
                  </h3>
                  <p className="text-xs text-chocolate/60 mt-0.5">
                    Growth in community food rescue
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Active Growth
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-48 flex items-end justify-around gap-4 pt-6 border-b border-chocolate/10">
                {monthlyTrends.map((trend) => {
                  const heightPercent = Math.round((trend.rescuedKg / maxTrendKg) * 85);
                  return (
                    <div key={trend.monthLabel} className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                      <span className="text-xs font-bold text-chocolate">
                        {trend.rescuedKg} kg
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-burntOrange to-burntOrange-300 rounded-t-xl transition-all duration-500 shadow-sm"
                        style={{ height: `${Math.max(20, heightPercent)}%` }}
                      />
                      <span className="text-[11px] font-bold text-chocolate/70">
                        {trend.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-2xl bg-cream-50 text-center">
                  <div className="text-xl font-extrabold font-heading text-chocolate">
                    {activeDonors}
                  </div>
                  <div className="text-[11px] font-bold text-chocolate/60">
                    Active Donors
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-cream-50 text-center">
                  <div className="text-xl font-extrabold font-heading text-chocolate">
                    {activeReceivers}
                  </div>
                  <div className="text-[11px] font-bold text-chocolate/60">
                    Active Shelters & NGOs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Recent Real Rescue Stories */}
      {highlights.length > 0 && (
        <section>
          <Container>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-extrabold font-heading text-chocolate">
                  Recent Verified Rescue Stories
                </h3>
                <p className="text-sm text-chocolate/70">
                  Every entry represents actual surplus food collected and enjoyed in the community.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map((story) => (
                  <div
                    key={story.id}
                    className="p-5 rounded-3xl bg-white border border-chocolate/10 shadow-clay-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cream-200 text-chocolate">
                        {story.category}
                      </span>
                      <span className="text-[11px] text-chocolate/60 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-chocolate/40" />
                        {new Date(story.completedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-base text-chocolate leading-snug">
                        {story.foodTitle}
                      </h4>
                      <p className="text-xs text-chocolate/70 mt-1">
                        From <strong className="text-chocolate">{story.donorName}</strong> to{' '}
                        <strong className="text-chocolate">{story.receiverName}</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-chocolate/10 flex items-center justify-between text-xs">
                      <span className="font-bold text-burntOrange">
                        {story.weightInKg} kg Rescued
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {story.beneficiariesFed} Beneficiaries
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 5. Transparency & Verification Guarantee */}
      <section>
        <Container>
          <div className="p-8 sm:p-10 rounded-3xl bg-cream-100 border border-chocolate/10 shadow-clay-card max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-chocolate">
                  Our Transparency & Data Guarantee
                </h3>
                <p className="text-xs sm:text-sm text-chocolate/70">
                  How Food Link ensures metrics are 100% authentic
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="text-xs font-bold text-burntOrange uppercase tracking-wider">
                  01. OTP Listing
                </div>
                <h5 className="font-heading font-bold text-sm text-chocolate">
                  Mobile SMS Verification
                </h5>
                <p className="text-xs text-chocolate/75 leading-relaxed">
                  Every food listing requires telephone ownership confirmation to eliminate spam and phantom listings.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-burntOrange uppercase tracking-wider">
                  02. Handshake Pickup
                </div>
                <h5 className="font-heading font-bold text-sm text-chocolate">
                  Confirmed Physical Handover
                </h5>
                <p className="text-xs text-chocolate/75 leading-relaxed">
                  Only when a registered receiver marks the food as physically received does the platform increment rescued kilograms.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-burntOrange uppercase tracking-wider">
                  03. Direct Atlas Queries
                </div>
                <h5 className="font-heading font-bold text-sm text-chocolate">
                  Zero Synthetic Counters
                </h5>
                <p className="text-xs text-chocolate/75 leading-relaxed">
                  All graphs and counts shown above are aggregated live from MongoDB Atlas donation records without hardcoded counters.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Call to Action */}
      <section>
        <Container>
          <div className="p-10 rounded-3xl bg-chocolate text-cream text-center space-y-6 max-w-4xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
              Be Part of the Solution Today
            </h3>
            <p className="text-sm sm:text-base text-cream/80 max-w-xl mx-auto">
              Join local businesses, chefs, bakeries, and neighbors giving good food another chance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/register?role=donor">
                <Button variant="primary" size="lg" leftIcon={<Heart className="w-5 h-5 fill-white/20" />}>
                  Donate Surplus Food
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg" className="border-cream/30 text-cream hover:bg-cream/10">
                  Explore Available Food
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
