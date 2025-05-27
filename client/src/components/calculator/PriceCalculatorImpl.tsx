import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { calculateDetailedQuote } from "../../lib/utils/quote-calculator";
import { VanSize } from "../../lib/types";

export default function PriceCalculatorImpl() {
  const [formData, setFormData] = useState({
    pickup: "",
    delivery: "",
    vanSize: "medium" as VanSize,
    helpers: 0,
  });
  const [quote, setQuote] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // const price = await calculateDetailedQuote(formData);
    // setQuote(price);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Pickup Address"
          value={formData.pickup}
          onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
        />
        <Input
          placeholder="Delivery Address"
          value={formData.delivery}
          onChange={(e) =>
            setFormData({ ...formData, delivery: e.target.value })
          }
        />
        <Select
          value={formData.vanSize}
          onValueChange={(value) =>
            setFormData({ ...formData, vanSize: value as VanSize })
          }
        >
          <option value="small">Small Van</option>
          <option value="medium">Medium Van</option>
          <option value="large">Large Van</option>
          <option value="luton">Luton Van</option>
        </Select>
        <Input
          type="number"
          placeholder="Number of Helpers"
          value={formData.helpers}
          onChange={(e) =>
            setFormData({ ...formData, helpers: parseInt(e.target.value) || 0 })
          }
        />
        <Button type="submit" className="w-full">
          Calculate Price
        </Button>
      </form>
      {quote && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <h3 className="text-xl font-bold">Quote: £{quote.toFixed(2)}</h3>
        </div>
      )}
    </div>
  );
}
