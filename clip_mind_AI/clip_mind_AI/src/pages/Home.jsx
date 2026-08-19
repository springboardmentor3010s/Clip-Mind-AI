import HowItWorks from "../components/home/HowItWorks";
import Features from "../components/home/Features";
import RoleShowcase from "../components/home/RoleShowcase";
import FAQ from "../components/home/FAQ";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/home/Hero";

function Home() {
  return (
    <div className="bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <HowItWorks />
      <RoleShowcase />
      {/* Anchored so the Contact page can link straight to it */}
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </div>
  );
}

export default Home;
