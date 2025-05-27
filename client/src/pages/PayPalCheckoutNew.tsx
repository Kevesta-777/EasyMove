import { useState, useEffect, useRef } from 'react';
import { useQuote } from '../contexts/QuoteContext';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { apiRequest } from '../lib/queryClient';

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalCheckoutNew() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { currentQuote, loadQuoteFromLocalStorage } = useQuote();
  const { toast } = useToast();
  const [customerEmail, setCustomerEmail] = useState('');
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  // Try to load the quote from localStorage if not already in context
  useEffect(() => {
    if (!currentQuote) {
      const loaded = loadQuoteFromLocalStorage();
      if (!loaded) {
        toast({
          title: "No booking found",
          description: "Please get a quote first before proceeding to checkout",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }
    }
    
    if (!process.env.PAYPAL_CLIENT_ID) {
      console.warn('PayPal client ID is not configured');
    }

    // Load the PayPal SDK script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || 'sb'}`;
    script.async = true;
    
    script.onload = () => {
      setIsLoading(false);
      if (window.paypal && paypalButtonRef.current) {
        renderPayPalButton();
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load the PayPal SDK');
      toast({
        title: "PayPal Error",
        description: "Failed to load the PayPal payment system",
        variant: "destructive",
      });
      setIsLoading(false);
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Clean up the script when the component unmounts
      document.body.removeChild(script);
    };
  }, [currentQuote, loadQuoteFromLocalStorage, setLocation, toast]);

  // Render the PayPal button once the SDK is loaded
  const renderPayPalButton = () => {
    if (!window.paypal || !paypalButtonRef.current || !currentQuote) return;
    
    // Clear any existing buttons
    paypalButtonRef.current.innerHTML = '';
    
    // Calculate the final price and deposit amount
    const finalPrice = currentQuote.totalWithVAT || 
                      currentQuote.finalPrice || 
                      currentQuote.originalPrice || 
                      Math.ceil((currentQuote.totalPrice) * 1.2);
                       
    // Calculate deposit (25%)
    const depositAmount = Math.ceil(finalPrice * 0.25);
    const remainingAmount = finalPrice - depositAmount;
    
    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        },
        createOrder: async () => {
          setIsProcessing(true);
          
          // Validate email if provided
          if (customerEmail && !customerEmail.includes('@')) {
            toast({
              title: "Invalid Email",
              description: "Please enter a valid email address for your receipt.",
              variant: "destructive",
            });
            setIsProcessing(false);
            throw new Error('Invalid email format');
          }
          
          try {
            // Create an order on the server
            const response = await apiRequest({
              method: "POST",
              url: "/api/paypal/order",
              data: {
                intent: "CAPTURE",
                amount: depositAmount.toString(),
                currency: "GBP",
                bookingDetails: {
                  ...currentQuote,
                  pickup: currentQuote.pickupAddress,
                  delivery: currentQuote.deliveryAddress,
                  vanSize: currentQuote.vanSize,
                  moveDate: currentQuote.moveDate,
                  totalPrice: finalPrice,
                  driverShare: remainingAmount,
                  platformFee: depositAmount,
                  customerEmail: customerEmail || undefined
                }
              }
            });
            
            // Return the order ID
            return response.id;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            toast({
              title: "Payment Error",
              description: "Failed to create PayPal order",
              variant: "destructive",
            });
            setIsProcessing(false);
            throw error;
          }
        },
        onApprove: async (data: any, actions: any) => {
          try {
            // Capture the funds from the transaction
            const details = await apiRequest({
              method: "POST",
              url: `/api/paypal/order/${data.orderID}/capture`,
              data: {}
            });
            
            // Show a success message
            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed!",
            });
            
            // Redirect to the confirmation page
            setLocation(`/booking-confirmation?success=true&order_id=${data.orderID}`);
            
            return details;
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            toast({
              title: "Payment Error",
              description: "Failed to complete the payment process",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          toast({
            title: "Payment Cancelled",
            description: "You have cancelled the payment process",
          });
          setIsProcessing(false);
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast({
            title: "Payment Error",
            description: "An error occurred during the payment process",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
      }).render(paypalButtonRef.current);
    } catch (error) {
      console.error('Failed to render PayPal button:', error);
      toast({
        title: "PayPal Error",
        description: "Failed to initialize PayPal checkout",
        variant: "destructive",
      });
    }
  };

  if (!currentQuote) {
    return null; // Will redirect in the useEffect
  }

  // Always use totalWithVAT (total including VAT) to ensure consistency across the entire checkout flow
  const finalPrice = currentQuote.totalWithVAT || 
                    currentQuote.finalPrice || 
                    currentQuote.originalPrice || 
                    Math.ceil((currentQuote.totalPrice) * 1.2);
                     
  // Calculate exact deposit (25%) and always round to whole pounds for consistency
  const depositAmount = Math.ceil(finalPrice * 0.25);
  const remainingAmount = finalPrice - depositAmount; // Ensure they add up exactly to finalPrice

  // Format price with currency symbol
  function formatPrice(price: number): string {
    return `£${price.toFixed(2)}`;
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your booking by paying the 25% deposit</p>
          <div className="mt-4">
            <p className="text-sm mb-2">Choose your payment method:</p>
            <div className="flex space-x-4">
              <button 
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                onClick={() => setLocation('/stripe-checkout')}
              >
                Pay with Card (Stripe)
              </button>
              <button 
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                onClick={() => setLocation('/paypal-checkout-new')}
              >
                Pay with PayPal
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>PayPal Checkout</CardTitle>
                <CardDescription>
                  Pay securely with PayPal - only 25% deposit required today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label htmlFor="customerEmail" className="block text-sm font-medium mb-1">Email (for receipt)</label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-2">Loading PayPal...</span>
                    </div>
                  ) : (
                    <div ref={paypalButtonRef} id="paypal-button-container"></div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-2">Processing payment...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Service Details</h3>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    <p>From: {currentQuote.pickupAddress}</p>
                    <p>To: {currentQuote.deliveryAddress}</p>
                    <p>Van Size: {currentQuote.vanSize}</p>
                    <p>Date: {currentQuote.moveDate ? 
                        (currentQuote.moveDate instanceof Date ? 
                          currentQuote.moveDate.toLocaleDateString() : 
                          new Date(currentQuote.moveDate).toLocaleDateString())
                        : 'Not specified'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium">Price Breakdown</h3>
                  <div className="text-sm space-y-1 mt-2">
                    {/* Display each breakdown item */}
                    {currentQuote.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.split(':')[0]}</span>
                        <span>{item.split(':')[1]}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between font-medium pt-2">
                      <span>Total Price</span>
                      <span>{formatPrice(finalPrice)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium">Payment Schedule</h3>
                  <div className="text-sm space-y-1 mt-2">
                    <div className="flex justify-between font-medium text-primary">
                      <span>Deposit (25%)</span>
                      <span>{formatPrice(depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due on delivery (75%)</span>
                      <span>{formatPrice(remainingAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
