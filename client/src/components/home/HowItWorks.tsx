import { Calculator, CalendarCheck, Truck, ArrowRight, Check, Clock, Zap } from "lucide-react";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium mb-4">
            Fast & Easy Process
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How EasyMove Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto lg:text-lg">
            We've streamlined the moving process to make it as simple and stress-free as possible
          </p>
        </div>
        
        {/* Process Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Connection Lines (Desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-100 -mt-0.5 z-0"></div>
            
            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 relative z-10">
              {/* Instant Quote */}
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-4">
                    <Calculator className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Get an Instant Quote</h3>
                <p className="text-muted-foreground mb-4">
                  Enter your pickup and delivery addresses to receive an accurate quote in seconds.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Transparent pricing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">No hidden fees</span>
                  </li>
                </ul>
                <div className="text-primary text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-1" /> Instant online quotes
                </div>
              </div>
              
              {/* Book & Pay */}
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-4">
                    <CalendarCheck className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Book & Pay Online</h3>
                <p className="text-muted-foreground mb-4">
                  Select your preferred date and time, then complete your booking with our secure payment options.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Multiple payment methods</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Secure SSL checkout</span>
                  </li>
                </ul>
                <div className="text-primary text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Fast online booking
                </div>
              </div>
              
              {/* We Handle Your Move */}
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full text-primary mb-4">
                    <Truck className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">We Handle Your Move</h3>
                <p className="text-muted-foreground mb-4">
                  Our professional driver arrives at the scheduled time and takes care of your move with expertise.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Experienced drivers</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Careful handling of items</span>
                  </li>
                </ul>
                <div className="text-primary text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> On-time service guaranteed
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Banner */}
          <div className="mt-16 bg-primary rounded-xl shadow-md overflow-hidden">
            <div className="py-8 px-8 md:px-10 flex flex-col md:flex-row items-center justify-between">
              <div className="text-white text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
                <p className="text-white/80">Get your accurate quote in just 30 seconds</p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const quoteForm = document.getElementById('quote-form');
                  if (quoteForm) {
                    quoteForm.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-white text-primary font-medium py-3 px-6 rounded-lg flex items-center hover:bg-gray-50 transition-colors"
              >
                Get Your Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
