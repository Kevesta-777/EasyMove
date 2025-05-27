import { Link } from "wouter";
import { 
  X, ChevronDown, ChevronRight, Phone, Mail, Home, Info, Users, MapPin, 
  HelpCircle, Calculator, CreditCard, TruckIcon, Clock, Car, PieChart, 
  Map, Star, Truck
} from "lucide-react";
import { useEffect, useState } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    onClose();
  };

  // Toggle submenu sections
  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm z-50">
      <div
        className={`bg-white h-full w-4/5 max-w-sm shadow-xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        {/* Header with logo and close button */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <Link href="/" onClick={handleLinkClick}>
              <span className="font-bold text-2xl bg-gradient-to-r from-primary to-[#0070FF] bg-clip-text text-transparent">
                Easy<span className="text-[#FF9500] bg-none">Move</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-primary focus:outline-none"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-4">
          {/* Features menu - Main hamburger menu item */}
          <div className="mb-2 border-b border-gray-100 pb-2">
            <button 
              className={`flex items-center justify-between w-full p-3 text-lg font-medium ${activeMenu === 'features' ? 'text-primary bg-blue-50' : 'text-gray-800'} hover:bg-blue-50 rounded-lg transition-colors`}
              onClick={() => toggleMenu('features')}
            >
              <span className="flex items-center">
                <Truck className="w-5 h-5 mr-3 text-primary" />
                Features
              </span>
              {activeMenu === 'features' ? (
                <ChevronDown className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {/* Features submenu - Consolidated */}
            {activeMenu === 'features' && (
              <div className="ml-4 pl-4 mt-1 border-l-2 border-blue-100 space-y-1">
                <a
                  href="#how-it-works"
                  className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  <Clock className="w-4 h-4 mr-3 text-primary" />
                  How It Works
                </a>
                <a
                  href="#size-guide"
                  className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  <Truck className="w-4 h-4 mr-3 text-primary" />
                  Van Size Guide
                </a>
                <a
                  href="#areas"
                  className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  <Map className="w-4 h-4 mr-3 text-primary" />
                  Areas We Cover
                </a>
                <a
                  href="#about-us"
                  className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  <Info className="w-4 h-4 mr-3 text-primary" />
                  About Us
                </a>
                <a
                  href="#faq"
                  className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleLinkClick}
                >
                  <HelpCircle className="w-4 h-4 mr-3 text-primary" />
                  FAQ
                </a>
                <Link href="/calculator">
                  <span
                    className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Calculator className="w-4 h-4 mr-3 text-primary" />
                    Price Calculator
                  </span>
                </Link>
                <Link href="/distance-calculator">
                  <span
                    className="flex items-center px-3 py-2.5 text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={handleLinkClick}
                  >
                    <Car className="w-4 h-4 mr-3 text-primary" />
                    Distance Calculator
                  </span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Contact information */}
          <div className="mt-4 px-3 py-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Contact Us</h3>
            <div className="space-y-2 text-sm">
              <a href="tel:+447477573794" className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-2 text-primary" />
                07477 573794
              </a>
              <a href="mailto:support@easymovevan.co.uk" className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-2 text-primary" />
                support@easymovevan.co.uk
              </a>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            <Link href="/driver-registration">
              <span
                onClick={handleLinkClick}
                className="block bg-gradient-to-r from-[#FF9500] to-[#FFAC30] text-white text-center px-4 py-3 rounded-xl font-medium transition hover:brightness-105 shadow-sm"
              >
                Join as Driver
              </span>
            </Link>
            <a
              href="#quote-form"
              onClick={handleLinkClick}
              className="block bg-gradient-to-r from-primary to-[#0070FF] text-white text-center px-4 py-3 rounded-xl font-medium transition hover:brightness-105 shadow-md"
            >
              Get Instant Quote
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
