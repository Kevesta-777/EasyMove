import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateSimpleQuote,
  type QuoteResult,
} from "@/lib/utils/quote-calculator";
import { apiRequest } from "@/lib/queryClient";
import { type VanSize } from "@shared/pricing-rules";
import { formatPrice } from "@/lib/utils";

const quoteFormSchema = z.object({
  collectionAddress: z
    .string()
    .min(1, { message: "Collection address is required" }),
  deliveryAddress: z
    .string()
    .min(1, { message: "Delivery address is required" }),
  moveDate: z.date({ required_error: "Please select a date" }),
  vanSize: z.enum(["small", "medium", "large", "luton"], {
    required_error: "Please select a van size",
  }),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export default function QuoteForm() {
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track last submission to prevent duplicate API calls
  const lastSubmissionRef = useRef<string>("");

  // Check localStorage for previously entered addresses
  const savedPickupAddress =
    typeof window !== "undefined"
      ? localStorage.getItem("lastPickupAddress") || ""
      : "";
  const savedDeliveryAddress =
    typeof window !== "undefined"
      ? localStorage.getItem("lastDeliveryAddress") || ""
      : "";

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      collectionAddress: savedPickupAddress,
      deliveryAddress: savedDeliveryAddress,
    },
  });

  async function onSubmit(data: QuoteFormValues) {
    // Create a string representation of the form data to check for duplicate submissions
    const dataString = JSON.stringify({
      collectionAddress: data.collectionAddress,
      deliveryAddress: data.deliveryAddress,
      moveDate: data.moveDate ? data.moveDate.toISOString() : null,
      vanSize: data.vanSize,
    });

    // If this is a duplicate submission (user clicked multiple times), skip processing
    if (dataString === lastSubmissionRef.current && quoteResult) {
      console.log("Skipping duplicate submission");
      return;
    }

    // Update reference with current submission data
    lastSubmissionRef.current = dataString;

    setIsLoading(true);
    try {
      console.log("Making quote calculation API request");

      // Store addresses in local storage to maintain consistency with calculator page
      if (data.collectionAddress && data.deliveryAddress) {
        localStorage.setItem("lastPickupAddress", data.collectionAddress);
        localStorage.setItem("lastDeliveryAddress", data.deliveryAddress);
      }

      // Use new API request format with consistent pricing
      const response = await apiRequest({
        method: "POST",
        url: "/api/quotes/calculate",
        data: data,
      });

      // Ensure we have a valid quote result with required fields
      const result: QuoteResult = {
        totalPrice: response.totalPrice || 0,
        subTotal: response.subTotal || 0,
        priceString: response.priceString || "£0",
        currency: response.currency || "£",
        estimatedTime: response.estimatedTime || "",
        explanation: response.explanation || "",
        distance: response.distance || 0,
        breakdown: response.breakdown || [],
        vanSizeMultiplier: response.vanSizeMultiplier || 1,
        distanceCharge: response.distanceCharge || 0,
        timeCharge: response.timeCharge || 0,
        helpersFee: response.helpersFee || 0,
        floorAccessFee: response.floorAccessFee || 0,
        peakTimeSurcharge: response.peakTimeSurcharge || 0,
        urgencySurcharge: response.urgencySurcharge || 0,
        fuelCost: response.fuelCost || 0,
        returnJourneyCost: response.returnJourneyCost || 0,
        congestionCharge: response.congestionCharge || 0,
        platformFee: response.platformFee || 0,
        driverShare: response.driverShare || 0,
      };

      setQuoteResult(result);
    } catch (error) {
      console.error("Error calculating quote:", error);

      // Fallback pricing using our centralized pricing module for consistency
      const fallbackDistance = 10;
      const vanSize = data.vanSize as VanSize;

      // Use our new centralized pricing calculator
      const simpleQuote = calculateSimpleQuote(
        fallbackDistance,
        vanSize,
        data.moveDate,
      );

      setQuoteResult({
        totalPrice: simpleQuote.totalPrice,
        subTotal: simpleQuote.subTotal,
        priceString: simpleQuote.priceString,
        currency: simpleQuote.currency,
        estimatedTime: simpleQuote.estimatedTime,
        explanation: simpleQuote.explanation,
        distance: fallbackDistance,
        breakdown: simpleQuote.breakdown,
        vanSizeMultiplier: simpleQuote.vanSizeMultiplier,
        distanceCharge: simpleQuote.distanceCharge,
        timeCharge: simpleQuote.timeCharge,
        helpersFee: 0,
        floorAccessFee: 0,
        peakTimeSurcharge: 0,
        urgencySurcharge: 0,
        fuelCost: simpleQuote.fuelCost,
        returnJourneyCost: simpleQuote.returnJourneyCost,
        congestionCharge: 0,
        platformFee: simpleQuote.platformFee,
        driverShare: simpleQuote.driverShare,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card
      className="bg-white rounded-xl shadow-xl text-gray-800"
      id="quote-form"
    >
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Get Your Quote
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="collectionAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    Collection Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="Enter collection address"
                        className="pl-10"
                        {...field}
                      />
                    </div>
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
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="Enter delivery address"
                        className="pl-10"
                        {...field}
                      />
                    </div>
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
                  <FormLabel className="font-medium">
                    Planned Move Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select a date</span>
                            )}
                          </div>
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

            <Button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 px-6"
              disabled={isLoading}
            >
              {isLoading ? "Calculating..." : "Calculate Quote"}
            </Button>
          </form>
        </Form>

        {quoteResult && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Estimated Quote:</p>
              <p className="text-3xl font-bold text-primary">
                {quoteResult.priceString ||
                  formatPrice(quoteResult.totalPrice || 0)}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Based on {quoteResult.distance} miles distance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="w-full bg-[#FF9500] text-white"
                onClick={() => {
                  // Find PriceCalculator on page and scroll to it
                  // Store quote details for the detailed quote page
                  localStorage.setItem(
                    "quoteDetails",
                    JSON.stringify({
                      pickupAddress: form.getValues("collectionAddress"),
                      deliveryAddress: form.getValues("deliveryAddress"),
                      moveDate: form.getValues("moveDate"),
                      vanSize: form.getValues("vanSize"),
                    }),
                  );

                  // Navigate to the detailed quote page
                  window.location.href = "/quote";
                }}
              >
                Get Detailed Quote
              </Button>
              <Button
                className="w-full bg-primary text-white"
                onClick={() => {
                  // Save the simple quote to localStorage for checkout
                  const simpleQuote = {
                    ...quoteResult,
                    pickupAddress: form.getValues("collectionAddress"),
                    deliveryAddress: form.getValues("deliveryAddress"),
                    moveDate: form.getValues("moveDate"),
                    vanSize: form.getValues("vanSize"),
                    breakdown: [
                      `Base Rate: £${quoteResult?.distanceCharge ? quoteResult.distanceCharge.toFixed(2) : "0.00"}`,
                      `Distance Charge: £${((quoteResult?.distance || 0) * 1.75).toFixed(2)}`,
                      `Return Journey (30%): £${quoteResult?.returnJourneyCost ? quoteResult.returnJourneyCost.toFixed(2) : "0.00"}`,
                      `Platform Fee (25%): £${quoteResult?.platformFee ? quoteResult.platformFee.toFixed(2) : "0.00"}`,
                    ],
                  };
                  localStorage.setItem(
                    "savedQuote",
                    JSON.stringify(simpleQuote),
                  );
                  // Navigate directly to checkout
                  window.location.href = "/checkout";
                }}
                disabled={!quoteResult}
              >
                Book Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
