import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Autocomplete, LoadScript } from "@react-google-maps/api";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  calculateDetailedQuote,
  QuoteResult,
} from "@/lib/utils/quote-calculator";

import {
  PRICING_CONSTANTS,
  type VanSize,
  type FloorAccess,
  type UrgencyLevel,
} from "@shared/pricing-rules";

// Import API request helper
import { apiRequest } from "@/lib/queryClient";

// Validation schema for the form
const formSchema = z.object({
  pickupAddress: z.string().min(5, "Please enter a valid pickup address"),
  deliveryAddress: z.string().min(5, "Please enter a valid delivery address"),
  moveDate: z.date({
    required_error: "Please select a date",
  }),
  moveTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Please enter a valid time (HH:MM)",
    )
    .default("09:00"),
  vanSize: z
    .enum(["small", "medium", "large", "luton"] as const)
    .default("medium"),
  estimatedHours: z.number().min(1).max(8).default(2),
  helpers: z.number().min(0).max(2).default(0),
  floorAccessPickup: z
    .enum(["ground", "firstFloor", "secondFloor", "thirdFloorPlus"] as const)
    .default("ground"),
  floorAccessDelivery: z
    .enum(["ground", "firstFloor", "secondFloor", "thirdFloorPlus"] as const)
    .default("ground"),
  liftAvailablePickup: z.boolean().default(false),
  liftAvailableDelivery: z.boolean().default(false),
  urgency: z
    .enum(["standard", "priority", "express"] as const)
    .default("standard"),
});

type FormValues = z.infer<typeof formSchema>;

// Google Maps libraries to load
const libraries: ("places" | "geometry")[] = ["places"];

const HomeCalculator: React.FC = () => {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [initialView, setInitialView] = useState<boolean>(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const { toast } = useToast();

  // Refs for Autocomplete instances
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );
  const deliveryAutocompleteRef =
    useRef<google.maps.places.Autocomplete | null>(null);

  // Load previously saved addresses if any
  const savedPickupAddress = localStorage.getItem("lastPickupAddress") || "";
  const savedDeliveryAddress =
    localStorage.getItem("lastDeliveryAddress") || "";

  // Setup form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupAddress: savedPickupAddress,
      deliveryAddress: savedDeliveryAddress,
      moveDate: new Date(),
      moveTime: "09:00",
      vanSize: "medium",
      estimatedHours: 2,
      helpers: 0,
      floorAccessPickup: "ground",
      floorAccessDelivery: "ground",
      liftAvailablePickup: false,
      liftAvailableDelivery: false,
      urgency: "standard",
    },
  });

  // Handler for when the Autocomplete for pickup address is loaded
  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocompleteRef.current = autocomplete;
    autocomplete.setFields(["formatted_address"]);
  };

  // Handler for when the Autocomplete for delivery address is loaded
  const onDeliveryLoad = (autocomplete: google.maps.places.Autocomplete) => {
    deliveryAutocompleteRef.current = autocomplete;
    autocomplete.setFields(["formatted_address"]);
  };

  // Handler for when the place is changed in the pickup address Autocomplete
  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place.formatted_address) {
        form.setValue("pickupAddress", place.formatted_address);
      }
    }
  };

  // Handler for when the place is changed in the delivery address Autocomplete
  const onDeliveryPlaceChanged = () => {
    if (deliveryAutocompleteRef.current) {
      const place = deliveryAutocompleteRef.current.getPlace();
      if (place.formatted_address) {
        form.setValue("deliveryAddress", place.formatted_address);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted with data:", data);
    setIsCalculating(true);
    setInitialView(false);

    try {
      // Store addresses in local storage
      localStorage.setItem("lastPickupAddress", data.pickupAddress);
      localStorage.setItem("lastDeliveryAddress", data.deliveryAddress);

      // Calculate distance using API
      const result = await apiRequest(
        // distance: number;
        // unit: string;
        // estimatedTime: number;
        {
          method: "POST",
          url: "/api/quotes/calculate",
          data: {
            collectionAddress: data.pickupAddress,
            deliveryAddress: data.deliveryAddress,
            moveDate: data.moveDate,
            vanSize: data.vanSize,
            urgency: data.urgency,
          },
        },
      );
      console.log("Distance result:", result);
      const distanceResult = result.standardQuote;
      console.log("Distance result:", distanceResult);
      const distance = distanceResult?.distance || 10; // Default to 10 miles if API fails

      // Combine time from the form with the date
      const moveDateTime = new Date(data.moveDate);
      const [hours, minutes] = data.moveTime.split(":").map(Number);
      moveDateTime.setHours(hours, minutes);

      // Use the most severe floor access between pickup and delivery
      const floorAccessOrder = [
        "ground",
        "firstFloor",
        "secondFloor",
        "thirdFloorPlus",
      ];
      const pickupIndex = floorAccessOrder.indexOf(data.floorAccessPickup);
      const deliveryIndex = floorAccessOrder.indexOf(data.floorAccessDelivery);
      const floorAccess = floorAccessOrder[
        Math.max(pickupIndex, deliveryIndex)
      ] as FloorAccess;

      // Determine if lift is available (true only if available at both locations when needed)
      const needsLift = floorAccess !== "ground";
      const liftAvailable = needsLift
        ? data.liftAvailablePickup && data.liftAvailableDelivery
        : true;

      // Calculate the quote
      const calculatedQuote = calculateDetailedQuote({
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        distance,
        vanSize: data.vanSize as VanSize,
        moveDate: moveDateTime,
        estimatedHours: distanceResult?.estimatedTime,
        helpers: data.helpers,
        floorAccess,
        liftAvailable,
        urgency: data.urgency as UrgencyLevel,
      });
      console.log("Calculated quote:", calculatedQuote);
      // Check for London Congestion Charge
      const inLondon =
        data.pickupAddress.toLowerCase().includes("london") ||
        data.deliveryAddress.toLowerCase().includes("london") ||
        data.pickupAddress.toLowerCase().includes("ec1") ||
        data.deliveryAddress.toLowerCase().includes("ec1");

      if (inLondon) {
        // Add congestion charge to the total
        calculatedQuote.totalPrice += PRICING_CONSTANTS.CONGESTION_CHARGE;
        calculatedQuote.explanation += " Includes London Congestion Charge.";
      }

      setQuote(calculatedQuote);
      toast({
        title: "Quote calculated",
        description: `Your quote for ${distance} miles is ${calculatedQuote.priceString}`,
      });
    } catch (error) {
      console.error("Error calculating quote:", error);
      toast({
        title: "Error",
        description:
          "There was a problem calculating your quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const renderInitialView = () => (
    <Card className="bg-white rounded-xl shadow-xl text-gray-800">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Get Your Quote
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pickupAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Pickup Address</FormLabel>
                  <FormControl>
                    {isScriptLoaded ? (
                      <Autocomplete
                        onLoad={onPickupLoad}
                        onPlaceChanged={onPickupPlaceChanged}
                      >
                        <Input
                          placeholder="Enter full address with postcode"
                          {...field}
                        />
                      </Autocomplete>
                    ) : (
                      <Input
                        placeholder="Enter full address with postcode"
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    Delivery Address
                  </FormLabel>
                  <FormControl>
                    {isScriptLoaded ? (
                      <Autocomplete
                        onLoad={onDeliveryLoad}
                        onPlaceChanged={onDeliveryPlaceChanged}
                      >
                        <Input
                          placeholder="Enter full address with postcode"
                          {...field}
                        />
                      </Autocomplete>
                    ) : (
                      <Input
                        placeholder="Enter full address with postcode"
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moveDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-medium">Moving Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vanSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Van Size</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a van size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small Wheelbase Van</SelectItem>
                      <SelectItem value="medium">
                        Medium Wheelbase Van
                      </SelectItem>
                      <SelectItem value="large">Long Wheelbase Van</SelectItem>
                      <SelectItem value="luton">Luton Van</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  setInitialView(false);
                }}
              >
                Show More Options
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 px-6"
              disabled={isCalculating}
            >
              {isCalculating ? "Calculating..." : "Calculate Quote"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderAdvancedForm = () => (
    <Card className="bg-white rounded-xl shadow-xl text-gray-800">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Detailed Quote Calculator
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">
                Locations
              </h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Pickup Address
                      </FormLabel>
                      <FormControl>
                        {isScriptLoaded ? (
                          <Autocomplete
                            onLoad={onPickupLoad}
                            onPlaceChanged={onPickupPlaceChanged}
                          >
                            <Input
                              placeholder="Enter full address with postcode"
                              {...field}
                            />
                          </Autocomplete>
                        ) : (
                          <Input
                            placeholder="Enter full address with postcode"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Delivery Address
                      </FormLabel>
                      <FormControl>
                        {isScriptLoaded ? (
                          <Autocomplete
                            onLoad={onDeliveryLoad}
                            onPlaceChanged={onDeliveryPlaceChanged}
                          >
                            <Input
                              placeholder="Enter full address with postcode"
                              {...field}
                            />
                          </Autocomplete>
                        ) : (
                          <Input
                            placeholder="Enter full address with postcode"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">
                Date & Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="moveDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-medium">Moving Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moveTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Moving Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">
                Van & Services
              </h3>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="vanSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Van Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a van size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">
                            Small Wheelbase Van
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium Wheelbase Van
                          </SelectItem>
                          <SelectItem value="large">
                            Long Wheelbase Van
                          </SelectItem>
                          <SelectItem value="luton">Luton Van</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />

                      {field.value && (
                        <div className="text-xs text-gray-500 mt-1">
                          {
                            PRICING_CONSTANTS.VAN_CAPACITIES[field.value]
                              .description
                          }
                          (
                          {
                            PRICING_CONSTANTS.VAN_CAPACITIES[field.value]
                              .capacity
                          }
                          )
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Estimated Hours
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>1h</span>
                            <span>8h</span>
                          </div>
                          <Slider
                            defaultValue={[field.value]}
                            min={1}
                            max={8}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                          <div className="text-center text-sm font-medium">
                            {field.value} hour{field.value !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="helpers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Additional Helpers
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>None</span>
                            <span>2 helpers</span>
                          </div>
                          <Slider
                            defaultValue={[field.value]}
                            min={0}
                            max={2}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                          <div className="text-center text-sm font-medium">
                            {field.value === 0
                              ? "No helpers"
                              : field.value === 1
                                ? "1 helper"
                                : `${field.value} helpers`}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Service Level
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">
                            Standard Service
                          </SelectItem>
                          <SelectItem value="priority">
                            Priority Service (+25%)
                          </SelectItem>
                          <SelectItem value="express">
                            Express Service (+50%)
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {field.value === "priority" && (
                        <div className="text-xs text-amber-600 mt-1">
                          Priority service ensures your move is scheduled within
                          3 days
                        </div>
                      )}

                      {field.value === "express" && (
                        <div className="text-xs text-red-600 mt-1">
                          Express service guarantees next-day moving
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">
                Access Conditions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Pickup Location</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="floorAccessPickup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal">
                            Floor
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select floor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ground">
                                Ground Floor
                              </SelectItem>
                              <SelectItem value="firstFloor">
                                First Floor
                              </SelectItem>
                              <SelectItem value="secondFloor">
                                Second Floor
                              </SelectItem>
                              <SelectItem value="thirdFloorPlus">
                                Third Floor or Higher
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("floorAccessPickup") !== "ground" && (
                      <FormField
                        control={form.control}
                        name="liftAvailablePickup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-normal">
                                Lift Available
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">
                    Delivery Location
                  </h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="floorAccessDelivery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal">
                            Floor
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select floor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ground">
                                Ground Floor
                              </SelectItem>
                              <SelectItem value="firstFloor">
                                First Floor
                              </SelectItem>
                              <SelectItem value="secondFloor">
                                Second Floor
                              </SelectItem>
                              <SelectItem value="thirdFloorPlus">
                                Third Floor or Higher
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("floorAccessDelivery") !== "ground" && (
                      <FormField
                        control={form.control}
                        name="liftAvailableDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-normal">
                                Lift Available
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 px-6"
              disabled={isCalculating}
            >
              {isCalculating ? "Calculating..." : "Calculate Quote"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Render quote result
  const renderQuoteResult = () => {
    if (!quote) return null;

    return (
      <Card className="mt-6 bg-white rounded-xl shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <Badge className="mb-2 bg-green-500 hover:bg-green-600">
              Quote Ready
            </Badge>
            <h3 className="text-2xl font-bold mb-2">Your Move Will Cost</h3>
            <p className="text-4xl font-extrabold text-primary mb-2">
              {quote.priceString}
            </p>
            <p className="text-sm text-gray-500 mb-4">{quote.explanation}</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-semibold">
                  {quote.distance
                    ? `${quote.distance.toFixed(1)} miles`
                    : `${(quote.distanceCharge / PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN).toFixed(1)} miles`}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Estimated Time</p>
                <p className="font-semibold">{quote.estimatedTime}</p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full mb-2"
              variant="outline"
              onClick={() => {
                setShowBreakdown(!showBreakdown);
              }}
            >
              {showBreakdown ? "Hide Price Breakdown" : "Show Price Breakdown"}
            </Button>
            {showBreakdown && (
              <div className="mt-4 text-left">
                <h4 className="font-semibold mb-2 text-lg">Price Breakdown</h4>
                <ul className="space-y-1 text-sm">
                  {quote.breakdown.map((item, index) => {
                    if (item.split(": ")[0] === "Fuel") {
                      return null;
                    }
                    return (
                      <li
                        key={index}
                        className="flex justify-between py-1 border-b border-gray-100"
                      >
                        <span>{item.split(": ")[0]}</span>
                        <span className="font-medium">
                          {item.split(": ")[1]}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-700">
                    {quote.breakdown.map((item) => {
                      if (item.split(": ")[0] === "Driver payment (75%)") {
                        quote.currency = item.split(": ")[1];
                      }
                      return null;
                    })}
                    Driver Payment: {quote.currency}
                    {quote.driverShare}
                  </p>
                  <p className="text-blue-600 text-xs">
                    Our drivers receive{" "}
                    {Math.round((quote.driverShare / quote.totalPrice) * 100)}%
                    of the total price, ensuring fair compensation
                  </p>
                </div>
              </div>
            )}

            <Button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
              onClick={() => {
                try {
                  // Make sure we have a valid quote
                  if (!quote || !quote.platformFee) {
                    toast({
                      title: "Invalid Quote",
                      description: "Please complete the quote form first",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Ensure we have a price
                  if (!quote.totalWithVAT) {
                    quote.totalWithVAT = quote.totalPrice;
                  }

                  // Save the quote to localStorage and go directly to embedded checkout
                  localStorage.setItem("savedQuote", JSON.stringify(quote));
                  window.location.href = "/embedded-checkout";
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Could not save your quote. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <LoadScript
      googleMapsApiKey={"AIzaSyD7f37lq5Q_slSqbKG14TU5IENKwoNxUe0"}
      libraries={libraries}
      onLoad={() => setIsScriptLoaded(true)}
    >
      <div id="quote-form" className="w-full">
        {quote
          ? renderQuoteResult()
          : initialView
            ? renderInitialView()
            : renderAdvancedForm()}
      </div>
    </LoadScript>
  );
};

export default HomeCalculator;
