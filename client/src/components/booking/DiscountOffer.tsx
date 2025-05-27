import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Gift, Calendar, ArrowRight } from 'lucide-react';

interface DiscountOfferProps {
  userId?: string;
  previousBookingCount?: number;
  onApply?: (discountCode: string, discountAmount: number) => void;
  onDismiss?: () => void;
}

export default function DiscountOffer({ 
  userId, 
  previousBookingCount = 0, 
  onApply, 
  onDismiss 
}: DiscountOfferProps) {
  const { toast } = useToast();
  const [discount, setDiscount] = useState<{code: string, amount: number} | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');

  useEffect(() => {
    // Determine if the user should get a discount offer
    const determineDiscount = () => {
      // Custom logic for different types of users
      if (previousBookingCount >= 3) {
        // Loyal customer (3+ bookings)
        return { code: 'LOYAL15', amount: 15 };
      } else if (previousBookingCount >= 1) {
        // Returning customer
        return { code: 'RETURN10', amount: 10 };
      } else {
        // First time discount
        return { code: 'WELCOME5', amount: 5 };
      }
    };

    // Calculate expiry date (30 days from now)
    const calculateExpiryDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toLocaleDateString('en-GB');
    };

    // Set discount based on user history
    const userDiscount = determineDiscount();
    setDiscount(userDiscount);
    setExpiryDate(calculateExpiryDate());

    // Show offer after a brief delay (so user notices it)
    const timer = setTimeout(() => {
      setShowOffer(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [previousBookingCount, userId]);

  const handleApplyDiscount = () => {
    if (discount) {
      // Apply the discount
      if (onApply) {
        onApply(discount.code, discount.amount);
      }

      // Show success message
      toast({
        title: "Discount Applied!",
        description: `${discount.amount}% discount will be applied to your next booking.`,
        variant: "default",
      });

      // Save the discount to local storage for this user
      try {
        const savedDiscounts = JSON.parse(localStorage.getItem('userDiscounts') || '{}');
        savedDiscounts[userId || 'guest'] = {
          code: discount.code,
          amount: discount.amount,
          expiry: expiryDate
        };
        localStorage.setItem('userDiscounts', JSON.stringify(savedDiscounts));
      } catch (error) {
        console.error('Error saving discount to local storage:', error);
      }

      // Hide the offer
      setShowOffer(false);
    }
  };

  const handleDismiss = () => {
    setShowOffer(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!showOffer || !discount) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 border-primary shadow-lg animate-in slide-in-from-bottom-5 duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Gift className="mr-2 h-5 w-5 text-primary" />
              Special Discount
            </CardTitle>
            <Badge variant="secondary" className="ml-2 py-1">
              {discount.amount}% OFF
            </Badge>
          </div>
          <CardDescription>
            {previousBookingCount > 0 
              ? 'Thanks for coming back!' 
              : 'Welcome to EasyMove!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="bg-muted rounded-md p-3 flex items-center mb-3">
            <Ticket className="h-5 w-5 mr-2 text-primary" />
            <div>
              <span className="font-medium">{discount.code}</span>
              <p className="text-xs text-muted-foreground">Use this code at checkout</p>
            </div>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Valid until {expiryDate}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleApplyDiscount} className="gap-1">
            Apply Now <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}