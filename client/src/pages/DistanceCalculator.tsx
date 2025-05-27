import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  calculateDistance,
  formatDistance,
  formatEstimatedTime,
} from "@/lib/services/distance-calculator";
import { useQuote } from "@/contexts/QuoteContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VanSize } from "@shared/pricing-rules";
import { GoogleMap, LoadScript, Autocomplete } from "@react-google-maps/api";

// Add this constant for Google Maps API configuration
const libraries: ("places" | "geometry")[] = ["places"];

export default function DistanceCalculator() {
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [vanSize, setVanSize] = useState<VanSize>("medium");
  const [distance, setDistance] = useState<any | null>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Refs for Autocomplete instances
  const fromAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );
  const toAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );

  const {
    currentQuote,
    calculateQuoteWithAddresses,
    calculateSimpleQuoteWithAddresses,
  } = useQuote();

  const calculateDistanceHandler = async () => {
    if (!fromAddress || !toAddress) {
      setError("Please enter both addresses");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateDistance(fromAddress, toAddress);
      console.log("+++++++++++++++++++++++++++", fromAddress, toAddress);
      setCalculationResult(result);
      console.log("555555555555555555", result);
      setDistance(result.distance);
    } catch (err: any) {
      setError(err.message || "Failed to calculate distance");
    } finally {
      setIsLoading(false);
    }
  };

  // Update quote result when currentQuote changes
  React.useEffect(() => {
    if (currentQuote) {
      setQuoteResult(currentQuote);
    }
  }, [currentQuote]);

  const calculateSimpleQuoteHandler = async () => {
    if (!fromAddress || !toAddress) {
      setError("Please enter both addresses");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await calculateSimpleQuoteWithAddresses({
        pickupAddress: fromAddress,
        deliveryAddress: toAddress,
        vanSize: vanSize,
      });
      // Quote will be updated through the effect
    } catch (err: any) {
      setError(err.message || "Failed to calculate quote");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDetailedQuoteHandler = async () => {
    if (!fromAddress || !toAddress) {
      setError("Please enter both addresses");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await calculateQuoteWithAddresses({
        pickupAddress: fromAddress,
        deliveryAddress: toAddress,
        vanSize: vanSize,
        moveDate: new Date(),
        estimatedHours: 2,
        helpers: 1,
        floorAccess: "ground",
        liftAvailable: false,
        urgency: "standard",
      });
      // Quote will be updated through the effect
    } catch (err: any) {
      setError(err.message || "Failed to calculate detailed quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for when the Autocomplete for pickup address is loaded
  const onFromLoad = (autocomplete: google.maps.places.Autocomplete) => {
    fromAutocompleteRef.current = autocomplete;
    autocomplete.setFields(["formatted_address"]);
  };

  // Handler for when the Autocomplete for delivery address is loaded
  const onToLoad = (autocomplete: google.maps.places.Autocomplete) => {
    toAutocompleteRef.current = autocomplete;
    autocomplete.setFields(["formatted_address"]);
  };

  // Handler for when the place is changed in the pickup address Autocomplete
  const onFromPlaceChanged = () => {
    if (fromAutocompleteRef.current) {
      const place = fromAutocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setFromAddress(place.formatted_address);
      }
    }
  };

  // Handler for when the place is changed in the delivery address Autocomplete
  const onToPlaceChanged = () => {
    if (toAutocompleteRef.current) {
      const place = toAutocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setToAddress(place.formatted_address);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LoadScript
        googleMapsApiKey={"AIzaSyD7f37lq5Q_slSqbKG14TU5IENKwoNxUe0"}
        libraries={libraries}
        onLoad={() => setIsScriptLoaded(true)}
      >
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">
              Distance Calculator
            </CardTitle>
            <CardDescription className="text-center">
              Test our enhanced distance calculation and pricing accuracy
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pickup Address
                </label>
                {isScriptLoaded ? (
                  <Autocomplete
                    onLoad={onFromLoad}
                    onPlaceChanged={onFromPlaceChanged}
                  >
                    <Input
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      placeholder="Enter pickup address"
                      className="w-full"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery Address
                </label>
                {isScriptLoaded ? (
                  <Autocomplete
                    onLoad={onToLoad}
                    onPlaceChanged={onToPlaceChanged}
                  >
                    <Input
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      className="w-full"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Van Size</label>
              <Select
                value={vanSize}
                onValueChange={(value) => setVanSize(value as VanSize)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select van size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small Van</SelectItem>
                  <SelectItem value="medium">Medium Van</SelectItem>
                  <SelectItem value="large">Large Van</SelectItem>
                  <SelectItem value="luton">Luton Van</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded border border-red-200">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={calculateDistanceHandler}
              disabled={isLoading || !fromAddress || !toAddress}
              className="w-full md:w-auto"
            >
              {isLoading ? "Calculating..." : "Calculate Distance"}
            </Button>

            <Button
              onClick={calculateSimpleQuoteHandler}
              disabled={isLoading || !fromAddress || !toAddress}
              variant="outline"
              className="w-full md:w-auto"
            >
              Get Simple Quote
            </Button>

            <Button
              onClick={calculateDetailedQuoteHandler}
              disabled={isLoading || !fromAddress || !toAddress}
              variant="secondary"
              className="w-full md:w-auto"
            >
              Get Detailed Quote
            </Button>
          </CardFooter>
        </Card>

        {/* Rest of your component remains the same */}
        {calculationResult && (
          <Card className="w-full max-w-4xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Distance Results
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Route Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {distance.origin || fromAddress}
                    </div>
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {distance.destination || toAddress}
                    </div>
                    <div>
                      <span className="font-medium">Distance:</span>{" "}
                      {formatDistance(distance.distance, distance.unit)}
                    </div>
                    <div>
                      <span className="font-medium">Estimated Time:</span>{" "}
                      {formatEstimatedTime(distance.estimatedTime)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Calculation Method
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Using Google Maps:</span>{" "}
                      {distance.source === "google_maps" ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Exact Calculation:</span>{" "}
                      {distance.exactCalculation ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>{" "}
                      {distance.calculationMethod || "Standard"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentQuote && (
          <Card className="w-full max-w-4xl mx-auto mt-8 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary">
                Quote Results
              </CardTitle>
              <CardDescription>
                Based on the addresses and van size you selected
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      {currentQuote.priceString ||
                        `£${currentQuote.totalPrice?.toFixed(2)}`}
                    </h3>
                    <p className="text-muted-foreground">
                      Total Price (includes VAT)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">
                      Van Size:{" "}
                      <span className="font-semibold capitalize">
                        {currentQuote.vanSize || vanSize}
                      </span>
                    </p>
                    <p className="text-sm">
                      Distance:{" "}
                      {formatDistance(currentQuote.distance || 0, "miles")}
                    </p>
                  </div>
                </div>

                {currentQuote.breakdown && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg mb-3 text-primary">
                      Price Breakdown
                    </h3>
                    <div className="space-y-2">
                      {currentQuote.breakdown.map(
                        (item: string, index: number) => {
                          // Handle both string items and object items with description/amount
                          if (typeof item === "string") {
                            const parts = item.split(":");
                            return (
                              <div
                                key={index}
                                className="flex justify-between py-1 border-b last:border-0 border-gray-100"
                              >
                                <span>{parts[0]}</span>
                                <span className="font-medium">
                                  {parts.length > 1 ? parts[1] : ""}
                                </span>
                              </div>
                            );
                          } else if (
                            typeof item === "object" &&
                            item !== null
                          ) {
                            // If it's an object with description and amount
                            const objItem = item as any;
                            return (
                              <div
                                key={index}
                                className="flex justify-between py-1 border-b last:border-0 border-gray-100"
                              >
                                <span>{objItem.description}</span>
                                <span className="font-medium">
                                  {objItem.amount}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        },
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2 text-primary">VAT</h3>
                    <p className="text-2xl font-semibold">
                      £{(currentQuote.vatAmount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Included in total price
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2 text-primary">
                      Driver Share
                    </h3>
                    <p className="text-2xl font-semibold">
                      £{(currentQuote.driverShare || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      75% of price (ex VAT)
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2 text-primary">
                      Platform Fee
                    </h3>
                    <p className="text-2xl font-semibold">
                      £{(currentQuote.platformFee || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      25% of price (ex VAT)
                    </p>
                  </div>
                </div>

                {currentQuote.explanation && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 text-primary">
                      How We Calculated This
                    </h3>
                    <p className="text-muted-foreground">
                      {currentQuote.explanation}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </LoadScript>
    </div>
  );
}
