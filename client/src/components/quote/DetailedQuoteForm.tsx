import React, { useState } from 'react';
import DetailedItemsForm, { Item } from '@/components/quote/DetailedItemsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { calculateDetailedQuote, type QuoteResult } from '@/lib/utils/quote-calculator';
import { VanSize, FloorAccess, UrgencyLevel } from '@shared/pricing-rules';
import { formatPrice } from '@/lib/utils';

interface DetailedQuoteFormProps {
  initialPickupAddress?: string;
  initialDeliveryAddress?: string;
  initialVanSize?: VanSize;
  initialMoveDate?: Date;
  onQuoteGenerated?: (quote: QuoteResult) => void;
}

export default function DetailedQuoteForm({
  initialPickupAddress = '',
  initialDeliveryAddress = '',
  initialVanSize = 'medium',
  initialMoveDate,
  onQuoteGenerated
}: DetailedQuoteFormProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const { toast } = useToast();

  // Handle items submission from the detailed items form
  const handleItemsSubmit = async (newItems: Item[]) => {
    setItems(newItems);
    if (newItems.length === 0) {
      toast({
        title: "No items added",
        description: "Please add at least one item to generate a quote.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingQuote(true);
    try {
      // Gather item details for quote calculation
      const hasFragileItems = newItems.some(item => item.fragile);
      const hasSpecialHandling = newItems.some(item => item.specialHandling);
      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);

      // Determine if we need a larger van size based on item count
      let adjustedVanSize = initialVanSize;
      if (totalItems > 30 && initialVanSize === 'small') {
        adjustedVanSize = 'medium';
      } else if (totalItems > 50 && initialVanSize === 'medium') {
        adjustedVanSize = 'large';
      } else if (totalItems > 80 && initialVanSize === 'large') {
        adjustedVanSize = 'luton';
      }

      // Calculate additional helpers needed based on items
      let recommendedHelpers = 0;
      if (totalItems > 20) recommendedHelpers = 1;
      if (totalItems > 50) recommendedHelpers = 2;

      // Add weight to special handling items
      const hasHeavyItems = newItems.some(item => 
        (item.weight && parseFloat(item.weight) > 50) || 
        item.name.toLowerCase().includes('fridge') ||
        item.name.toLowerCase().includes('washing machine') ||
        item.name.toLowerCase().includes('sofa') ||
        item.name.toLowerCase().includes('wardrobe') ||
        item.name.toLowerCase().includes('piano')
      );

      // Call API for distance calculation first
      const distanceResponse = await apiRequest({
        method: 'POST',
        url: '/api/quotes/distance',
        data: {
          from: initialPickupAddress,
          to: initialDeliveryAddress
        }
      });

      // Then generate the detailed quote with all parameters
      const quoteResponse = await apiRequest({
        method: 'POST',
        url: '/api/quotes/calculate',
        data: {
          collectionAddress: initialPickupAddress,
          deliveryAddress: initialDeliveryAddress,
          moveDate: initialMoveDate || new Date(),
          vanSize: adjustedVanSize,
          helpers: recommendedHelpers,
          floorAccess: 'ground',
          urgency: 'standard',
          itemDetails: {
            totalItems,
            hasFragileItems,
            hasSpecialHandling,
            vanSizeAdjustment: adjustedVanSize !== initialVanSize ? 1 : 0
          },
          items: newItems
        }
      });

      // Process the quote result
      const result = quoteResponse as QuoteResult;
      setQuote(result);
      
      // If original van size was adjusted, explain why
      if (adjustedVanSize !== initialVanSize) {
        toast({
          title: "Van Size Upgraded",
          description: `Based on your ${totalItems} items, we've recommended a ${adjustedVanSize} van instead of ${initialVanSize}.`,
        });
      }

      // If helpers were added, explain why
      if (recommendedHelpers > 0) {
        toast({
          title: `${recommendedHelpers} Helper${recommendedHelpers > 1 ? 's' : ''} Added`,
          description: `Based on your ${totalItems} items, we've added ${recommendedHelpers} helper${recommendedHelpers > 1 ? 's' : ''} to assist with the move.`,
        });
      }

      // Notify parent component
      if (onQuoteGenerated) {
        onQuoteGenerated(result);
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Quote Generation Failed",
        description: "Could not generate an accurate quote. Please try again.",
        variant: "destructive"
      });
      
      // Fallback to client-side calculation for resilience
      if (initialPickupAddress && initialDeliveryAddress) {
        try {
          // Use a fallback distance estimate
          const fallbackDistance = 15; // Reasonable default
          const fallbackResult = calculateDetailedQuote({
            pickupAddress: initialPickupAddress,
            deliveryAddress: initialDeliveryAddress,
            distance: fallbackDistance,
            vanSize: initialVanSize,
            moveDate: initialMoveDate || new Date(),
            estimatedHours: Math.max(2, fallbackDistance / 30),
            helpers: 0,
            floorAccess: 'ground',
            liftAvailable: false,
            urgency: 'standard'
          });
          
          setQuote(fallbackResult);
          if (onQuoteGenerated) {
            onQuoteGenerated(fallbackResult);
          }
          
          toast({
            title: "Using Estimated Quote",
            description: "We're using an estimate as we couldn't calculate an exact quote.",
          });
        } catch (fallbackError) {
          console.error('Fallback quote failed:', fallbackError);
        }
      }
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  return (
    <div className="space-y-8">
      <DetailedItemsForm onSubmit={handleItemsSubmit} initialItems={items} />
      
      {quote && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Your Quote Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{quote.priceString}</p>
                <p className="text-sm text-gray-500">
                  {quote.distance ? `Based on ${quote.distance} miles distance` : ''}
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Price Breakdown:</h3>
                <ul className="space-y-1 text-sm">
                  {quote.breakdown.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.split(':')[0]}</span>
                      <span className="font-medium">{item.split(':')[1]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-primary">{quote.priceString}</span>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  className="w-full md:w-auto"
                  onClick={() => {
                    // Save the quote details to localStorage for checkout
                    localStorage.setItem('savedQuote', JSON.stringify({
                      ...quote,
                      items
                    }));
                    // Navigate to checkout
                    window.location.href = '/checkout';
                  }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}