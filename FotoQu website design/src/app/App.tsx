import "../styles/fonts.css";
import { Navbar } from "./components/Navbar";
import { HeroUpload } from "./components/HeroUpload";
import { HowItWorks } from "./components/HowItWorks";
import { OutputPreview } from "./components/OutputPreview";
import { Features } from "./components/Features";
import { FAQ } from "./components/FAQ";
import { CtaFooter } from "./components/CtaFooter";

export default function App() {
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
