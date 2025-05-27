import React from "react";
import PriceCalculator from '../components/calculator/PriceCalculator';

const CalculatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Man & Van Price Calculator
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Get an accurate quote for your move with our comprehensive pricing
          tool
        </p>
        <div className="max-w-5xl mx-auto"> <PriceCalculator /> </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
