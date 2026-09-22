import HeroSection from '@/components/landing/HeroSection';
import KineticMarquee from '@/components/landing/KineticMarquee';
import CuratedAteliers from '@/components/landing/CuratedAteliers';
import ProblemSolution from '@/components/landing/ProblemSolution';
import BrandShowcase from '@/components/landing/BrandShowcase';
import MobileHomeView from '@/components/landing/MobileHomeView';

export default function Home() {
  return (
    <>
      {/* 1. Mobile Home View (Small Screens) */}
      <div className="block md:hidden">
        <MobileHomeView />
      </div>

      {/* 2. Desktop Luxury Landing View (Medium & Large Screens) */}
      <div className="hidden md:flex flex-col">
        {/* Hero Section with Automated Morphing FLIP Lookbook */}
        <HeroSection />

        {/* Dual-Row Velocity Kinetic Marquee */}
        <KineticMarquee />

        {/* Curated Nigerian Designers (Featured Designers) */}
        <CuratedAteliers />

        {/* The Ìrísí Standards Luxury Pillars (The Complete Nigerian Drip) */}
        <ProblemSolution />

        {/* Partner Brands & Fast Delivery Matrix */}
        <BrandShowcase />
      </div>
    </>
  );
}
