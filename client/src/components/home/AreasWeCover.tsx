import { MapPin, Search, Globe, CheckCircle2 } from "lucide-react";
import { MediumVanIcon } from "@/assets/van-icons";
import vanmanVideo from "../../assets/vanman_mp4.mp4";

// Focused regions based on business priorities
const regions = [
  {
    id: 1,
    name: "London",
    cities: [
      "Central London",
      "North London",
      "South London",
      "East London",
      "West London",
      "Greater London",
    ],
    featured: true,
  },
  {
    id: 2,
    name: "Essex",
    cities: [
      "Chelmsford",
      "Southend",
      "Colchester",
      "Basildon",
      "Brentwood",
      "Harlow",
      "Romford",
    ],
    featured: true,
  },
  {
    id: 3,
    name: "North East",
    cities: [
      "Newcastle",
      "Sunderland",
      "Durham",
      "Middlesbrough",
      "Darlington",
      "Gateshead",
      "Stockton",
    ],
    featured: true,
  },
  {
    id: 4,
    name: "West Midlands",
    cities: [
      "Birmingham",
      "Coventry",
      "Wolverhampton",
      "Walsall",
      "Solihull",
      "Dudley",
      "West Bromwich",
    ],
    featured: true,
  },
];

export default function AreasWeCover() {
  return (
    <section id="areas" className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium mb-4">
            Specialized Coverage Areas
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Areas We Serve
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto lg:text-lg">
            We specialize in providing exceptional moving services in key
            regions across the UK, with a focus on delivering the best
            experience in our core service areas.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Featured Regions Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-6 mb-10 border border-primary/20">
            <h3 className="text-xl font-bold mb-3 text-center text-primary">
              Our Primary Service Regions
            </h3>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">{region.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Left column - service map visual */}
            <div className="bg-secondary rounded-xl shadow-md overflow-hidden border border-primary/60">
              <div className="md:h-75 relative flex items-center justify-center">
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent text-white p-4" />
                <video
                  style={{ border: "1px solid #e5e7eb" }}
                  className="shadow-lg rounded-lg"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={vanmanVideo} type="video/mp4"></source>
                </video>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-6" />
              </div>
              <div className="p-6 bg-secondary">
                <h3 className="text-xl font-bold mb-2">
                  Expert Local Services
                </h3>
                <p className="text-muted-foreground">
                  Our drivers specialize in their local areas, offering
                  unmatched expertise in navigating and serving these regions
                  efficiently.
                </p>
              </div>
            </div>

            {/* Right column - quote search */}
            <div className="bg-secondary rounded-xl shadow-md p-8 border border-primary/10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Check Availability in Your Area
                </h3>
                <p className="text-muted-foreground mb-6">
                  Enter your postcode in our calculator to instantly check
                  availability and get a customized quote for your move.
                </p>
                <div className="bg-primary/5 p-4 rounded-lg mb-6">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Instant availability check</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Accurate pricing based on your location</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Book online in minutes</span>
                    </li>
                  </ul>
                </div>
              </div>
              <a
                href="#quote-form"
                className="bg-primary text-white font-medium py-3 px-4 rounded-lg text-center hover:bg-primary/90 transition-colors"
              >
                Get Your Quote Now
              </a>
            </div>
          </div>

          {/* Detailed regions grid */}
          <div className="bg-white rounded-xl shadow-md border overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-8 text-center">
                Detailed Coverage Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className="overflow-hidden bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="font-semibold text-primary flex items-center text-lg mb-3">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      {region.name}
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {region.cities.map((city, idx) => (
                        <li
                          key={idx}
                          className="group flex items-center hover:text-primary transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary/70 mr-2"></span>
                          {city}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-center text-muted-foreground">
                  While we specialize in our core regions, we can often
                  accommodate moves in other areas.
                  <a
                    href="#quote-form"
                    className="text-primary font-medium hover:underline ml-1"
                  >
                    Check your specific location
                  </a>{" "}
                  for availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
