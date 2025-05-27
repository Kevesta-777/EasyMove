import { useState, useEffect } from "react";
import { useQuote } from "../contexts/QuoteContext";
import { useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";

// Simple loading component to show while redirecting
const LoadingRedirect = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
    <div className="text-center p-4">
      <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <h3 className="text-lg font-medium">Preparing Secure Payment</h3>
      <p className="text-muted-foreground">Connecting to Stripe...</p>
    </div>
  </div>
);

export default function StripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { currentQuote, loadQuoteFromLocalStorage } = useQuote();
  const { toast } = useToast();
  const [customerEmail, setCustomerEmail] = useState("");
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [quotePrice, setQuotePrice] = useState(0);

  // Helper function to format price
  function formatPrice(price: number): string {
    return `£${price.toFixed(2)}`;
  }

  // Load the quote if needed and extract the price
  useEffect(() => {
    const setupQuote = () => {
      if (!currentQuote) {
        const loaded = loadQuoteFromLocalStorage();
        console.log("Quote loaded from localStorage:", loaded);

        if (!loaded) {
          toast({
            title: "No booking found",
            description:
              "Please get a quote first before proceeding to checkout",
            variant: "destructive",
          });
          setLocation("/");
          return false;
        }
      }

      // Use the quote from context or fallback to an empty object with default values
      const quote = currentQuote || {
        totalWithVAT: 0,
        finalPrice: 0,
        originalPrice: 0,
        totalPrice: 0,
        platformFee: 0,
      };
      console.log("Quote being used for checkout:", quote);

      // Calculate the price - VAT inclusive
      const price = quote?.platformFee
        ? quote.platformFee
        : 0 ||
          quote.totalWithVAT ||
          quote.finalPrice ||
          quote.originalPrice ||
          (quote.totalPrice ? Math.ceil(quote.totalPrice * 1.2) : 0);

      console.log("Final price for payment intent:", currentQuote);
      setQuotePrice(price);
      return true;
    };

    setupQuote();
  }, [currentQuote, loadQuoteFromLocalStorage, toast, setLocation]);

  // Auto-initiate checkout flow
  useEffect(() => {
    // If we have a quote price and haven't started checkout yet
    if (quotePrice > 0 && !checkoutStarted) {
      setCheckoutStarted(true);

      const initiateCheckout = async () => {
        try {
          setIsLoading(true);

          // If no quote is loaded, don't proceed
          if (!currentQuote) return;

          const paymentData = {
            finalPrice: quotePrice,
            totalWithVAT: quotePrice,
            pickupAddress: currentQuote.pickupAddress,
            deliveryAddress: currentQuote.deliveryAddress,
            vanSize: currentQuote.vanSize,
            moveDate: currentQuote.moveDate,
            customerEmail: customerEmail || undefined,
          };

          // Quick toast to show what's happening
          toast({
            title: "Preparing Checkout",
            description: "Just a moment...",
          });

          const response = await fetch("/api/create-stripe-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
          });

          const data = await response.json();

          if (data.url) {
            // Redirect immediately to Stripe
            window.location.href = data.url;
          } else {
            throw new Error("No checkout URL received");
          }
        } catch (error) {
          console.error("Payment error:", error);
          toast({
            title: "Payment Setup Error",
            description: "Please try the payment button below.",
            variant: "destructive",
          });
          setIsLoading(false);
          setCheckoutStarted(false);
        }
      };

      // Short delay to ensure page has loaded
      const timer = setTimeout(initiateCheckout, 300);
      return () => clearTimeout(timer);
    }
  }, [quotePrice, checkoutStarted, currentQuote, customerEmail, toast]);

  // Manual checkout button handler
  const handleManualCheckout = async () => {
    if (isLoading || !currentQuote) return;

    try {
      setIsLoading(true);

      const paymentData = {
        finalPrice: quotePrice,
        totalWithVAT: quotePrice,
        pickupAddress: currentQuote.pickupAddress,
        deliveryAddress: currentQuote.deliveryAddress,
        vanSize: currentQuote.vanSize,
        moveDate: currentQuote.moveDate,
        customerEmail: customerEmail || undefined,
      };

      const response = await fetch("/api/create-stripe-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Payment button error:", err);
      toast({
        title: "Payment Error",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading overlay while redirecting
  if (isLoading && checkoutStarted) {
    return <LoadingRedirect />;
  }

  // If no quote is available, show nothing (will redirect in useEffect)
  if (!currentQuote) {
    return null;
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground">
            Complete your booking securely with Stripe
          </p>
          <div className="mt-4">
            <p className="text-sm mb-2">Choose your payment method:</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                onClick={() => {}} // Current page
              >
                Pay with Stripe (Recommended)
              </button>
              <button
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                onClick={() => setLocation("/paypal-checkout-new")}
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
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  You'll be redirected to Stripe's secure payment page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label
                    htmlFor="customerEmail"
                    className="block text-sm font-medium mb-1"
                  >
                    Email (for receipt)
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="text-sm text-gray-500 my-4 p-3 bg-blue-50 rounded-md">
                  <p>• You'll be redirected to Stripe's secure payment page</p>
                  <p>• All payment information is handled by Stripe</p>
                  <p>
                    • Your booking will be confirmed immediately after payment
                  </p>
                </div>

                <Button
                  onClick={handleManualCheckout}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                      Processing
                    </>
                  ) : (
                    `Pay ${formatPrice(quotePrice)}`
                  )}
                </Button>
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
                    <p>Distance: {currentQuote.distance} miles</p>
                    <p>
                      Date:{" "}
                      {currentQuote.moveDate
                        ? currentQuote.moveDate instanceof Date
                          ? currentQuote.moveDate.toLocaleDateString()
                          : new Date(currentQuote.moveDate).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium">Price Breakdown</h3>
                  <div className="text-sm space-y-1 mt-2">
                    {/* Display each breakdown item if available */}
                    {currentQuote.breakdown &&
                      currentQuote.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {item.split(":")[0]}
                          </span>
                          <span>{item.split(":")[1]}</span>
                        </div>
                      ))}

                    <div className="flex justify-between font-medium pt-2">
                      <span>Total Price (inc. VAT)</span>
                      <span>{formatPrice(quotePrice)}</span>
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
