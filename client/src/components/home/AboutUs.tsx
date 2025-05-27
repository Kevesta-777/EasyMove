import { CheckCircle, Shield, Clock, TrendingUp, Headphones, ThumbsUp } from "lucide-react";

export default function AboutUs() {
  return (
    <section id="about-us" className="section bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 mb-8 lg:mb-0 lg:pr-12">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium mb-4">
              Why Choose Us
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              About EasyMove
            </h2>
            <p className="text-muted-foreground mb-6 lg:text-lg">
              EasyMove is the UK's premier man and van booking platform, connecting customers with reliable,
              professional moving services nationwide. Founded in 2020, we've revolutionized the way people move 
              with transparent pricing and exceptional service quality.              
            </p>
            <p className="text-muted-foreground mb-6 lg:text-lg">
              Our sophisticated pricing algorithm considers distance, van size, access conditions, time of day, 
              and numerous other factors to provide you with the most accurate quote possible. We believe in 
              total transparency—no hidden fees, just straightforward service you can trust.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              <div className="group flex items-start">
                <div className="mr-4 mt-1 bg-primary/10 p-2 rounded-full">
                  <Shield className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Fully Vetted Professionals</h3>
                  <p className="text-muted-foreground text-sm">Every driver undergoes thorough background checks and maintains high ratings</p>
                </div>
              </div>
              
              <div className="group flex items-start">
                <div className="mr-4 mt-1 bg-primary/10 p-2 rounded-full">
                  <TrendingUp className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Advanced Price Calculation</h3>
                  <p className="text-muted-foreground text-sm">Our algorithms ensure fair and transparent pricing for every journey</p>
                </div>
              </div>
              
              <div className="group flex items-start">
                <div className="mr-4 mt-1 bg-primary/10 p-2 rounded-full">
                  <Clock className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Instant Bookings</h3>
                  <p className="text-muted-foreground text-sm">Book in minutes with real-time availability and instant confirmation</p>
                </div>
              </div>
              
              <div className="group flex items-start">
                <div className="mr-4 mt-1 bg-primary/10 p-2 rounded-full">
                  <Headphones className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">24/7 Support</h3>
                  <p className="text-muted-foreground text-sm">Our dedicated team is always available to assist with any questions</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <ThumbsUp className="text-primary" size={20} />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="font-semibold">Highly Rated Service</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Trusted by thousands of satisfied customers</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Our Promise</h3>
              <p className="text-muted-foreground mb-6">
                We're committed to making your moving experience as smooth and stress-free as possible. 
                Our transparent pricing means no surprises, and our reliable service ensures your belongings 
                arrive safely and on time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>100% Satisfaction Guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Fully Insured Services</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Nationwide Coverage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Responsive Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
