import { useState, useEffect } from "react";
import { useQuote } from "@/contexts/QuoteContext";
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
import {
  LoadStripe,
  StripeElementsProvider,
  CardElement,
} from "@/components/payment/StripeElements";
import { useStripe, useElements } from "@stripe/react-stripe-js";

// Main checkout component that handles the embedded Stripe payment form
export default function EmbeddedStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { currentQuote, loadQuoteFromLocalStorage } = useQuote();
  const { toast } = useToast();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [quotePrice, setQuotePrice] = useState(0);
  const stripe = useStripe();
  const elements = useElements();
  // const stripe = null;
  // const elements = null;
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
      const price = quote?.platformFee ? quote.platformFee : 0;
      quote.totalWithVAT ||
        quote.finalPrice ||
        quote.originalPrice ||
        (quote.totalPrice ? Math.ceil(quote.totalPrice * 1.2) : 0);

      console.log("Final price for payment intent:", price);
      setQuotePrice(price);
      return true;
    };

    setupQuote();
  }, [currentQuote, loadQuoteFromLocalStorage, toast, setLocation]);

  // Create payment intent as soon as we have the component mounted
  useEffect(() => {
    // If no quote is stored, we'll handle this in the first useEffect
    if (currentQuote && quotePrice > 0 && !paymentIntent) {
      console.log(
        "Auto-creating payment intent on initial mount for faster checkout",
      );
      setTimeout(() => {
        createPaymentIntent();
      }, 100); // Small delay to ensure everything is loaded
    }
  }, []); // Empty dependency array means this runs once on mount

  // Also create payment intent when price changes
  useEffect(() => {
    if (quotePrice > 0 && !paymentIntent) {
      console.log("Creating payment intent after price change");
      createPaymentIntent();
    }
  }, [quotePrice, paymentIntent]);

  // Create a PaymentIntent to power the embedded checkout
  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);

      // If no quote is loaded, don't proceed
      if (!currentQuote) {
        console.error("Cannot create payment intent: No quote available");
        return;
      }

      // If price is zero or too low, don't proceed
      if (!quotePrice || quotePrice < 0.5) {
        console.error(
          `Cannot create payment intent: Invalid price (${quotePrice})`,
        );
        toast({
          title: "Invalid Price",
          description:
            "The quote price is invalid. Please go back and try again.",
          variant: "destructive",
        });
        return;
      }

      const paymentData = {
        amount: parseFloat(
          currentQuote.breakdown
            ?.find((item) => item.split(":")[0] === "Platform payment")
            ?.split(":")[1]
            ?.replace("£", "") || quotePrice.toString(),
        ),
        bookingDetails: {
          pickupAddress: currentQuote.pickupAddress,
          deliveryAddress: currentQuote.deliveryAddress,
          vanSize: currentQuote.vanSize,
          moveDate: currentQuote.moveDate,
          customerEmail: customerEmail || undefined,
        },
      };

      console.log("Creating payment intent with data:", paymentData);

      toast({
        title: "Setting up payment",
        description: "Preparing the payment form...",
      });

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      // Check for HTTP errors first
      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Payment intent response:", data);

      if (data.clientSecret) {
        console.log("Payment intent created successfully!");
        setPaymentIntent(data.clientSecret);
      } else if (data.error) {
        throw new Error(`API error: ${data.error}`);
      } else {
        throw new Error("No client secret received from API");
      }
    } catch (error: any) {
      console.error("Payment setup error:", error);
      toast({
        title: "Payment Setup Error",
        description:
          error.message ||
          "Could not set up the payment form. Please try again.",
        variant: "destructive",
      });

      // Show a more detailed error toast with potential solutions
      setTimeout(() => {
        toast({
          title: "Troubleshooting",
          description:
            "Please try refreshing the page or go back to get a new quote.",
        });
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the payment form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentIntent || isPaying || !customerEmail || !customerName) {
      if (!customerEmail) {
        toast({
          title: "Email Required",
          description: "Please enter your email address for the receipt",
          variant: "destructive",
        });
      }
      if (!customerName) {
        toast({
          title: "Name Required",
          description: "Please enter your name for the booking",
          variant: "destructive",
        });
      }
      return;
    }

    setIsPaying(true);

    try {
      console.log("Starting payment confirmation with Stripe...");

      // Get the card element from the Stripe elements instance - use `any` to bypass type issues
      if (!elements) return;

      const cardElement = elements.getElement("card");
      console.log(cardElement);
      if (!cardElement) {
        console.error("Card element not found in Stripe Elements");
        throw new Error(
          "Card element not found. Please refresh the page and try again.",
        );
      }

      // First create a payment method - this is more reliable than direct confirmation
      console.log("Creating payment method with card element...");
      const { paymentMethod, error: pmError } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: customerName || "Customer",
            email: customerEmail || undefined,
          },
        });

      if (pmError) {
        console.error("Error creating payment method:", pmError);
        throw new Error(
          pmError.message ||
            "Card validation failed. Please check your card details.",
        );
      }

      console.log("Payment method created:", paymentMethod.id);
      console.log("Confirming card payment with client secret...");

      // Use the payment method ID to confirm payment
      const result = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: paymentMethod.id,
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });

        // Navigate to the booking confirmation page
        setTimeout(() => {
          setLocation(
            `/booking-confirmation?payment_intent=${result.paymentIntent?.id}`,
          );
        }, 1000);
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong with your payment",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  // Show loading state while preparing the payment
  if (isLoading && !paymentIntent) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Preparing Secure Payment</h3>
          <p className="text-muted-foreground">Setting up payment form...</p>
        </div>
      </div>
    );
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
            Enter your card details to complete your booking
          </p>
          <div className="mt-4">
            <p className="text-sm mb-2">Choose your payment method:</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                onClick={() => {}} // Current page
              >
                Pay with Card (Recommended)
              </button>
              <button
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                onClick={() => setLocation("/paypal-checkout")}
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
                <CardDescription>Enter your card details below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-medium mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div>
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
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="card-element"
                        className="block text-sm font-medium mb-1"
                      >
                        Card Details
                      </label>
                      <div className="p-3 border border-gray-300 rounded-md">
                        {paymentIntent ? (
                          <CardElement
                            id="card-element"
                            options={{
                              style: {
                                base: {
                                  fontSize: "16px",
                                  color: "#424770",
                                  "::placeholder": {
                                    color: "#aab7c4",
                                  },
                                },
                                invalid: {
                                  color: "#9e2146",
                                },
                              },
                            }}
                          />
                        ) : (
                          <div className="py-2">
                            <div className="animate-pulse flex space-y-2 flex-col">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Loading payment form...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 my-4 p-3 bg-blue-50 rounded-md">
                    <p>• Your payment is processed securely by Stripe</p>
                    <p>• No card details are stored on our servers</p>
                    <p>
                      • Your booking will be confirmed immediately after payment
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    disabled={!paymentIntent || isPaying}
                    size="lg"
                  >
                    {isPaying ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                        Processing Payment
                      </>
                    ) : (
                      `Pay ${currentQuote.breakdown?.find(
                        (item) => item.split(":")[0] === "Platform payment",
                      )}`
                    )}
                  </Button>
                </form>
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
                      currentQuote.breakdown.map((item, index) => {
                        if (item.split(":")[0] === "Fuel") {
                          return null;
                        }
                        return (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {item.split(":")[0]}
                            </span>
                            <span>{item.split(":")[1]}</span>
                          </div>
                        );
                      })}

                    <div className="flex justify-between font-medium pt-2">
                      <span>Total Price (inc. VAT)</span>

                      <span>
                        {currentQuote.breakdown
                          ?.find((item) => item.split(":")[0] === "Total")
                          ?.split(":")[1] || formatPrice(quotePrice)}
                      </span>
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
