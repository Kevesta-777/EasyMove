import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from '@/components/payment/PayPalButton';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';

// Initialize Stripe with the public key
// Always make sure we're using a public key (starts with pk_)
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo';
console.log("Using Stripe public key:", stripeKey.startsWith('pk_') ? 
  (stripeKey === 'pk_test_demo' ? 'DEMO KEY' : stripeKey.substring(0, 7) + '...') : 
  'INVALID KEY FORMAT - MUST START WITH pk_');

// Only initialize Stripe if we have a valid public key format
const stripePromise = stripeKey.startsWith('pk_') ? 
  loadStripe(stripeKey) : 
  Promise.resolve(null);

export default function PaymentTester() {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [amount, setAmount] = useState<string>('24.99');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleCreatePaymentIntent = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bookingDetails: {
            service: 'Man and Van Service',
            pickup: '123 London Road',
            delivery: '456 Manchester Avenue'
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating payment intent: ${errorText}`);
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      toast({
        title: "Ready for Payment",
        description: "Payment intent created successfully!",
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Setup Failed",
        description: error instanceof Error ? error.message : "Failed to set up payment",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Testing</CardTitle>
          <CardDescription>Test Stripe and PayPal payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </div>
            
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'paypal')}>
              <div className="flex items-center space-x-2 border p-3 rounded cursor-pointer">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="cursor-pointer">Pay with Stripe</Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded cursor-pointer">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="cursor-pointer">Pay with PayPal</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          {paymentMethod === 'stripe' && !clientSecret && (
            <Button 
              onClick={handleCreatePaymentIntent} 
              disabled={processing}
              className="w-full mb-4"
            >
              {processing ? 'Setting up payment...' : 'Set up Stripe Payment'}
            </Button>
          )}
          
          {paymentMethod === 'stripe' && clientSecret && (
            <div className="w-full">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm amount={parseFloat(amount)} />
              </Elements>
            </div>
          )}
          
          {paymentMethod === 'paypal' && (
            <div className="w-full mt-4">
              <PayPalButton 
                amount={amount}
                currency="GBP"
                intent="CAPTURE"
              />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}