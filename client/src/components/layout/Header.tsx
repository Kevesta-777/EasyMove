import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Phone,
  Truck,
  Map,
  Clock,
  Car,
  Calculator,
  Users,
  Info,
  HelpCircle,
  Star,
} from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  // Function to scroll to quote form
  const scrollToQuoteForm = (event: React.MouseEvent) => {
    event.preventDefault();
    const quoteForm = document.getElementById("quote-form");
    if (quoteForm) {
      quoteForm.scrollIntoView({ behavior: "smooth" });
    } else {
      console.error("Quote form element not found");
      // Fallback to scrolling to bottom if element not found
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-primary/5 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and mobile menu button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="text-gray-700 hover:text-primary focus:outline-none lg:hidden transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-7 w-7" />
            </button>
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                {/* Van Icon as Logo */}
                <div className="hidden sm:flex h-9 w-9 bg-gradient-to-r from-primary to-[#0070FF] text-white rounded-lg items-center justify-center">
                  <Truck className="h-5 w-5" />
                  {/* <img
                  src="https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeibbf2s7eilksfq6vg3ussjp3y3gzuqseit5h7i2tjpm6pumnltq5y"
                  style={{ width: 164 }}
                /> */}
                  {/* <img
                    src="https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeifw4kamqamqfgxdr5wg7ehmgjamua5dskamy2rrouc3wmd3xhzt2i"
                    style={{ width: 164 }}
                  /> */}
                </div>
                {/* Company Name */}
                <div className="flex flex-col">
                  <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-primary to-[#0070FF] bg-clip-text text-transparent tracking-tight leading-none">
                    Easy<span className="text-[#FF9500] bg-none">Move</span>
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 tracking-tight leading-none">
                    MAN AND VAN SERVICES
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Simplified with single Features dropdown */}
          <nav className="hidden lg:flex items-center space-x-10">
            <div className="flex space-x-8">
              {/* Features dropdown - All informational links in one dropdown */}
              <div className="relative group">
                <a
                  href="#"
                  className="text-foreground hover:text-primary font-medium transition-colors group-hover:text-primary inline-flex items-center"
                >
                  Features
                  <svg
                    className="ml-1 w-4 h-4 group-hover:rotate-180 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1 divide-y divide-gray-100">
                    <a
                      href="#how-it-works"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <Clock className="w-4 h-4 mr-3 text-primary" />
                      How It Works
                    </a>
                    <a
                      href="#size-guide"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <Truck className="w-4 h-4 mr-3 text-primary" />
                      Van Size Guide
                    </a>
                    <a
                      href="#areas"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <Map className="w-4 h-4 mr-3 text-primary" />
                      Areas We Cover
                    </a>
                    <a
                      href="#about-us"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <Info className="w-4 h-4 mr-3 text-primary" />
                      About Us
                    </a>
                    <a
                      href="#faq"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <HelpCircle className="w-4 h-4 mr-3 text-primary" />
                      FAQ
                    </a>
                    {/* <Link href="/calculator">
                      <span className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary cursor-pointer">
                        <Calculator className="w-4 h-4 mr-3 text-primary" />
                        Price Calculator
                      </span>
                    </Link> */}
                    <Link href="/distance-calculator">
                      <span className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary cursor-pointer">
                        <Car className="w-4 h-4 mr-3 text-primary" />
                        Distance Calculator
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Phone number for immediate contact */}
              <a
                href="tel:+447477573794"
                className="text-foreground hover:text-primary font-medium transition-colors relative group inline-flex items-center"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                07477 573794
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>

            {/* Primary action buttons remain prominent */}
            <div className="flex items-center space-x-4">
              {/* Join as Driver button */}
              <Link href="/driver-registration">
                <span className="bg-gradient-to-r from-[#FF9500] to-[#FFAC30] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 hover:brightness-105">
                  Join as Driver
                </span>
              </Link>

              {/* Get Quote button */}
              <button
                onClick={scrollToQuoteForm}
                className="bg-gradient-to-r from-primary to-[#0070FF] text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:brightness-105"
              >
                Get Instant Quote
              </button>
            </div>
          </nav>

          {/* Mobile action buttons */}
          <div className="flex items-center space-x-3 lg:hidden">
            <Link href="/driver-registration">
              <span className="text-[#FF9500] font-medium text-sm hover:text-amber-600 transition-colors">
                Join as Driver
              </span>
            </Link>
            <button
              onClick={scrollToQuoteForm}
              className="bg-gradient-to-r from-primary to-[#0070FF] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              Get Quote
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
