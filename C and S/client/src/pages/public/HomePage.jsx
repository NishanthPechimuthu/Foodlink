import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Heart,
  Search,
  ArrowRight,
  ShieldCheck,
  Users,
  Utensils,
  Truck,
  Sparkles,
  TrendingDown,
  Building2,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import Container from '../../components/common/Container';
import SectionHeading from '../../components/common/SectionHeading';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import FoodCard from '../../components/food/FoodCard';
import FoodDetailModal from '../../components/food/FoodDetailModal';
import FloatingFoodHero from '../../components/animations/FloatingFoodHero';
import { SAMPLE_FOOD_LISTINGS } from '../../services/sampleFoodData';
import axios from 'axios';

export default function HomePage() {
  const [selectedFood, setSelectedFood] = useState(null);
  const [previewCategory, setPreviewCategory] = useState('All');
  const [backendHealth, setBackendHealth] = useState(null);

  // Check backend health from Phase 1
  useEffect(() => {
    axios
      .get('/api/health')
      .then((res) => setBackendHealth(res.data))
      .catch((err) => console.log('Backend status check:', err.message));
  }, []);

  const categories = ['All', 'Cooked Meals', 'Bakery', 'Fruits', 'Vegetables', 'Packaged Food'];

  const filteredPreview =
    previewCategory === 'All'
      ? SAMPLE_FOOD_LISTINGS.slice(0, 3)
      : SAMPLE_FOOD_LISTINGS.filter((item) => item.category === previewCategory).slice(0, 3);

  return (
    <div className="space-y-20 sm:space-y-28 pb-16 overflow-hidden">
      {/* Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
      />

      {/* ======================================================== */}
      {/* SECTION 1: HERO SECTION WITH SIGNATURE FLOATING FOOD     */}
      {/* ======================================================== */}
      <section className="relative pt-4 sm:pt-6">
        <Container>
          <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-5">
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-burntOrange/10 border border-burntOrange/20 text-burntOrange text-xs sm:text-sm font-heading font-bold shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Good food deserves another chance</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-chocolate tracking-tight leading-[1.14]"
            >
              Connecting surplus food with people{' '}
              <span className="text-burntOrange underline decoration-burntOrange/30 decoration-wavy underline-offset-6">
                who need it.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-chocolate/80 max-w-2xl mx-auto font-normal leading-relaxed"
            >
              Share extra meals from restaurants, supermarkets and households with local NGOs, orphanages and community shelters. Reduce waste, create hope.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/register?role=donor">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Heart className="w-4 h-4 fill-white/20" />}
                >
                  Share Surplus Food
                </Button>
              </Link>
              <Link to="/explore">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  Explore Available Food
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Signature Animated Floating Food to Basket Component */}
          <div className="mt-4 sm:mt-6">
            <FloatingFoodHero />
          </div>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: THE FOOD WASTE PROBLEM                        */}
      {/* ======================================================== */}
      <section className="py-12 bg-cream-100/70 border-y border-chocolate/10 relative">
        <Container>
          <SectionHeading
            badge="The Challenge"
            title="Why Food Rescue"
            highlight="Matters Now"
            description="Millions of tons of delicious, perfectly safe food are discarded every day while community families and shelters face food insecurity."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="clay-card p-8 bg-white border border-chocolate/10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-softRed-light text-softRed flex items-center justify-center shadow-sm">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                Surplus Food Discarded Daily
              </h3>
              <p className="text-sm text-chocolate/75 leading-relaxed">
                Banquet surplus, unpurchased morning bakery items, and fresh produce are frequently thrown away simply because there is no fast community logistics link.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="clay-card p-8 bg-white border border-chocolate/10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amberPending-light text-amberPending-dark flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                Shelters & NGOs Stretched Thin
              </h3>
              <p className="text-sm text-chocolate/75 leading-relaxed">
                Local orphanages, community kitchens, and homeless shelters struggle daily to secure nutritious meals within limited donor budgets.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="clay-card p-8 bg-white border border-chocolate/10 space-y-4 border-l-4 border-l-burntOrange"
            >
              <div className="w-12 h-12 rounded-2xl bg-burntOrange-50 text-burntOrange flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                Food Link Bridges The Gap
              </h3>
              <p className="text-sm text-chocolate/75 leading-relaxed">
                We provide a direct, mobile OTP-verified real-time platform where donors list surplus food and nearby certified receivers claim and collect it safely.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: HOW FOOD LINK WORKS                          */}
      {/* ======================================================== */}
      <section>
        <Container>
          <SectionHeading
            badge="Simple 3-Step Process"
            title="How Food Link"
            highlight="Works"
            description="From surplus kitchen pans to community plates in three transparent, verified steps."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="clay-card p-8 bg-white border border-chocolate/10 relative text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-burntOrange text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-clay-btn">
                1
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cream-200 text-chocolate flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-burntOrange" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                1. Donor Lists Food
              </h3>
              <p className="mt-2 text-sm text-chocolate/75 leading-relaxed">
                Restaurants or households input food details, photo, and pickup deadline. Publication is verified securely via mobile SMS OTP.
              </p>
            </div>

            {/* Step 2 */}
            <div className="clay-card p-8 bg-white border border-chocolate/10 relative text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-chocolate text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-sm">
                2
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cream-200 text-chocolate flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-chocolate" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                2. Receiver Discovers & Requests
              </h3>
              <p className="mt-2 text-sm text-chocolate/75 leading-relaxed">
                NGOs, shelters, or individuals browse real-time available listings nearby and request the exact portions required.
              </p>
            </div>

            {/* Step 3 */}
            <div className="clay-card p-8 bg-white border border-chocolate/10 relative text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-sm">
                3
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cream-200 text-chocolate flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold font-heading text-chocolate">
                3. Pickup & Confirmed Rescue
              </h3>
              <p className="mt-2 text-sm text-chocolate/75 leading-relaxed">
                The donor approves the request, coordinates pickup, and upon successful handover, the meal is recorded as rescued!
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: AVAILABLE FOOD PREVIEW                        */}
      {/* ======================================================== */}
      <section className="py-12 bg-cream-100/60 border-y border-chocolate/10">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange/10 text-burntOrange border border-burntOrange/20 mb-2">
                Live Community Showcase
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-chocolate">
                Available Food <span className="text-burntOrange">Nearby</span>
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPreviewCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all shrink-0 cursor-pointer ${
                    previewCategory === cat
                      ? 'bg-burntOrange text-white shadow-sm'
                      : 'bg-white text-chocolate/80 hover:bg-cream-200 border border-chocolate/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPreview.map((food) => (
              <FoodCard key={food.id} food={food} onSelect={(item) => setSelectedFood(item)} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/explore">
              <Button variant="outlineOrange" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All Available Food Listings
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: IMPACT STATISTICS (PREVIEW METRICS)           */}
      {/* ======================================================== */}
      <section>
        <Container>
          <SectionHeading
            badge="Platform Milestones"
            title="Our Collective"
            highlight="Impact"
            description="Every contribution creates tangible environmental and social relief."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Utensils}
              value="4,850+"
              label="Meals Rescued"
              subtitle="Wholesome dishes redirected from waste"
              isDemo={true}
            />
            <StatCard
              icon={Building2}
              value="120+"
              label="Active Donors"
              subtitle="Restaurants, bakeries & households"
              isDemo={true}
            />
            <StatCard
              icon={Users}
              value="85+"
              label="Partner Shelters"
              subtitle="Orphanages & community kitchens supported"
              isDemo={true}
            />
            <StatCard
              icon={TrendingDown}
              value="2,400 kg"
              label="CO₂ Prevented"
              subtitle="Landfill greenhouse gas reduction"
              isDemo={true}
            />
          </div>

          <p className="text-center text-xs text-chocolate/60 mt-4">
            * Milestone figures reflect collective community goals. Real-time platform analytics are updated live as verified donations complete.
          </p>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: WHY CHOOSE FOOD LINK                          */}
      {/* ======================================================== */}
      <section className="py-12 bg-white border-y border-chocolate/10">
        <Container>
          <SectionHeading
            badge="The Food Link Advantage"
            title="Built For Safety, Speed &"
            highlight="Trust"
            description="Designed with rigorous food safety standards, instant notifications, and genuine community accountability."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burntOrange text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-chocolate">
                Mobile OTP Verification
              </h4>
              <p className="text-sm text-chocolate/75">
                Every food listing publication requires registered SMS OTP authentication, preventing spam and verifying donor intent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-chocolate text-white flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-chocolate">
                Detailed Handling Guidelines
              </h4>
              <p className="text-sm text-chocolate/75">
                Transparent preparation timestamps, storage temperatures, and handling advisories ensure receiver safety at every stage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-chocolate/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-chocolate">
                Verified Collection Confirmation
              </h4>
              <p className="text-sm text-chocolate/75">
                Donations count toward community impact only when the receiver confirms successful in-person collection.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: CALL TO ACTION BANNER                         */}
      {/* ======================================================== */}
      <section>
        <Container>
          <div className="clay-card bg-gradient-to-br from-chocolate via-chocolate-600 to-chocolate-700 text-cream p-10 sm:p-14 rounded-3xl relative overflow-hidden shadow-2xl">
            {/* Background decorative circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-burntOrange/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cream/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burntOrange/30 text-burntOrange-200 text-xs font-bold uppercase tracking-wider">
                <Heart className="w-3.5 h-3.5 fill-burntOrange-200" />
                Join The Movement
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
                Be part of a world where good food never goes to waste.
              </h2>

              <p className="text-cream/80 text-base sm:text-lg">
                Whether you run a kitchen with extra portions or represent an organization in need of meals, Food Link connects you in minutes.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register?role=donor">
                  <Button variant="primary" size="lg" leftIcon={<Heart className="w-4 h-4 fill-white/20" />}>
                    Start Donating Today
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="lg" className="border-cream/30 text-cream hover:bg-cream/10 hover:border-cream">
                    Find Available Food
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Backend Status Verification Pill */}
      {backendHealth && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-200/80 border border-chocolate/10 text-xs text-chocolate/70">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>API Connected: {backendHealth.application} ({backendHealth.status})</span>
          </div>
        </div>
      )}
    </div>
  );
}
