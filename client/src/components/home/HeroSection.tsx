import { CheckCircle2, Star, Shield } from "lucide-react";
import HomeCalculator from "./HomeCalculator";

export default function HeroSection() {
  return (
    <section className="relative bg-primary text-white py-16 lg:py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-700 opacity-90"></div>

      {/* Decorative Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-white/20"></div>
        <div className="absolute -bottom-32 right-1/3 w-80 h-80 rounded-full bg-white/20"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div>
            <div className="bg-white/10 text-white inline-block px-4 py-2 rounded-full text-sm font-medium mb-6">
              Professional man and van services in the UK
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Fast & Reliable
              <br />
              <span className="text-blue-200">Moving Service</span>
            </h1>

            <p className="text-lg lg:text-xl mb-8 text-blue-50 max-w-xl leading-relaxed">
              Professional, affordable moving services in North East, London,
              West Midlands, and Essex. Get an instant quote and book online in
              minutes.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                <span className="text-blue-50">Fixed pricing</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                <span className="text-blue-50">Vetted drivers</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-blue-200 mr-2 flex-shrink-0" />
                <span className="text-blue-50">Instant booking</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 items-center mb-10">
              <div className="flex items-center bg-white/10 px-3 py-2 rounded-lg">
                <Star className="h-4 w-4 text-yellow-300 mr-1" />
                <span className="text-sm font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center bg-white/10 px-3 py-2 rounded-lg">
                <Shield className="h-4 w-4 text-blue-200 mr-1" />
                <span className="text-sm font-medium">Fully Insured</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                const quoteForm = document.getElementById("quote-form");
                if (quoteForm) {
                  quoteForm.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-block bg-white text-primary font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              Get Your Quote
            </button>
          </div>

          {/* Right Column - Calculator */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/10">
            <HomeCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
