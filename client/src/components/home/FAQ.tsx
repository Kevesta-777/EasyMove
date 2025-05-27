import { useState } from "react";
import {
  ChevronDown,
  Mail,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  PoundSterling,
  Clock,
  Shield,
  Package,
  Users,
} from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  icon: JSX.Element;
  category: "pricing" | "booking" | "service" | "policy";
}

const faqItems: FaqItem[] = [
  {
    id: 1,
    category: "pricing",
    icon: <PoundSterling className="text-primary" size={20} />,
    question: "How does EasyMove calculate prices?",
    answer:
      "Our advanced pricing algorithm considers multiple factors: distance, van size, accessibility, day/time, and additional services. We've engineered our system to provide the most accurate pricing in the industry with no hidden fees. Our comprehensive formula includes road winding factors, traffic conditions, and even regional price variations to ensure you get a fair quote that reflects the true cost of service.",
  },
  {
    id: 2,
    category: "booking",
    icon: <Clock className="text-primary" size={20} />,
    question: "What if I need to cancel or reschedule my booking?",
    answer:
      "Flexibility is built into our booking system. You can cancel or reschedule your booking up to 24 hours before your scheduled time without any charge through your customer dashboard. Cancellations made less than 24 hours before will incur a 50% fee to compensate drivers who have reserved their time. Our customer service team is available 24/7 to assist with any changes.",
  },
  {
    id: 3,
    category: "policy",
    icon: <Shield className="text-primary" size={20} />,
    question: "Are the drivers insured?",
    answer:
      "Yes, all drivers on our platform are required to maintain comprehensive vehicle insurance and public liability insurance with minimum coverage of £1 million. We verify insurance documentation during our thorough vetting process. However, as EasyMove serves as a connection platform, the liability for safe transportation lies with the driver. For additional peace of mind, we offer the option to purchase extended goods-in-transit insurance during checkout.",
  },
  {
    id: 4,
    category: "service",
    icon: <Package className="text-primary" size={20} />,
    question: "What items can't be transported?",
    answer:
      "For safety and legal reasons, our drivers cannot transport: illegal items, hazardous materials (including paint and certain cleaning products), flammable liquids, compressed gases, animals or pets, plants, food that requires refrigeration, extremely valuable items (jewelry, large cash sums, etc.), or irreplaceable items (family heirlooms, important documents without copies). Please check our terms and conditions for a complete list.",
  },
  {
    id: 5,
    category: "service",
    icon: <Users className="text-primary" size={20} />,
    question: "Do I need to help with loading/unloading?",
    answer:
      "Our standard service includes driver assistance with loading and unloading. For efficiency and safety, we recommend having items packed and ready before the driver arrives. For moves involving very heavy items (over 25kg), multiple flights of stairs, or items requiring special handling, we recommend booking additional helpers. You can add extra assistance during the booking process for a small additional fee.",
  },
  {
    id: 6,
    category: "pricing",
    icon: <PoundSterling className="text-primary" size={20} />,
    question: "Are there any hidden fees?",
    answer:
      "Absolutely not. We pride ourselves on transparent pricing. Your quote includes all standard services, and any potential additional costs (such as parking fees, congestion charges, or toll roads) will be clearly indicated before you confirm your booking. Our drivers are not permitted to charge extra fees that weren't included in your original quote unless the job requirements change significantly on the day.",
  },
  {
    id: 7,
    category: "booking",
    icon: <Clock className="text-primary" size={20} />,
    question: "How far in advance should I book?",
    answer:
      "While we can often accommodate same-day bookings, we recommend booking at least 48 hours in advance to ensure availability of your preferred van size and time slot. For weekend moves or end-of-month dates, which tend to be our busiest periods, booking 5-7 days in advance is advisable. For urgent moves, our express booking option connects you with drivers who can arrive within 90 minutes.",
  },
  {
    id: 8,
    category: "policy",
    icon: <Shield className="text-primary" size={20} />,
    question: "How are drivers vetted?",
    answer:
      "Every driver undergoes our rigorous 5-point verification process: 1) Identity verification and right-to-work checks, 2) Driving license validation with DVLA, 3) Vehicle and insurance documentation review, 4) Background checks, and 5) Professional standards interview. Only 65% of applicants successfully complete our vetting process. Additionally, our rating system ensures ongoing quality control, with drivers maintaining at least a 4.7/5 rating to remain on our platform.",
  },
];

export default function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };

  const filteredFaqs = activeCategory
    ? faqItems.filter((faq) => faq.category === activeCategory)
    : faqItems;

  return (
    <section id="faq" className="section bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium mb-4">
            Help & Support
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto lg:text-lg">
            Get quick answers to the most common questions about our man and van
            services.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 bg-secondary/70 rounded-lg">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!activeCategory ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              All FAQs
            </button>
            <button
              onClick={() => setActiveCategory("pricing")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === "pricing" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveCategory("booking")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === "booking" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Booking
            </button>
            <button
              onClick={() => setActiveCategory("service")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === "service" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveCategory("policy")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === "policy" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Policies
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="mb-4">
              <button
                className={`w-full flex justify-between items-center text-left p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-all duration-200 ${openItem === faq.id ? "bg-white shadow-md rounded-b-none border-b-0" : ""}`}
                onClick={() => toggleItem(faq.id)}
                aria-expanded={openItem === faq.id}
              >
                <div className="flex items-center">
                  <div className="mr-4 bg-primary/10 p-2 rounded-full">
                    {faq.icon}
                  </div>
                  <span className="font-medium text-foreground">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`text-primary transition-transform duration-200 ${openItem === faq.id ? "rotate-180" : ""}`}
                  size={20}
                />
              </button>
              {openItem === faq.id && (
                <div className="bg-white px-6 py-4 rounded-b-xl shadow-sm border border-t-0 border-gray-100">
                  <p className="text-muted-foreground pl-14">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0 md:max-w-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <HelpCircle className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground">
                Our friendly support team is available 24/7 to assist you with
                any queries about our man and van services.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <a
                href="mailto:support@easymovevan.co.uk"
                className="flex items-center justify-center bg-secondary/50 text-primary font-medium px-6 py-3 rounded-xl hover:bg-secondary/70 transition-colors duration-200 border border-primary/10"
              >
                <Mail className="mr-2 h-5 w-5" /> Email Us
              </a>
              <a
                href="tel:+441234567890"
                className="flex items-center justify-center bg-secondary/50 text-primary font-medium px-6 py-3 rounded-xl hover:bg-secondary/70 transition-colors duration-200 border border-primary/10"
              >
                <PhoneCall className="mr-2 h-5 w-5" /> Call Us
              </a>
              {/* <a
                href="#"
                className="flex items-center justify-center bg-gradient-to-r from-primary to-accent text-white font-medium px-6 py-3 rounded-xl hover:opacity-95 transition-opacity duration-200 shadow-md"
              >
                <MessageCircle className="mr-2 h-5 w-5" /> Live Chat
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
