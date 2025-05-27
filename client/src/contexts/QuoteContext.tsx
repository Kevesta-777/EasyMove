import { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of a quote
export interface Quote {
  pickupAddress?: string;
  deliveryAddress?: string;
  vanSize?: string;
  distance?: number;
  duration?: number;
  estimatedTime?: string;
  moveDate?: Date | string;
  totalPrice?: number;
  totalWithVAT?: number;
  finalPrice?: number;
  originalPrice?: number;
  breakdown?: string[];
  currency?: string;
  driverShare?: number;
  platformFee?: number;
  includesVAT?: boolean;
  vatAmount?: number;
  priceString?: string;
  explanation?: string;
  [key: string]: any; // Allow for additional dynamic fields
}

// Define our QuoteContext interface
interface QuoteContextType {
  currentQuote: Quote | null;
  setQuote: (quote: Quote) => void;
  clearQuote: () => void;
  saveQuoteToLocalStorage: () => void;
  loadQuoteFromLocalStorage: () => boolean;
}

// Create the context with a default value
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// Provider component that wraps app and makes quote context available
export function QuoteProvider({ children }: { children: ReactNode }) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  // Set a new quote
  const setQuote = (quote: Quote) => {
    console.log("Setting quote:", quote);
    setCurrentQuote(quote);
    // Auto-save to localStorage when a quote is set
    localStorage.setItem("savedQuote", JSON.stringify(quote));
  };

  // Clear the current quote
  const clearQuote = () => {
    setCurrentQuote(null);
    localStorage.removeItem("savedQuote");
  };

  // Save the current quote to localStorage
  const saveQuoteToLocalStorage = () => {
    if (currentQuote) {
      localStorage.setItem("savedQuote", JSON.stringify(currentQuote));
    }
  };

  // Load the quote from localStorage
  const loadQuoteFromLocalStorage = (): boolean => {
    try {
      const savedQuote = localStorage.getItem("savedQuote");
      if (savedQuote) {
        const parsedQuote = JSON.parse(savedQuote);
        console.log("parsedQuote", parsedQuote);
        setCurrentQuote(parsedQuote);
        return true;
      }
    } catch (error) {
      console.error("Error loading quote from localStorage:", error);
    }
    return false;
  };

  const value = {
    currentQuote,
    setQuote,
    clearQuote,
    saveQuoteToLocalStorage,
    loadQuoteFromLocalStorage,
  };

  return (
    <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
  );
}

// Hook for easy context use in components
export function useQuote(): QuoteContextType {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    console.warn("useQuote must be used within a QuoteProvider");
    return {
      currentQuote: null,
      setQuote: () => {},
      clearQuote: () => {},
      saveQuoteToLocalStorage: () => {},
      loadQuoteFromLocalStorage: () => false,
    };
  }
  return context;
}
