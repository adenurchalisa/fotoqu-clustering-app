import { Navbar } from "../components/landing/Navbar";
import { HeroUpload } from "../components/landing/HeroUpload";
import { HowItWorks } from "../components/landing/HowItWorks";
import { OutputPreview } from "../components/landing/OutputPreview";
import { Features } from "../components/landing/Features";
import { FAQ } from "../components/landing/FAQ";
import { CtaFooter } from "../components/landing/CtaFooter";

export default function Overview() {
  return (
    <div style={{ background: "#F7F5F0", overflowX: "hidden" }}>
      <Navbar />
      <HeroUpload />
      <HowItWorks />
      <OutputPreview />
      <Features />
      <FAQ />
      <CtaFooter />
    </div>
  );
}
