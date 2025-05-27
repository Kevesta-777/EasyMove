import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Truck, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DetailedItemsForm, { Item } from './DetailedItemsForm';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export interface QuoteFormValues {
  pickupAddress: string;
  deliveryAddress: string;
  vanSize: 'small' | 'medium' | 'large' | 'luton';
  moveDate: Date;
  items: Item[];
  floorAccess: 'ground' | 'first' | 'second' | 'third+';
  helpers: 0 | 1 | 2;
}

interface EnhancedQuoteFormProps {
  onSubmit: (values: QuoteFormValues) => void;
  isLoading?: boolean;
}

export default function EnhancedQuoteForm({ onSubmit, isLoading = false }: EnhancedQuoteFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [formValues, setFormValues] = useState<QuoteFormValues>({
    pickupAddress: '',
    deliveryAddress: '',
    vanSize: 'medium',
    moveDate: new Date(),
    items: [],
    floorAccess: 'ground',
    helpers: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBasicInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }
    
    if (!formValues.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormValues(prev => ({
        ...prev,
        moveDate: date
      }));
    }
  };

  const handleItemsSubmit = (items: Item[]) => {
    setFormValues(prev => ({
      ...prev,
      items
    }));
    
    // Form is complete, submit
    const finalValues = {
      ...formValues,
      items
    };
    
    onSubmit(finalValues);
  };

  const handleNextStep = () => {
    if (validateBasicInfo()) {
      setStep(2);
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Get an Accurate Quote</CardTitle>
            <CardDescription>
              Fill in your moving details to get an instant quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address*</Label>
                <Input
                  id="pickupAddress"
                  name="pickupAddress"
                  value={formValues.pickupAddress}
                  onChange={handleInputChange}
                  placeholder="Enter the pickup address or postcode"
                  className={errors.pickupAddress ? "border-red-500" : ""}
                />
                {errors.pickupAddress && <p className="text-red-500 text-sm">{errors.pickupAddress}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address*</Label>
                <Input
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formValues.deliveryAddress}
                  onChange={handleInputChange}
                  placeholder="Enter the delivery address or postcode"
                  className={errors.deliveryAddress ? "border-red-500" : ""}
                />
                {errors.deliveryAddress && <p className="text-red-500 text-sm">{errors.deliveryAddress}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vanSize">Van Size</Label>
                  <Select 
                    value={formValues.vanSize} 
                    onValueChange={(value) => handleSelectChange('vanSize', value)}
                  >
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <Label>Moving Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formValues.moveDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formValues.moveDate ? format(formValues.moveDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formValues.moveDate}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floorAccess">Floor Access</Label>
                  <Select 
                    value={formValues.floorAccess} 
                    onValueChange={(value) => handleSelectChange('floorAccess', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground">Ground Floor</SelectItem>
                      <SelectItem value="first">First Floor</SelectItem>
                      <SelectItem value="second">Second Floor</SelectItem>
                      <SelectItem value="third+">Third Floor or Higher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="helpers">Additional Helpers</Label>
                  <Select 
                    value={String(formValues.helpers)} 
                    onValueChange={(value) => handleSelectChange('helpers', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of helpers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Additional Help</SelectItem>
                      <SelectItem value="1">1 Helper (+£40/hr)</SelectItem>
                      <SelectItem value="2">2 Helpers (+£75/hr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleNextStep}>
              Continue to Item Details
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="mb-4"
            >
              &larr; Back to Basic Details
            </Button>
            
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {formValues.pickupAddress} to {formValues.deliveryAddress}
              </span>
              <span className="text-sm text-muted-foreground">
                ({formValues.vanSize} van)
              </span>
            </div>
          </div>
          
          <DetailedItemsForm 
            onSubmit={handleItemsSubmit} 
            initialItems={formValues.items}
          />
          
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Generating your quote...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}