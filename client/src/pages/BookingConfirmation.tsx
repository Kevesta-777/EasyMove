import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Check, CheckCircle, Calendar, MapPin, Truck, Clock } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentQuote, loadQuoteFromLocalStorage } = useQuote();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingReference, setBookingReference] = useState('');
  const [success, setSuccess] = useState(true);
  
  // Format price helper
  function formatPrice(price: number): string {
    return `£${price.toFixed(2)}`;
  }

  useEffect(() => {
    // Load booking details
    const loadBooking = async () => {
      setIsLoading(true);
      
      try {
        // Get payment intent ID from URL
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get('payment_intent');
        
        if (!paymentIntentId) {
          // Try to see if we have a quote
          if (!currentQuote) {
            loadQuoteFromLocalStorage();
          }
          
          if (!currentQuote) {
            throw new Error("No booking information found");
          }
          
          // Generate a reference number
          const randomRef = 'EM-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          setBookingReference(randomRef);
          
          // Use the quote information
          setBookingDetails(currentQuote);
          setSuccess(true);
        } else {
          // Generate booking reference based on payment intent
          const ref = 'EM-' + paymentIntentId.substring(3, 9).toUpperCase();
          setBookingReference(ref);
          
          try {
            // For a real application, you would fetch the booking details from the server
            // by looking up the payment intent ID
            // Here we just use the current quote
            if (!currentQuote) {
              loadQuoteFromLocalStorage();
            }
            
            if (currentQuote) {
              setBookingDetails(currentQuote);
            } else {
              // Fallback if no quote is available
              setBookingDetails({
                pickupAddress: "Loading...",
                deliveryAddress: "Loading...",
                vanSize: "medium",
                distance: 0,
                totalWithVAT: 0
              });
            }
            
            setSuccess(true);
          } catch (error) {
            console.error("Failed to fetch booking details:", error);
            setSuccess(false);
            toast({
              title: "Error Loading Booking",
              description: "We couldn't retrieve your booking details. Please contact support.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error in booking confirmation:", error);
        setSuccess(false);
        toast({
          title: "Booking Error",
          description: "There was a problem with your booking. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBooking();
  }, [currentQuote, loadQuoteFromLocalStorage, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Loading your booking details...</h3>
        </div>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="max-w-3xl mx-auto border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-700">Booking Error</CardTitle>
            <CardDescription className="text-red-600">
              There was a problem with your booking
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              We encountered an issue while processing your booking. Please contact our support
              team for assistance.
            </p>
            <Button variant="default" onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-3xl mx-auto border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>
            Your booking has been successfully processed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-sm text-gray-500">Booking Reference</p>
            <p className="text-xl font-bold">{bookingReference}</p>
            <p className="text-sm text-gray-500 mt-1">
              We've sent a confirmation to your email
            </p>
          </div>
          
          {bookingDetails && (
            <>
              <div className="space-y-4">
                <h3 className="font-medium">Booking Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Pickup Location</p>
                        <p className="text-sm text-gray-600">{bookingDetails.pickupAddress}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Delivery Location</p>
                        <p className="text-sm text-gray-600">{bookingDetails.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Truck className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Van Size</p>
                        <p className="text-sm text-gray-600 capitalize">{bookingDetails.vanSize}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Moving Date</p>
                        <p className="text-sm text-gray-600">
                          {bookingDetails.moveDate ? 
                            (bookingDetails.moveDate instanceof Date ? 
                              bookingDetails.moveDate.toLocaleDateString() : 
                              new Date(bookingDetails.moveDate).toLocaleDateString()) 
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Estimated Time</p>
                        <p className="text-sm text-gray-600">
                          {bookingDetails.estimatedTime || 
                          (bookingDetails.distance ? `${Math.ceil(bookingDetails.distance / 30)} hours` : 'Not specified')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="font-medium">Payment Summary</h3>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  {bookingDetails.breakdown && bookingDetails.breakdown.map((item: string, index: number) => (
                    <div key={index} className="flex justify-between py-1">
                      <span className="text-sm">{item.split(':')[0]}</span>
                      <span className="text-sm font-medium">{item.split(':')[1]}</span>
                    </div>
                  ))}
                  
                  {!bookingDetails.breakdown && (
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Total Payment</span>
                      <span className="text-sm font-medium">
                        {formatPrice(bookingDetails.totalWithVAT || 
                                    bookingDetails.finalPrice || 
                                    bookingDetails.totalPrice || 0)}
                      </span>
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between pt-1">
                    <span className="font-medium">Total Paid</span>
                    <span className="font-bold text-green-700">
                      {formatPrice(bookingDetails.totalWithVAT || 
                                  bookingDetails.finalPrice || 
                                  bookingDetails.totalPrice || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">What's Next?</h3>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">We'll contact you to confirm your booking details</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">A driver will be assigned to your job</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">You'll receive driver details and updates via email</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4 pt-2">
          <Button variant="default" onClick={() => setLocation("/")}>
            Return to Home
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print Receipt
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}