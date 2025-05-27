import { Shield, Scale, BookOpen, FileText, BookCheck, HelpCircle } from "lucide-react";

export default function TermsAndConditions() {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10">
            <div className="bg-primary p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Terms and Conditions</h1>
                  <p className="text-white/80 mt-2">Please read these terms carefully before using our services</p>
                </div>
                <FileText size={48} className="text-white/80" />
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center space-x-3 bg-secondary/50 p-4 rounded-xl mb-8">
                <BookCheck className="text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">Last Updated:</span> {formattedDate} • This document is also available as a <a href="#" className="text-primary underline">PDF download</a>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                <div className="md:col-span-1">
                  <div className="sticky top-8">
                    <h3 className="font-semibold mb-4 text-primary">Quick Navigation</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="hover:text-primary transition-colors">
                        <a href="#introduction" className="block py-1">1. Introduction</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#platform-purpose" className="block py-1">2. Platform Purpose</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#liability" className="block py-1">3. Disclaimer of Liability</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#vetting" className="block py-1">4. Driver Vetting</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#booking" className="block py-1">5. Booking and Cancellation</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#prohibited" className="block py-1">6. Prohibited Items</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#payment" className="block py-1">7. Payment Terms</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#privacy" className="block py-1">8. Privacy Policy</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#law" className="block py-1">9. Governing Law</a>
                      </li>
                      <li className="hover:text-primary transition-colors">
                        <a href="#contact" className="block py-1">10. Contact Information</a>
                      </li>
                    </ul>
                    
                    <div className="mt-8 p-4 bg-secondary rounded-xl">
                      <div className="flex items-center text-primary mb-2">
                        <HelpCircle size={16} className="mr-2" />
                        <h4 className="font-semibold">Need Help?</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">If you have any questions about our terms, please don't hesitate to contact our support team.</p>
                      <a href="mailto:legal@easymovevan.co.uk" className="text-sm text-primary hover:underline">legal@easymovevan.co.uk</a>
                    </div>
                  </div>
                </div>
              
                <div className="md:col-span-3 prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary">
                  <div id="introduction">
                    <div className="flex items-center mb-4">
                      <BookOpen className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">1. Introduction</h2>
                    </div>
                    <p className="text-muted-foreground">
                      These terms and conditions govern your use of the EasyMove platform, which connects customers with independent van and driver services. By using our platform, you agree to be bound by these terms.
                    </p>
                  </div>
                  
                  <div id="platform-purpose" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Shield className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">2. Platform Purpose</h2>
                    </div>
                    <p className="text-muted-foreground">
                      EasyMove is a platform that facilitates connections between customers requiring moving services and independent drivers offering those services. EasyMove does not provide moving services directly.
                    </p>
                  </div>
                  
                  <div id="liability" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Scale className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">3. Disclaimer of Liability</h2>
                    </div>
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mb-4">
                      <p className="text-amber-800">
                        <strong>IMPORTANT:</strong> EasyMove only connects drivers and customers, and is not responsible for loss or damage during transportation. All liability for the safe transportation of goods remains with the driver providing the service.
                      </p>
                    </div>
                  </div>
                  
                  <div id="vetting" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Shield className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">4. Driver Vetting</h2>
                    </div>
                    <p className="text-muted-foreground">
                      While EasyMove reviews documentation provided by drivers, including insurance certificates and driving licenses, customers should satisfy themselves that the driver is suitable for their needs before confirming a booking.
                    </p>
                  </div>
                  
                  <div id="booking" className="mt-10">
                    <div className="flex items-center mb-4">
                      <BookCheck className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">5. Booking and Cancellation</h2>
                    </div>
                    <ul className="space-y-2 text-muted-foreground list-none pl-0">
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">5.1</span>
                        <span>Customers can request quotes and make bookings through our platform.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">5.2</span>
                        <span>Cancellations made more than 24 hours before the scheduled move time incur no fee.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">5.3</span>
                        <span>Cancellations made less than 24 hours before the scheduled move time incur a 50% fee.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">5.4</span>
                        <span>No-shows incur a 100% fee.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div id="prohibited" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Shield className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">6. Prohibited Items</h2>
                    </div>
                    <p className="text-muted-foreground">
                      Drivers are prohibited from transporting illegal items, hazardous materials, flammable liquids, animals, or high-value items such as jewelry or large amounts of cash. EasyMove accepts no liability for the transport of such items.
                    </p>
                  </div>
                  
                  <div id="payment" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Scale className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">7. Payment Terms</h2>
                    </div>
                    <ul className="space-y-2 text-muted-foreground list-none pl-0">
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">7.1</span>
                        <span>Payments are processed securely through our platform.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">7.2</span>
                        <span>Quotes are based on the information provided by the customer. Additional charges may apply if the actual requirements differ.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center text-primary text-sm font-medium mr-3 mt-0.5 flex-shrink-0">7.3</span>
                        <span>EasyMove charges a service fee for facilitating connections between customers and drivers.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div id="privacy" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Shield className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">8. Privacy Policy</h2>
                    </div>
                    <p className="text-muted-foreground">
                      EasyMove collects and processes personal data in accordance with our Privacy Policy, which is incorporated into these terms by reference.
                    </p>
                  </div>
                  
                  <div id="law" className="mt-10">
                    <div className="flex items-center mb-4">
                      <Scale className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">9. Governing Law</h2>
                    </div>
                    <p className="text-muted-foreground">
                      These terms are governed by and construed in accordance with the laws of the United Kingdom.
                    </p>
                  </div>
                  
                  <div id="contact" className="mt-10">
                    <div className="flex items-center mb-4">
                      <HelpCircle className="text-primary mr-3 flex-shrink-0" size={20} />
                      <h2 className="text-xl font-bold">10. Contact Information</h2>
                    </div>
                    <p className="text-muted-foreground">
                      For questions or concerns regarding these terms, please contact us at:
                    </p>
                    <div className="bg-secondary/50 rounded-lg p-4 mt-4">
                      <p className="mb-0">
                        <strong>Email:</strong> <a href="mailto:legal@easymovevan.co.uk">legal@easymovevan.co.uk</a><br />
                        <strong>Address:</strong> 123 Business Park, Newcastle upon Tyne, NE1 4ST, UK
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-16 p-6 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      By using EasyMove services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
