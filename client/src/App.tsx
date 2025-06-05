import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DriverRegistration from "@/pages/DriverRegistration";
import TermsAndConditions from "@/pages/TermsAndConditions";
// Removed Calculator page (Price Quote page) to avoid confusion
import Checkout from "@/pages/Checkout";
import PayPalCheckout from "@/pages/PayPalCheckout";
import StripeCheckout from "@/pages/StripeCheckout";
import EmbeddedStripeCheckout from "@/pages/EmbeddedStripeCheckout";
import PaymentTester from "@/pages/PaymentTester";
import DetailedQuote from "@/pages/DetailedQuote";
import TestDetailedQuotes from "@/pages/TestDetailedQuotes";
import BookingTracker from "@/pages/BookingTracker";

import BookingConfirmation from "@/pages/BookingConfirmation";
import StripeConfig from "@/pages/StripeConfig";
import DistanceCalculator from "@/pages/DistanceCalculator";
import CalculatorPage from "@/pages/Calculator";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { useState } from "react";
import MobileMenu from "./components/layout/MobileMenu";
import { QuoteProvider } from "@/contexts/QuoteContext";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/driver-registration" component={DriverRegistration} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/stripe-config" component={StripeConfig} />
      <Route path="/paypal-checkout" component={PayPalCheckout} />
      <Route path="/stripe-checkout" component={StripeCheckout} />
      <Route path="/embedded-checkout" component={EmbeddedStripeCheckout} />
      <Route path="/distance-calculator" component={DistanceCalculator} />
      <Route path="/calculator" component={CalculatorPage} />
      <Route path="/payment-test" component={PaymentTester} />
      <Route path="/quote" component={DetailedQuote} />
      <Route path="/test-detailed-quotes" component={TestDetailedQuotes} />
      <Route path="/booking-tracker" component={BookingTracker} />
      <Route component={NotFound} />
    </Switch>
  );
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <QuoteProvider>
        <TooltipProvider>
          <Elements stripe={stripePromise}>
          <div className="flex flex-col min-h-screen">
            <Header onMenuToggle={toggleMobileMenu} />
            <MobileMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
         </Elements>
        </TooltipProvider>
      </QuoteProvider>
    </QueryClientProvider>
  );
}

export default App;
