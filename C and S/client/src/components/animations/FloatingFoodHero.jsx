import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Pause, RotateCcw, Heart, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DonationBasket from './DonationBasket';
import DonorCharacter from './DonorCharacter';
import ReceiverCharacter from './ReceiverCharacter';
import FoodItem from './FoodItem';
import CommunityScene from './CommunityScene';

export default function FloatingFoodHero() {
  const containerRef = useRef(null);

  // Auto-play state & animation progress (0.0 to 1.0)
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Purely derived active stage (eliminates React 19 maximum update depth warnings)
  // 1: Surplus, 2: Basket, 3: Handover, 4: Impact
  const activeStage = progress < 0.35 ? 1 : progress < 0.55 ? 2 : progress < 0.82 ? 3 : 4;

  // Derived animation states
  const basketFilled = progress >= 0.35 && progress < 0.88;
  const basketBouncing = progress >= 0.35 && progress <= 0.45;
  const isHandoverActive = progress >= 0.55 && progress < 0.82;
  const showImpactScene = progress >= 0.82;

  // Window scroll for natural parallax depth
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -35]);
  const parallaxScale = useTransform(scrollY, [0, 500], [1, 0.96]);

  // Master auto-playing timeline loop
  useEffect(() => {
    let animFrame;
    let lastTime = performance.now();
    const cycleDuration = 12000; // 12 seconds per full cinematic cycle

    const loop = (currentTime) => {
      if (isPlaying) {
        const delta = currentTime - lastTime;
        const safeDelta = Math.min(delta, 100);
        setProgress((prev) => {
          const next = prev + safeDelta / cycleDuration;
          return next >= 1 ? 0 : next;
        });
      }
      lastTime = currentTime;
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying]);

  // Manual stage selection by user
  const handleStageSelect = (stageId) => {
    const stageTargets = [0.05, 0.4, 0.65, 0.88];
    setProgress(stageTargets[stageId - 1]);
  };

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  // =========================================================================
  // MATH INTERPOLATION HELPERS FOR CONTINUOUS TIMELINE
  // =========================================================================
  const interpolate = (val, [inMin, inMax], [outMin, outMax]) => {
    if (val <= inMin) return outMin;
    if (val >= inMax) return outMax;
    const factor = (val - inMin) / (inMax - inMin);
    // Smooth cosine easing
    const eased = 0.5 - Math.cos(factor * Math.PI) / 2;
    return outMin + (outMax - outMin) * eased;
  };

  // --- Food Items Trajectory Calculations (0.0 to 0.40) ---
  // Each item glides from its corner into the central basket
  const getFoodMotion = (startRange, endRange, startX, startY, startRotate, endRotate) => {
    // Before gliding: waiting in corner with gentle floating breath
    if (progress < startRange) {
      const idle = Math.sin(progress * 60 + startX) * 5;
      return { x: startX, y: startY + idle, rotate: startRotate + idle * 0.5, scale: 1, opacity: 0.95 };
    }
    // Phase 1: Gliding into central basket with organic trajectory
    if (progress <= endRange) {
      const p = Math.max(0, (progress - startRange) / (endRange - startRange));
      const eased = Math.min(1, Math.max(0, 0.5 - Math.cos(p * Math.PI) / 2));
      const x = startX * (1 - eased);
      const y = startY * (1 - eased) + (p > 0.8 ? (p - 0.8) * 45 : 0);
      const rotate = startRotate + (endRotate - startRotate) * eased;
      const scale = 1 - eased * 0.45;
      const opacity = p >= 0.95 ? (1 - p) * 20 : 1;
      return { x, y, rotate, scale, opacity: Math.max(0, Math.min(1, opacity)) };
    }
    // Phase 2: Collected inside basket / hidden
    return { x: 0, y: 30, rotate: endRotate, scale: 0.1, opacity: 0 };
  };

  // Trajectories for 8 items with staggered timing:
  const tomatoMotion = getFoodMotion(0.00, 0.32, -340, -170, -15, 360);
  const appleMotion = getFoodMotion(0.03, 0.34, -200, -210, 20, -320);
  const carrotMotion = getFoodMotion(0.02, 0.33, 340, -170, 25, 280);
  const orangeMotion = getFoodMotion(0.05, 0.35, 200, -210, -20, -300);
  const bananaMotion = getFoodMotion(0.04, 0.35, -380, -50, -10, 180);
  const cabbageMotion = getFoodMotion(0.06, 0.36, 380, -50, 15, -180);
  const breadMotion = getFoodMotion(0.02, 0.34, -320, 160, 10, 200);
  const milkMotion = getFoodMotion(0.05, 0.36, 320, 160, -15, -220);

  // --- Handover Meal Package Trajectory (0.55 to 0.80) ---
  // Moves from left (Donor hand at -210px) across to right (Receiver hand at +210px)
  let handoverX = -210;
  let handoverY = 25;
  let handoverScale = 0.85;
  let handoverOpacity = 0;

  if (progress >= 0.52 && progress <= 0.82) {
    handoverOpacity = interpolate(progress, [0.52, 0.56], [0, 1]);
    if (progress > 0.78) {
      handoverOpacity = interpolate(progress, [0.78, 0.82], [1, 0]);
    }
    handoverX = interpolate(progress, [0.54, 0.76], [-210, 210]);
    // Parabolic arc: starts from donor hands, lifts up over basket, lands in receiver hands
    const normP = (progress - 0.54) / (0.76 - 0.54);
    handoverY = 25 - Math.sin(Math.max(0, Math.min(1, normP)) * Math.PI) * 65;
    handoverScale = 1 + Math.sin(Math.max(0, Math.min(1, normP)) * Math.PI) * 0.25;
  }

  // --- Golden Heart Pulse during Handover ---
  const heartScale = isHandoverActive
    ? 1 + Math.sin(progress * 40) * 0.15
    : 0.5;
  const heartOpacity = isHandoverActive ? 1 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full py-2 sm:py-6 overflow-visible select-none"
    >
      {/* ===================================================================== */}
      {/* INTERACTIVE CHAPTER BAR & PLAYBACK CONTROLS                           */}
      {/* ===================================================================== */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Chapter Selection Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-chocolate/10 shadow-sm overflow-x-auto w-full sm:w-auto">
          {[
            { id: 1, label: '1. Surplus Harvest' },
            { id: 2, label: '2. Basket Fills' },
            { id: 3, label: '3. Human Handover' },
            { id: 4, label: '4. Community Impact' },
          ].map((stage) => {
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageSelect(stage.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-burntOrange text-white shadow-clay-btn'
                    : 'text-chocolate/70 hover:bg-cream-100 hover:text-chocolate'
                }`}
              >
                {stage.label}
              </button>
            );
          })}
        </div>

        {/* Play / Pause / Replay Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-chocolate/10 text-xs font-bold text-chocolate/70">
            <span className="w-2 h-2 rounded-full bg-burntOrange animate-ping" />
            <span>{Math.round(progress * 100)}%</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-cream-100 text-chocolate border border-chocolate/15 font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={isPlaying ? 'Pause Animation' : 'Resume Animation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-burntOrange" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-burntOrange" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-white hover:bg-cream-100 text-chocolate/70 hover:text-chocolate border border-chocolate/15 shadow-sm transition-all cursor-pointer"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CINEMATIC HERO STAGE (Occupies 48–52% of Viewport Height)        */}
      {/* ===================================================================== */}
      <motion.div
        style={{ y: parallaxY, scale: parallaxScale }}
        className="relative w-full max-w-5xl h-[460px] sm:h-[500px] md:h-[540px] mx-auto flex items-center justify-center overflow-visible"
      >
        {/* Soft Ambient Glow in Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full bg-burntOrange/8 blur-3xl animate-pulse" />
          <div className="w-[360px] h-[360px] rounded-full bg-amber-400/10 blur-2xl" />
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* CHARACTER 1: FOOD DONOR (LEFT SIDE) */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 0.8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4.5,
            ease: 'easeInOut',
          }}
          className="absolute left-[2%] sm:left-[5%] md:left-[8%] bottom-[12%] sm:bottom-[14%] md:bottom-[16%] z-20 flex flex-col items-center pointer-events-none"
        >
          <div className="relative">
            <DonorCharacter className="w-36 h-48 sm:w-46 sm:h-62 md:w-54 md:h-70 drop-shadow-xl" />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-burntOrange text-white text-[10px] sm:text-xs font-heading font-extrabold shadow-md whitespace-nowrap">
              Food Donor
            </span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------- */}
        {/* CHARACTER 2: COMMUNITY RECEIVER (RIGHT SIDE)                         */}
        {/* ------------------------------------------------------------------- */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, -0.8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4.8,
            delay: 0.4,
            ease: 'easeInOut',
          }}
          className="absolute right-[2%] sm:right-[5%] md:right-[8%] bottom-[12%] sm:bottom-[14%] md:bottom-[16%] z-20 flex flex-col items-center pointer-events-none"
        >
          <div className="relative">
            <ReceiverCharacter className="w-36 h-48 sm:w-46 sm:h-62 md:w-54 md:h-70 drop-shadow-xl" />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] sm:text-xs font-heading font-extrabold shadow-md whitespace-nowrap">
              Community Receiver
            </span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------- */}
        {/* CENTRAL HERO: LARGE ILLUSTRATED DONATION BASKET                      */}
        {/* ------------------------------------------------------------------- */}
        <motion.div
          animate={
            basketBouncing
              ? { scale: [1, 1.08, 0.96, 1.03, 1], y: [0, -8, 2, -1, 0] }
              : { scale: 1, y: 0 }
          }
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-25 flex flex-col items-center justify-center my-auto"
        >
          <DonationBasket
            filled={basketFilled}
            bounce={basketBouncing}
            className="w-56 h-44 sm:w-72 sm:h-56 md:w-84 md:h-68"
          />

          {/* Real-time Narrative Status Pill */}
          <div className="mt-3 flex items-center justify-center">
            {activeStage === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-chocolate/10 text-xs font-bold text-chocolate shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-burntOrange" />
                <span>Collecting surplus food from local restaurants & households</span>
              </motion.div>
            )}

            {activeStage === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Donation basket filled with fresh community meals!</span>
              </motion.div>
            )}

            {activeStage === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold shadow-md"
              >
                <Heart className="w-4 h-4 text-burntOrange fill-burntOrange" />
                <span>Direct handover: from caring hands to someone in need</span>
              </motion.div>
            )}

            {activeStage === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-xs font-extrabold shadow-md"
              >
                <Users className="w-4 h-4 text-purple-700" />
                <span>Community table nourished • Zero edible food wasted</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------- */}
        {/* STAGE 1: 8 STAGGERED FOOD ITEMS GLIDING INTO BASKET                */}
        {/* ------------------------------------------------------------------- */}
        {/* 1. Tomato (Top Left) */}
        <div
          style={{
            transform: `translate3d(${tomatoMotion.x}px, ${tomatoMotion.y}px, 0) rotate(${tomatoMotion.rotate}deg) scale(${tomatoMotion.scale})`,
            opacity: tomatoMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="tomato" className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>

        {/* 2. Apple (Top Left Outer) */}
        <div
          style={{
            transform: `translate3d(${appleMotion.x}px, ${appleMotion.y}px, 0) rotate(${appleMotion.rotate}deg) scale(${appleMotion.scale})`,
            opacity: appleMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="apple" className="w-11 h-11 sm:w-15 sm:h-15" />
        </div>

        {/* 3. Carrot (Top Right) */}
        <div
          style={{
            transform: `translate3d(${carrotMotion.x}px, ${carrotMotion.y}px, 0) rotate(${carrotMotion.rotate}deg) scale(${carrotMotion.scale})`,
            opacity: carrotMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="carrot" className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>

        {/* 4. Orange (Top Right Outer) */}
        <div
          style={{
            transform: `translate3d(${orangeMotion.x}px, ${orangeMotion.y}px, 0) rotate(${orangeMotion.rotate}deg) scale(${orangeMotion.scale})`,
            opacity: orangeMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="orange" className="w-11 h-11 sm:w-14 sm:h-14" />
        </div>

        {/* 5. Banana (Left Edge) */}
        <div
          style={{
            transform: `translate3d(${bananaMotion.x}px, ${bananaMotion.y}px, 0) rotate(${bananaMotion.rotate}deg) scale(${bananaMotion.scale})`,
            opacity: bananaMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="banana" className="w-12 h-12 sm:w-15 sm:h-15" />
        </div>

        {/* 6. Cabbage (Right Edge) */}
        <div
          style={{
            transform: `translate3d(${cabbageMotion.x}px, ${cabbageMotion.y}px, 0) rotate(${cabbageMotion.rotate}deg) scale(${cabbageMotion.scale})`,
            opacity: cabbageMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="cabbage" className="w-12 h-12 sm:w-15 sm:h-15" />
        </div>

        {/* 7. Bread (Bottom Left) */}
        <div
          style={{
            transform: `translate3d(${breadMotion.x}px, ${breadMotion.y}px, 0) rotate(${breadMotion.rotate}deg) scale(${breadMotion.scale})`,
            opacity: breadMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="bread" className="w-14 h-14 sm:w-18 sm:h-18" />
        </div>

        {/* 8. Milk Carton (Bottom Right) */}
        <div
          style={{
            transform: `translate3d(${milkMotion.x}px, ${milkMotion.y}px, 0) rotate(${milkMotion.rotate}deg) scale(${milkMotion.scale})`,
            opacity: milkMotion.opacity,
          }}
          className="absolute z-30 pointer-events-none transition-opacity duration-150"
        >
          <FoodItem type="milk" className="w-12 h-12 sm:w-15 sm:h-15" />
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* STAGE 3: FOOD HANDOVER BETWEEN DONOR & RECEIVER                     */}
        {/* ------------------------------------------------------------------- */}
        <div
          style={{
            transform: `translate3d(${handoverX}px, ${handoverY}px, 0) scale(${handoverScale})`,
            opacity: handoverOpacity,
          }}
          className="absolute z-40 pointer-events-none flex items-center justify-center transition-opacity duration-200"
        >
          <div className="relative flex items-center justify-center">
            {/* The warm shared food item */}
            <FoodItem type="bread" className="w-16 h-16 sm:w-22 sm:h-22 drop-shadow-2xl" />

            {/* Glowing Connection Heart */}
            <div
              style={{
                transform: `scale(${heartScale})`,
                opacity: heartOpacity,
              }}
              className="absolute -top-6 flex items-center justify-center transition-all duration-150"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-burntOrange to-amber-500 flex items-center justify-center text-white shadow-xl animate-pulse">
                <Heart className="w-6 h-6 fill-white" />
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* STAGE 4: COMMUNITY IMPACT REVEAL (Overlaid at End of Cycle)         */}
        {/* ------------------------------------------------------------------- */}
        <AnimatePresence>
          {showImpactScene && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-cream-50/95 backdrop-blur-md rounded-3xl border border-burntOrange/20 shadow-2xl"
            >
              <div className="w-full max-w-xl text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Phase 4 Impact Verified</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate tracking-tight">
                  Good food deserves another chance.
                </h3>
                <p className="text-xs sm:text-sm text-chocolate/80 max-w-md mx-auto leading-relaxed">
                  Every shared meal connects generous donors with local shelters, orphanages, and families in need.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link to="/explore">
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-burntOrange text-white font-heading font-extrabold text-xs shadow-clay-btn hover:bg-burntOrange-dark transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Explore Active Food</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleStageSelect(1)}
                    className="px-4 py-2.5 rounded-xl bg-white text-chocolate border border-chocolate/15 font-heading font-bold text-xs hover:bg-cream-100 transition cursor-pointer"
                  >
                    Watch Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
