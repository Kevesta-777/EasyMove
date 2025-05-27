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
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import PayPalButton from "../components/payment/PayPalButton";

// Enum for payment states
enum PaymentStatus {
  LOADING = "loading",
  READY = "ready",
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error",
}

export default function PayPalCheckout() {
  const { toast } = useToast();
  const [, setLocation ] = useLocation();
  const [quoteDetails, setQuoteDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.LOADING,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Warm up the PayPal connection right on component mount
  useEffect(() => {
    const warmupPayPal = async () => {
      try {
        const response = await fetch("/paypal/setup");
        if (response.ok) {
          console.log("PayPal connection warmed up");
        }
      } catch (error) {
        console.error("Error warming up PayPal:", error);
      }
    };

    warmupPayPal();
  }, []);

  useEffect(() => {
    // Load quote from localStorage
    try {
      const savedQuote = localStorage.getItem("savedQuote");

      if (savedQuote) {
        const quote = JSON.parse(savedQuote);
        console.log("Quote being used for PayPal checkout:", quote);
        setQuoteDetails(quote);
        setPaymentStatus(PaymentStatus.READY);
      } else {
        toast({
          title: "No quote found",
          description: "Please generate a quote first",
          variant: "destructive",
        });
        setPaymentStatus(PaymentStatus.ERROR);
        setErrorMessage(
          "No quote details found. Please generate a quote first.",
        );
      }
    } catch (error) {
      console.error("Error loading quote:", error);
      toast({
        title: "Error loading quote",
        description: "Please try again",
        variant: "destructive",
      });
      setPaymentStatus(PaymentStatus.ERROR);
      setErrorMessage("Error loading quote details. Please try again.");
    }
  }, [toast]);

  // Handle PayPal payment success
  const handlePaymentSuccess = (data: any) => {
    console.log("Payment successful:", data);
    setSuccessData(data);
    setPaymentStatus(PaymentStatus.SUCCESS);

    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed",
      variant: "default",
    });

    // Save booking details to localStorage
    try {
      const bookingDetails = {
        ...quoteDetails,
        paymentInfo: {
          method: "paypal",
          transactionId: data.id || data.orderId,
          date: new Date().toISOString(),
          amount: quoteDetails.totalPrice,
        },
        status: "confirmed",
      };

      localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
    } catch (error) {
      console.error("Error saving booking details:", error);
    }
  };

  // Handle PayPal payment error
  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    setPaymentStatus(PaymentStatus.ERROR);
    setErrorMessage(
      typeof error === "string" ? error : "Payment failed. Please try again.",
    );

    toast({
      title: "Payment Failed",
      description:
        typeof error === "string"
          ? error
          : "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  // Format the price as a string without currency symbol
  const formattedPrice =
    typeof quoteDetails?.platformFee === "number"
      ? quoteDetails.platformFee.toFixed(2)
      : quoteDetails?.platformFee?.toString().replace(/[^0-9.]/g, "") || "0";

  // Render based on payment status
  const renderPaymentContent = () => {
    switch (paymentStatus) {
      case PaymentStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-gray-600">
              Loading payment options...
            </p>
          </div>
        );

      case PaymentStatus.READY:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <SiPaypal className="h-5 w-5 text-[#003087] mr-2" />
                <h3 className="font-medium">Pay with PayPal</h3>
              </div>
              <p className="text-sm text-gray-600">
                Click the PayPal button below to securely complete your payment.
                You can use your PayPal account or pay with a credit/debit card.
              </p>
            </div>

            <div className="flex justify-between items-center text-xl font-bold mb-6">
              <span>Total</span>
              <span>{`£${quoteDetails?.platformFee}`}</span>
            </div>

            <div className="p-4 border rounded-md flex justify-center items-center">
              <div className="max-w-[300px] w-full">
                <PayPalButton
                  amount={formattedPrice}
                  currency="GBP"
                  intent="CAPTURE"
                />
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-2">
              By proceeding with payment, you agree to our terms and conditions
            </p>
          </div>
        );

      case PaymentStatus.SUCCESS:
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-50 border border-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Payment Successful!
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Your booking has been confirmed and you will receive a
              confirmation email shortly.
            </p>

            {successData && (
              <div className="bg-gray-50 p-4 rounded-md w-full max-w-md text-sm mb-6">
                <p className="mb-2">
                  <span className="font-medium">Transaction ID:</span>{" "}
                  {successData.id || successData.orderId}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date().toLocaleString()}
                </p>
              </div>
            )}

            <Button onClick={() => setLocation("/bookings")}>
              View My Bookings
            </Button>
          </div>
        );

      case PaymentStatus.ERROR:
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-50 border border-red-100 rounded-full p-3 mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Payment Failed
            </h2>
            <p className="text-center text-gray-600 mb-6">
              {errorMessage ||
                "There was an issue processing your payment. Please try again."}
            </p>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/checkout")}
              >
                Back to Checkout
              </Button>
              <Button onClick={() => setPaymentStatus(PaymentStatus.READY)}>
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {paymentStatus !== PaymentStatus.SUCCESS && (
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/checkout")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Checkout
        </Button>
      )}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {paymentStatus === PaymentStatus.SUCCESS
                ? "Payment Complete"
                : "PayPal Checkout"}
            </CardTitle>
            {paymentStatus !== PaymentStatus.SUCCESS &&
              paymentStatus !== PaymentStatus.ERROR && (
                <CardDescription>
                  Complete your payment securely through PayPal
                </CardDescription>
              )}
          </CardHeader>
          <CardContent>{renderPaymentContent()}</CardContent>

          {paymentStatus === PaymentStatus.SUCCESS && (
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => setLocation("/")}>
                Return to Home
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
