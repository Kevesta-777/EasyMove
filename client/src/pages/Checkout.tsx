import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CreditCard, ArrowRight } from "lucide-react";
import { SiPaypal, SiStripe } from "react-icons/si";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quoteDetails, setQuoteDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load quote from localStorage
    try {
      const savedQuote = localStorage.getItem("savedQuote");
      console.log("Quote loaded from localStorage:", !!savedQuote);

      if (savedQuote) {
        const quote = JSON.parse(savedQuote);
        console.log("Quote being used for checkout:", quote);
        setQuoteDetails(quote);
      } else {
        toast({
          title: "No quote found",
          description: "Please generate a quote first",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading quote:", error);
      toast({
        title: "Error loading quote",
        description: "Please try again",
        variant: "destructive",
      });
    }

    setLoading(false);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-gray-600">Loading checkout details...</p>
      </div>
    );
  }

  if (!quoteDetails) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Error</CardTitle>
            <CardDescription>
              No quote details found. Please generate a quote first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Format the price as a string without currency symbol
  const formattedPrice =
    typeof quoteDetails.totalPrice === "number"
      ? quoteDetails.totalPrice.toFixed(2)
      : quoteDetails.totalPrice?.toString().replace(/[^0-9.]/g, "") || "0";

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6" onClick={() => setLocation("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>Review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">
                    Collection Address
                  </h3>
                  <p>{quoteDetails.pickupAddress}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">
                    Delivery Address
                  </h3>
                  <p>{quoteDetails.deliveryAddress}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Distance</h3>
                  <p>{quoteDetails.distance?.toFixed(1) || "0"} miles</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Van Size</h3>
                  <p className="capitalize">{quoteDetails.vanSize}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Estimated Time</h3>
                  <p>{quoteDetails.estimatedTime}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Move Date</h3>
                  <p>
                    {quoteDetails.moveDate
                      ? new Date(quoteDetails.moveDate).toLocaleDateString(
                          "en-GB",
                        )
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {quoteDetails.items && quoteDetails.items.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-500 mb-2">Items</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {quoteDetails.items.map((item: any, index: number) => (
                      <li key={index}>
                        {item.quantity}x {item.name}
                        {item.fragile && (
                          <span className="text-amber-600 ml-1">(Fragile)</span>
                        )}
                        {item.specialHandling && (
                          <span className="text-blue-600 ml-1">
                            (Special Handling)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Price Breakdown</h3>
                <ul className="space-y-1 text-sm">
                  {quoteDetails.breakdown?.map(
                    (item: string, index: number) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.split(":")[0]}</span>
                        <span>{item.split(":")[1]}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
              <CardDescription>Choose how you'd like to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-xl font-bold mb-6">
                <span>Total</span>
                <span>{quoteDetails.priceString || `£${formattedPrice}`}</span>
              </div>

              <div className="space-y-4">
                <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setLocation("/stripe-checkout")}
                      className="w-full py-6 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-md mr-4">
                          <SiStripe className="h-6 w-6 text-[#635BFF]" />
                        </div>
                        <span>Pay with Stripe</span>
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setLocation("/paypal-checkout")}
                      className="w-full py-6 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-md mr-4">
                          <SiPaypal className="h-6 w-6 text-[#003087]" />
                        </div>
                        <span>Pay with PayPal</span>
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setLocation("/embedded-checkout")}
                      className="w-full py-6 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-md mr-4">
                          <CreditCard className="h-6 w-6 text-gray-700" />
                        </div>
                        <span>Embedded Checkout</span>
                      </div>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setLocation("/quote")}>
                Modify Quote
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
