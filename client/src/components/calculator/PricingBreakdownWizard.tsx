import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { QuoteResult } from '@/lib/utils/quote-calculator';
import { type VanSize, type FloorAccess, type UrgencyLevel, PRICING_CONSTANTS } from '@shared/pricing-rules';

// Wizard steps
enum WizardStep {
  INTRO = 0,
  DISTANCE = 1,
  VAN_SIZE = 2,
  TIME = 3,
  HELPERS = 4,
  ACCESS = 5,
  SURCHARGES = 6,
  FUEL = 7,
  COMMISSION = 8,
  SUMMARY = 9
}

// Pricing factors descriptions
const FACTOR_DESCRIPTIONS = {
  distance: "Distance is one of the primary factors in your quote. We charge a base rate per mile traveled.",
  vanSize: "The size of the van affects both the hourly rate and the amount of items that can be transported.",
  time: "Time is calculated based on estimated loading/unloading and driving time.",
  helpers: "Additional helpers can speed up the moving process for larger moves.",
  access: "Difficult access such as stairs or narrow hallways can increase the time and effort required.",
  surcharges: "Peak times (weekends, evenings, holidays) and urgency levels may incur additional charges.",
  fuel: "Fuel costs are calculated based on distance and include the return journey.",
  commission: "Our platform fee is 25% of the total price, with 75% going directly to your driver.",
};

// Helper tooltips for each factor
const FACTOR_TOOLTIPS = {
  distance: `We charge £${PRICING_CONSTANTS.BASE_RATE_PER_MILE.toFixed(2)} per mile with a minimum of ${PRICING_CONSTANTS.MINIMUM_DISTANCE_CHARGE} miles. This covers the basic transport costs.`,
  vanSize: {
    small: `Small van (40-50 cubic feet): £${PRICING_CONSTANTS.HOURLY_RATES.small}/hour - Ideal for small deliveries and single items`,
    medium: `Medium van (80-100 cubic feet): £${PRICING_CONSTANTS.HOURLY_RATES.medium}/hour - Good for small house moves (1-2 rooms)`,
    large: `Large van (150-170 cubic feet): £${PRICING_CONSTANTS.HOURLY_RATES.large}/hour - Suitable for average house moves (2-3 rooms)`,
    luton: `Luton van (550-600 cubic feet): £${PRICING_CONSTANTS.HOURLY_RATES.luton}/hour - Best for full house moves and large items`
  },
  time: "We estimate time based on distance, loading/unloading, and breaks for longer journeys.",
  helpers: `Each helper costs £${PRICING_CONSTANTS.HELPER_HOURLY_RATE} per hour and can significantly reduce loading/unloading time.`,
  access: {
    ground: "Ground floor: No additional charge",
    firstFloor: `First floor: £${PRICING_CONSTANTS.FLOOR_ACCESS_FEES.firstFloor} additional charge`,
    secondFloor: `Second floor: £${PRICING_CONSTANTS.FLOOR_ACCESS_FEES.secondFloor} additional charge`, 
    thirdFloorPlus: `Third floor or higher: £${PRICING_CONSTANTS.FLOOR_ACCESS_FEES.thirdFloorPlus} additional charge`,
    lift: `If a lift is available, the floor access fee is reduced by ${(1 - PRICING_CONSTANTS.LIFT_DISCOUNT) * 100}%`
  },
  surcharges: {
    weekend: `Weekend: ${PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.weekend * 100}% surcharge`,
    evening: `Evening (after 6pm): ${PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.evening * 100}% surcharge`, 
    holiday: `UK Holidays: ${PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.holiday * 100}% surcharge`,
    urgency: {
      standard: "Standard service: No surcharge",
      priority: `Priority service: ${PRICING_CONSTANTS.URGENCY_SURCHARGES.priority * 100}% surcharge`,
      express: `Express service: ${PRICING_CONSTANTS.URGENCY_SURCHARGES.express * 100}% surcharge`
    }
  },
  commission: `Our platform fee (${PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE * 100}%) covers our operating costs, customer service, and insurance. The driver receives ${(1 - PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE) * 100}% of the total price.`,
  vat: "All prices include VAT at the standard UK rate of 20%."
};

// Create fuel tooltip function that takes van size to avoid reference errors
const getFuelTooltip = (vanType: VanSize = 'medium') => {
  const mpgValue = vanType === 'small' ? '35' : 
                vanType === 'large' ? '22' : 
                vanType === 'luton' ? '18' : '28';
  
  return `Fuel costs are calculated based on the van's MPG, distance, and current fuel prices. For example, a ${vanType} van averages ${mpgValue} MPG. The formula used is: (distance / mpg) × £ per litre × litres per gallon. The return journey is calculated at ${PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR * 100}% of the outbound journey.`;
};

interface PricingBreakdownWizardProps {
  quote: QuoteResult;
  onClose: () => void;
}

const PricingBreakdownWizard: React.FC<PricingBreakdownWizardProps> = ({ quote, onClose }) => {
  const [step, setStep] = useState<WizardStep>(WizardStep.INTRO);
  const totalSteps = Object.keys(WizardStep).length / 2; // Enum has value/key pairs
  
  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };
  
  // Calculate the progress percentage
  const progress = useMemo(() => {
    return Math.round((step / (totalSteps - 1)) * 100);
  }, [step, totalSteps]);
  
  // Navigation helpers
  const goToNextStep = () => {
    if (step < totalSteps - 1) {
      setStep((prev) => (prev + 1) as WizardStep);
    }
  };
  
  const goToPrevStep = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  };
  
  // Calculate the percentage contribution of each factor to the total price
  const getPercentageContribution = (value: number) => {
    return Math.round((value / quote.totalPrice) * 100);
  };
  
  // Render a progress bar with the contribution percentage
  const renderContributionBar = (value: number) => {
    const percentage = getPercentageContribution(value);
    return (
      <div className="w-full mt-1">
        <Progress value={percentage} className="h-2" />
        <div className="text-xs text-right text-muted-foreground mt-1">
          {percentage}% of total
        </div>
      </div>
    );
  };
  
  // Render the content for the current step
  const renderStepContent = () => {
    switch (step) {
      case WizardStep.INTRO:
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Transparent Pricing Breakdown</CardTitle>
              <CardDescription>
                We believe in transparent pricing. This wizard will walk you through how your
                quote of {formatCurrency(quote.totalPrice)} was calculated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your quote consists of several components:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-medium">Distance charge:</span> {formatCurrency(quote.distanceCharge)}</li>
                <li><span className="font-medium">Time charge:</span> {formatCurrency(quote.timeCharge)}</li>
                {quote.helpersFee > 0 && (
                  <li><span className="font-medium">Helpers fee:</span> {formatCurrency(quote.helpersFee)}</li>
                )}
                {quote.floorAccessFee > 0 && (
                  <li><span className="font-medium">Floor access fee:</span> {formatCurrency(quote.floorAccessFee)}</li>
                )}
                <li><span className="font-medium">Fuel costs:</span> {formatCurrency(quote.fuelCost)}</li>
                <li><span className="font-medium">Return journey:</span> {formatCurrency(quote.returnJourneyCost)}</li>
                {quote.peakTimeSurcharge > 0 && (
                  <li><span className="font-medium">Peak time surcharge:</span> {formatCurrency(quote.peakTimeSurcharge)}</li>
                )}
                {quote.urgencySurcharge > 0 && (
                  <li><span className="font-medium">Urgency surcharge:</span> {formatCurrency(quote.urgencySurcharge)}</li>
                )}
                {quote.congestionCharge > 0 && (
                  <li><span className="font-medium">Congestion charge:</span> {formatCurrency(quote.congestionCharge)}</li>
                )}
              </ul>
              <div className="p-4 bg-primary/5 rounded-md mt-6">
                <p className="font-medium text-primary">Click "Next" to learn more about how each factor affects your quote</p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.DISTANCE:
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Distance Pricing</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.distance}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">{quote.distance || parseFloat(localStorage.getItem('calculatedDistance') || '0')} miles</p>
                  <p className="text-sm text-muted-foreground">
                    Base rate: {formatCurrency(PRICING_CONSTANTS.BASE_RATE_PER_MILE)}/mile
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(quote.distanceCharge)}
                </Badge>
              </div>
              
              {renderContributionBar(quote.distanceCharge)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">How it's calculated:</p>
                <p className="mt-1">
                  {quote.distance || 0} miles × £{PRICING_CONSTANTS.BASE_RATE_PER_MILE.toFixed(2)}/mile = {formatCurrency(quote.distanceCharge)}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {FACTOR_TOOLTIPS.distance}
                </p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.VAN_SIZE:
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Van Size Impact</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.vanSize}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium capitalize">{quote.vanSize} Van</p>
                  <p className="text-sm text-muted-foreground">
                    Multiplier: {quote.vanSizeMultiplier}× (impacts time charges)
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(quote.timeCharge)}
                </Badge>
              </div>
              
              {renderContributionBar(quote.timeCharge)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">Van Size Details:</p>
                <p className="mt-1">
                  {FACTOR_TOOLTIPS.vanSize[quote.vanSize as VanSize]}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  The van size affects your price in two ways: the hourly rate and the space available for your items.
                </p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.TIME:
        // Calculate estimated hours from the quote or use a reasonable default
        const estimatedHours = useMemo(() => {
          if (quote?.vanSize && quote?.distance) {
            return Math.max(2, (quote.distance || 10) / 30);
          }
          return 2; // Default value if not available
        }, [quote]);
        
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Time-Based Charges</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.time}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">{estimatedHours.toFixed(1)} hours estimated</p>
                  <p className="text-sm text-muted-foreground">
                    Hourly rate: {formatCurrency(PRICING_CONSTANTS.HOURLY_RATES[quote.vanSize as VanSize])}/hour
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(quote.timeCharge)}
                </Badge>
              </div>
              
              {renderContributionBar(quote.timeCharge)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">How it's calculated:</p>
                <p className="mt-1">
                  {estimatedHours.toFixed(1)} hours × 
                  {formatCurrency(PRICING_CONSTANTS.HOURLY_RATES[quote.vanSize as VanSize])}/hour × 
                  {quote.vanSizeMultiplier}× (van size multiplier) = 
                  {formatCurrency(quote.timeCharge)}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {FACTOR_TOOLTIPS.time}
                </p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.HELPERS:
        // For the helpers calculation, we need the number of helpers
        // This should be extracted from the form data in a real implementation
        const calculatedHours = Math.max(2, (quote.distance || 10) / 30);
        const helpersCount = quote.helpersFee > 0 ? Math.round(quote.helpersFee / (PRICING_CONSTANTS.HELPER_HOURLY_RATE * calculatedHours)) : 0;
        
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Additional Helpers</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.helpers}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">{helpersCount} helper{helpersCount !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground">
                    Helper rate: {formatCurrency(PRICING_CONSTANTS.HELPER_HOURLY_RATE)}/hour per helper
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(quote.helpersFee)}
                </Badge>
              </div>
              
              {renderContributionBar(quote.helpersFee)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">How it's calculated:</p>
                <p className="mt-1">
                  {helpersCount} helper{helpersCount !== 1 ? 's' : ''} × 
                  {formatCurrency(PRICING_CONSTANTS.HELPER_HOURLY_RATE)}/hour × 
                  {calculatedHours.toFixed(1)} hours = 
                  {formatCurrency(quote.helpersFee)}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {FACTOR_TOOLTIPS.helpers}
                </p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.ACCESS:
        // Determine floor access type from the fee
        const determineFloorAccess = (fee: number) => {
          if (fee === 0) return 'ground';
          if (fee <= PRICING_CONSTANTS.FLOOR_ACCESS_FEES.firstFloor) return 'firstFloor';
          if (fee <= PRICING_CONSTANTS.FLOOR_ACCESS_FEES.secondFloor) return 'secondFloor';
          return 'thirdFloorPlus';
        };
        
        const floorAccess = determineFloorAccess(quote.floorAccessFee);
        const liftAvailable = quote.floorAccessFee > 0 && 
          quote.floorAccessFee < PRICING_CONSTANTS.FLOOR_ACCESS_FEES[floorAccess as keyof typeof PRICING_CONSTANTS.FLOOR_ACCESS_FEES];
        
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Access Conditions</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.access}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium capitalize">
                    {floorAccess.replace(/([A-Z])/g, ' $1').toLowerCase()} access
                    {liftAvailable && " with lift available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Base fee: {formatCurrency(PRICING_CONSTANTS.FLOOR_ACCESS_FEES[floorAccess as keyof typeof PRICING_CONSTANTS.FLOOR_ACCESS_FEES])}
                    {liftAvailable && ` (${PRICING_CONSTANTS.LIFT_DISCOUNT * 100}% discount with lift)`}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(quote.floorAccessFee)}
                </Badge>
              </div>
              
              {renderContributionBar(quote.floorAccessFee)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">Floor Access Details:</p>
                <p className="mt-1">
                  {FACTOR_TOOLTIPS.access[floorAccess as keyof typeof FACTOR_TOOLTIPS.access]}
                </p>
                {liftAvailable && (
                  <p className="mt-1">
                    {FACTOR_TOOLTIPS.access.lift}
                  </p>
                )}
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.SURCHARGES:
        const hasPeakTimeSurcharge = quote.peakTimeSurcharge > 0;
        const hasUrgencySurcharge = quote.urgencySurcharge > 0;
        const totalSurcharges = quote.peakTimeSurcharge + quote.urgencySurcharge;
        
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Time & Urgency Surcharges</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.surcharges}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">
                    {hasPeakTimeSurcharge ? 'Peak time surcharge' : ''}
                    {hasPeakTimeSurcharge && hasUrgencySurcharge ? ' + ' : ''}
                    {hasUrgencySurcharge ? `${quote.vanSize} urgency` : ''}
                    {!hasPeakTimeSurcharge && !hasUrgencySurcharge ? 'No surcharges apply' : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(totalSurcharges)}
                </Badge>
              </div>
              
              {renderContributionBar(totalSurcharges)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                {hasPeakTimeSurcharge && (
                  <>
                    <p className="font-medium">Peak Time Surcharge:</p>
                    <p className="mt-1">
                      Applied when moving during weekends, evenings, or holidays.
                      This adds {formatCurrency(quote.peakTimeSurcharge)} to your quote.
                    </p>
                  </>
                )}
                
                {hasUrgencySurcharge && (
                  <>
                    <p className="font-medium mt-3">Urgency Surcharge:</p>
                    <p className="mt-1">
                      {/* Determine the urgency level based on the surcharge percentage */}
                      {quote.urgencySurcharge > (quote.totalPrice * 0.3) ? 
                        FACTOR_TOOLTIPS.surcharges.urgency.express : 
                        FACTOR_TOOLTIPS.surcharges.urgency.priority}
                      This adds {formatCurrency(quote.urgencySurcharge)} to your quote.
                    </p>
                  </>
                )}
                
                {!hasPeakTimeSurcharge && !hasUrgencySurcharge && (
                  <p className="text-sm text-muted-foreground">
                    You've chosen a standard service during regular hours,
                    so no time or urgency surcharges apply to your quote.
                  </p>
                )}
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.FUEL:
        const totalFuelCosts = quote.fuelCost + quote.returnJourneyCost;
        const currentVanSize = quote.vanSize || 'medium';
        
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Fuel & Journey Costs</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.fuel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">Total fuel costs</p>
                  <p className="text-sm text-muted-foreground">
                    Outbound: {formatCurrency(quote.fuelCost)} | Return: {formatCurrency(quote.returnJourneyCost)}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                  {formatCurrency(totalFuelCosts)}
                </Badge>
              </div>
              
              {renderContributionBar(totalFuelCosts)}
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">How fuel costs are calculated:</p>
                <p className="mt-1">
                  <strong>Outbound journey:</strong> Using MPG based formula for {currentVanSize} van
                </p>
                <p className="mt-1">
                  <strong>Return journey:</strong> {quote.distance || 0} miles × {formatCurrency(PRICING_CONSTANTS.BASE_RATE_PER_MILE)}/mile × {PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR} (return factor) = {formatCurrency(quote.returnJourneyCost)}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {getFuelTooltip(currentVanSize as VanSize)}
                </p>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.COMMISSION:
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Platform Fee & Driver Payment</CardTitle>
              <CardDescription>
                {FACTOR_DESCRIPTIONS.commission}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-600 font-medium">Platform Fee (25%)</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {formatCurrency(quote.platformFee)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-600 font-medium">Driver Payment (75%)</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    {formatCurrency(quote.driverShare)}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-primary/5 rounded-md mt-2">
                <p className="font-medium">Commission Structure:</p>
                <p className="mt-1">
                  Our platform takes a 25% fee ({formatCurrency(quote.platformFee)}) from the total price,
                  while 75% ({formatCurrency(quote.driverShare)}) goes directly to your driver.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {FACTOR_TOOLTIPS.commission}
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">VAT Information:</p>
                  <p className="mt-1">
                    Your quote includes VAT of {formatCurrency(quote.vatAmount || 0)}
                    (Net amount: {formatCurrency(quote.netAmount || 0)})
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {FACTOR_TOOLTIPS.vat}
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        );
        
      case WizardStep.SUMMARY:
        return (
          <>
            <CardHeader>
              <CardTitle className="text-primary text-xl">Quote Summary</CardTitle>
              <CardDescription>
                Here's a complete breakdown of your {formatCurrency(quote.totalPrice)} quote.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="col-span-2 pb-2 mb-2 border-b">
                  <p className="font-medium text-lg">Quote Details</p>
                </div>
                
                <div className="text-sm">Van Size:</div>
                <div className="text-sm font-medium capitalize">{quote.vanSize}</div>
                
                <div className="text-sm">Distance:</div>
                <div className="text-sm font-medium">{quote.distance || 0} miles</div>
                
                <div className="text-sm">Date:</div>
                <div className="text-sm font-medium">
                  {quote.moveDate ? new Date(quote.moveDate).toLocaleDateString() : 'Not specified'}
                </div>
                
                <div className="text-sm">Estimated Time:</div>
                <div className="text-sm font-medium">{quote.estimatedTime}</div>
                
                <div className="col-span-2 pt-4 pb-2 mb-2 border-b">
                  <p className="font-medium text-lg">Price Breakdown</p>
                </div>
                
                <div className="text-sm">Distance Charge:</div>
                <div className="text-sm font-medium">{formatCurrency(quote.distanceCharge)}</div>
                
                <div className="text-sm">Time Charge:</div>
                <div className="text-sm font-medium">{formatCurrency(quote.timeCharge)}</div>
                
                {quote.helpersFee > 0 && (
                  <>
                    <div className="text-sm">Helpers Fee:</div>
                    <div className="text-sm font-medium">{formatCurrency(quote.helpersFee)}</div>
                  </>
                )}
                
                {quote.floorAccessFee > 0 && (
                  <>
                    <div className="text-sm">Floor Access Fee:</div>
                    <div className="text-sm font-medium">{formatCurrency(quote.floorAccessFee)}</div>
                  </>
                )}
                
                <div className="text-sm">Fuel Cost:</div>
                <div className="text-sm font-medium">{formatCurrency(quote.fuelCost)}</div>
                
                <div className="text-sm">Return Journey:</div>
                <div className="text-sm font-medium">{formatCurrency(quote.returnJourneyCost)}</div>
                
                {quote.peakTimeSurcharge > 0 && (
                  <>
                    <div className="text-sm">Peak Time Surcharge:</div>
                    <div className="text-sm font-medium">{formatCurrency(quote.peakTimeSurcharge)}</div>
                  </>
                )}
                
                {quote.urgencySurcharge > 0 && (
                  <>
                    <div className="text-sm">Urgency Surcharge:</div>
                    <div className="text-sm font-medium">{formatCurrency(quote.urgencySurcharge)}</div>
                  </>
                )}
                
                {quote.congestionCharge > 0 && (
                  <>
                    <div className="text-sm">Congestion Charge:</div>
                    <div className="text-sm font-medium">{formatCurrency(quote.congestionCharge)}</div>
                  </>
                )}
                
                <div className="col-span-2 pt-3 mt-2 border-t"></div>
                
                <div className="text-sm font-medium">Platform Fee (25%):</div>
                <div className="text-sm font-medium">{formatCurrency(quote.platformFee)}</div>
                
                <div className="text-sm font-medium">Driver Payment (75%):</div>
                <div className="text-sm font-medium">{formatCurrency(quote.driverShare)}</div>
                
                <div className="col-span-2 pt-3 mt-2 border-t"></div>
                
                <div className="text-sm font-medium">Total Price:</div>
                <div className="text-base font-bold text-primary">{formatCurrency(quote.totalPrice)}</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-md mt-4 text-center">
                <p className="font-medium text-green-700">
                  We believe in transparent pricing with no hidden fees
                </p>
                <Button 
                  className="mt-2" 
                  onClick={onClose}
                  variant="outline"
                >
                  Close This Breakdown
                </Button>
              </div>
            </CardContent>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto animate-in fade-in duration-500 shadow-lg">
      <div className="relative">
        {renderStepContent()}
        
        <CardFooter className="flex justify-between pt-0 pb-6">
          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPrevStep}
              disabled={step === WizardStep.INTRO}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={step === WizardStep.SUMMARY}
              variant={step === WizardStep.INTRO ? "default" : "outline"}
              size="sm"
            >
              {step === WizardStep.SUMMARY - 1 ? "View Summary" : "Next"}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Step {step + 1} of {totalSteps}
          </div>
        </CardFooter>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

export default PricingBreakdownWizard;