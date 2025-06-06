import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DriverRegistration from "@/pages/DriverRegistration";
import TermsAndConditions from "@/pages/TermsAndConditions";
import EmbeddedStripeCheckout from "@/pages/EmbeddedStripeCheckout";
import BookingConfirmation from "@/pages/BookingConfirmation";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminSignup from "@/pages/admin/AdminSignup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminDrivers from "@/pages/admin/AdminDrivers";
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
      <Route path="/checkout" component={EmbeddedStripeCheckout} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/drivers" component={AdminDrivers} />
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
