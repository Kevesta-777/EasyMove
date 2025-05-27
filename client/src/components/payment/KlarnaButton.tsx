import React, { useState } from 'react';

interface KlarnaButtonProps {
  amount: string;
  currency: string;
}

export default function KlarnaButton({ amount, currency }: KlarnaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleKlarnaPayment = async () => {
    try {
      setIsLoading(true);
      console.log('Initiating Klarna payment for:', { amount, currency });
      
      const response = await fetch('/api/klarna/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          currency,
          returnUrl: window.location.origin + '/payment-success',
          cancelUrl: window.location.origin + '/payment-cancelled',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create Klarna session: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Klarna session created:', data);
      
      // Important: Use window.location.assign for proper redirection
      // This fixes the frame/location issue
      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
      } else {
        throw new Error('No redirect URL received from Klarna');
      }
    } catch (error) {
      console.error('Klarna payment error:', error);
      setIsLoading(false);
      window.dispatchEvent(new CustomEvent('payment-error', { 
        detail: { 
          provider: 'klarna',
          message: 'Failed to process Klarna payment', 
          error 
        } 
      }));
    }
  };

  return (
    <div className="klarna-button-container">
      <button
        className={`w-full h-12 ${
          isLoading 
            ? 'bg-[#8f8f8f]' 
            : isHovered 
              ? 'bg-[#0a0a0a]' 
              : 'bg-[#000000]'
        } text-white rounded-md flex items-center justify-center cursor-pointer transition-colors duration-200`}
        style={{ fontSize: '16px', fontWeight: 'bold' }}
        onClick={handleKlarnaPayment}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <>
            <span style={{ marginRight: '8px' }}>Pay with</span>
            <span style={{ 
              color: '#ffb3c7', 
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0px'
            }}>
              Klarna
            </span>
          </>
        )}
      </button>
      <div className="text-xs text-center mt-2 text-gray-500">
        Pay later with Klarna
      </div>
    </div>
  );
}