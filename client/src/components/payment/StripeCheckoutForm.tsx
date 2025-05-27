import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripeCheckoutFormProps {
  amount: number;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export default function StripeCheckoutForm({ 
  amount, 
  onSuccess,
  onError
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check for 'payment_intent_client_secret' from URL
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // If no client secret, return early
    if (!clientSecret) {
      return;
    }

    // Retrieve the payment intent with the client secret
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          setPaymentStatus('success');
          if (onSuccess) onSuccess(paymentIntent.id);
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          setPaymentStatus('processing');
          break;
        case 'requires_payment_method':
          setMessage('Please provide your payment details.');
          break;
        default:
          setMessage('Something went wrong.');
          setPaymentStatus('error');
          if (onError) onError('Payment status unknown');
          break;
      }
    });
  }, [stripe, onSuccess, onError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect to the same page to handle status updating
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // This point will only be reached if there's an immediate error
        // Otherwise users are redirected to the return_url
        setMessage(error.message || 'An unexpected error occurred');
        setPaymentStatus('error');
        
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed",
          variant: "destructive",
        });
        
        if (onError) onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Handle successful payment without redirect
        setMessage('Payment succeeded!');
        setPaymentStatus('success');
        
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed",
          variant: "default",
        });
        
        if (onSuccess) onSuccess(paymentIntent.id);
      }
    } catch (e: any) {
      setMessage(e.message || 'An unexpected error occurred');
      setPaymentStatus('error');
      
      toast({
        title: "Payment Error",
        description: e.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      if (onError) onError(e.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Payment status message */}
      {message && paymentStatus !== 'idle' && (
        <div className={`mb-4 rounded-md p-4 ${
          paymentStatus === 'success' 
          ? 'bg-green-50 border border-green-200' 
          : paymentStatus === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {paymentStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : paymentStatus === 'error' ? (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            ) : (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            )}
            <span className={`text-sm ${
              paymentStatus === 'success' 
              ? 'text-green-700' 
              : paymentStatus === 'error'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}>{message}</span>
          </div>
        </div>
      )}

      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="mb-6">
          <PaymentElement id="payment-element" />
        </div>
        
        <Button
          id="submit"
          type="submit"
          className="w-full"
          disabled={isLoading || !stripe || !elements || paymentStatus === 'success'}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${(amount || 0).toFixed(2)}`
          )}
        </Button>
      </form>
    </div>
  );
}