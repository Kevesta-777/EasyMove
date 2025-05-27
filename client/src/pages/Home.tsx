import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import AboutUs from "@/components/home/AboutUs";
import VanSizeGuide from "@/components/home/VanSizeGuide";
import AreasWeCover from "@/components/home/AreasWeCover";
import FAQ from "@/components/home/FAQ";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <AboutUs />
      <VanSizeGuide />
      <AreasWeCover />
      <FAQ />
      <CTASection />
    </>
  );
}
