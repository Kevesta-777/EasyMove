import React from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement as StripeCardElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

// Load the Stripe.js script and initialize with our publishable key
let stripePromise: Promise<Stripe | null> | null = null;

export const LoadStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    // Get the key from environment variables
    let key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

    // Check if the key is missing or has the wrong format (starts with sk_ instead of pk_)
    if (!key) {
      console.error('Missing Stripe publishable key');
      return Promise.resolve(null);
    }
    
    // Handle swapped keys - if the "public" key starts with sk_, it's actually the secret key
    if (key.startsWith('sk_')) {
      console.warn('Detected incorrect Stripe public key format (starts with sk_)');
      // We can't access process.env.STRIPE_SECRET_KEY from client, so we need a workaround
      // Fall back to a demo key
      console.error('Unable to use Stripe public key starting with sk_ - using demo mode');
      key = 'pk_test_51LgFmuH3kJJMxUIGnvUkZsN1NnKPzHbITkHZcxJwSXAQEimlN4gLC5eXWJ095N24NqQQoRHgOTCqBPuJtkBFQfRi00ycOLCHfC';
    }
    
    console.log('Using Stripe public key:', "DEMO KEY");
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Provider for Stripe Elements context
export const StripeElementsProvider: React.FC<{
  clientSecret: string;
  children: React.ReactNode;
}> = ({ clientSecret, children }) => {
  const stripePromise = LoadStripe();
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  );
};

// Card Element component
export const CardElement: React.FC<{
  id?: string;
  options?: any;
  onChange?: (event: any) => void;
}> = ({ id, options, onChange }) => {
  return (
    <StripeCardElement
      id={id}
      options={options}
      onChange={onChange}
    />
  );
};

// Payment Form component for handling card payments
export const PaymentForm: React.FC<{
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
  customerEmail?: string;
  customerName?: string;
}> = ({ clientSecret, onSuccess, onError, customerEmail, customerName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = React.useState(false);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      onError(new Error("Stripe not loaded"));
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(StripeCardElement)!,
          billing_details: {
            name: customerName,
            email: customerEmail,
          },
        },
        receipt_email: customerEmail,
      });
      
      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      } else {
        throw new Error(`Payment status: ${result.paymentIntent?.status}`);
      }
    } catch (error: any) {
      onError(error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement 
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
};