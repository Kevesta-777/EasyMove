import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import DetailedQuoteForm from '@/components/quote/DetailedQuoteForm';
import { QuoteResult } from '@/lib/utils/quote-calculator';
import { VanSize } from '@shared/pricing-rules';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DetailedQuotePage() {
  const [, setLocation] = useLocation();
  // State to store loaded data from localStorage
  const [initialData, setInitialData] = useState<{
    pickupAddress?: string;
    deliveryAddress?: string;
    vanSize?: VanSize;
    moveDate?: Date;
  }>({});
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  useEffect(() => {
    // Try to get stored quote details from localStorage
    try {
      const storedQuoteDetails = localStorage.getItem('quoteDetails');
      if (storedQuoteDetails) {
        const parsedDetails = JSON.parse(storedQuoteDetails);
        
        // Convert moveDate string to Date object if it exists
        let moveDate = undefined;
        if (parsedDetails.moveDate) {
          try {
            moveDate = new Date(parsedDetails.moveDate);
          } catch (e) {
            console.error('Failed to parse move date:', e);
          }
        }
        
        setInitialData({
          pickupAddress: parsedDetails.pickupAddress,
          deliveryAddress: parsedDetails.deliveryAddress,
          vanSize: parsedDetails.vanSize,
          moveDate
        });
      }
    } catch (error) {
      console.error('Error loading stored quote details:', error);
    }
  }, []);

  // Handle when a quote is generated
  const handleQuoteGenerated = (quote: QuoteResult) => {
    setQuoteResult(quote);
    // Optionally scroll to the result
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Detailed Quote</h1>
        <p className="text-gray-600 mb-6">
          Add your moving items to get an accurate quote based on what you need to move.
        </p>
        
        {quoteResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h2 className="text-xl font-bold text-green-800">Quote Generated</h2>
            <p className="text-green-700">
              Your detailed quote of {quoteResult.priceString} has been calculated.
              You can proceed to booking or modify your items below.
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => {
                  // Save the quote to localStorage for checkout
                  localStorage.setItem('savedQuote', JSON.stringify(quoteResult));
                  // Navigate to checkout
                  setLocation('/checkout');
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <DetailedQuoteForm 
        initialPickupAddress={initialData.pickupAddress}
        initialDeliveryAddress={initialData.deliveryAddress}
        initialVanSize={initialData.vanSize}
        initialMoveDate={initialData.moveDate}
        onQuoteGenerated={handleQuoteGenerated}
      />
    </div>
  );
}