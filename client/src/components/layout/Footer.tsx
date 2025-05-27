import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-[#0070FF] bg-clip-text text-transparent">Easy<span className="text-[#FF9500] bg-none">Move</span></h3>
            <p className="text-gray-400 mb-4">
              The simplest way to book reliable man and van services across Northeast England.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-5 text-primary">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about-us" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  About Us
                </a>
              </li>
              <li>
                <a href="#size-guide" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  Van Size Guide
                </a>
              </li>
              <li>
                <a href="#areas" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  Areas We Cover
                </a>
              </li>
              <li>
                <Link href="/driver-registration">
                  <span className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 flex items-center group">
                    <span className="w-1.5 h-1.5 bg-[#FF9500] rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                    Join as Driver
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-5 text-primary">Help & Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  Contact Support
                </a>
              </li>
              <li>
                <Link href="/terms-and-conditions">
                  <span className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 flex items-center group">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                    Terms & Conditions
                  </span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                  Cookie Policy
                </a>
              </li>
              <li>
                <Link href="/stripe-config">
                  <span className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 flex items-center group">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 transform -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"></span>
                    Payment Settings
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-5 text-primary">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center">
                <MapPin className="mr-2 text-[#FF9500]" size={16} />
                <span>Newcastle upon Tyne, UK</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 text-[#FF9500]" size={16} />
                <span>07477 573794</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 text-[#FF9500]" size={16} />
                <span>support@easymovevan.co.uk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} EasyMove. All rights reserved.</p>
          <p className="mt-3">
            EasyMove acts as a platform connecting customers with service providers. EasyMove is not
            responsible for any loss or damage during transportation.
          </p>
        </div>
      </div>
    </footer>
  );
}