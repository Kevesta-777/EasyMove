import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Plus, Edit, Save } from "lucide-react";

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  dimensions?: string;
  weight?: string;
  fragile: boolean;
  specialHandling: boolean;
}

export interface DetailedItemsFormProps {
  onSubmit: (items: Item[]) => void;
  initialItems?: Item[];
}

const ITEM_CATEGORIES = [
  'Furniture',
  'Electronics',
  'Kitchen',
  'Boxes',
  'Appliances',
  'Fragile',
  'Outdoor',
  'Office',
  'Artwork',
  'Other'
];

export default function DetailedItemsForm({ onSubmit, initialItems = [] }: DetailedItemsFormProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [currentItem, setCurrentItem] = useState<Item>({
    id: '',
    name: '',
    description: '',
    quantity: 1,
    category: 'Furniture',
    dimensions: '',
    weight: '',
    fragile: false,
    specialHandling: false
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateItem = (item: Item): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!item.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (item.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setCurrentItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddItem = () => {
    const newErrors = validateItem(currentItem);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const newItem = {
      ...currentItem,
      id: editingItemId || Date.now().toString()
    };
    
    if (editingItemId) {
      // Update existing item
      setItems(items.map(item => item.id === editingItemId ? newItem : item));
      setEditingItemId(null);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }
    
    // Reset form
    setCurrentItem({
      id: '',
      name: '',
      description: '',
      quantity: 1,
      category: 'Furniture',
      dimensions: '',
      weight: '',
      fragile: false,
      specialHandling: false
    });
    setErrors({});
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = items.find(item => item.id === id);
    if (itemToEdit) {
      setCurrentItem(itemToEdit);
      setEditingItemId(id);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    
    // If currently editing this item, reset the form
    if (editingItemId === id) {
      setCurrentItem({
        id: '',
        name: '',
        description: '',
        quantity: 1,
        category: 'Furniture',
        dimensions: '',
        weight: '',
        fragile: false,
        specialHandling: false
      });
      setEditingItemId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(items);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Detailed Item Description</CardTitle>
          <CardDescription>
            Add all items you need to move for an accurate quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name*</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentItem.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sofa, TV, Box of books"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={currentItem.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity*</Label>
                <Input 
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleInputChange}
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions (optional)</Label>
                  <Input 
                    id="dimensions"
                    name="dimensions"
                    value={currentItem.dimensions || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 2m x 1m x 0.5m"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (optional)</Label>
                  <Input 
                    id="weight"
                    name="weight"
                    value={currentItem.weight || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 20kg"
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={currentItem.description}
                  onChange={handleInputChange}
                  placeholder="Add any details that might help with the move"
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-4 items-center col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fragile"
                    name="fragile"
                    checked={currentItem.fragile}
                    onChange={(e) => handleCheckboxChange('fragile', e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Label htmlFor="fragile">Fragile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="specialHandling"
                    name="specialHandling"
                    checked={currentItem.specialHandling}
                    onChange={(e) => handleCheckboxChange('specialHandling', e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Label htmlFor="specialHandling">Requires special handling</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1"
              >
                {editingItemId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Update Item
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items List ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-16 text-center">Qty</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Special</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>{item.dimensions || '-'}</TableCell>
                      <TableCell>
                        {(item.fragile || item.specialHandling) ? (
                          <div className="flex flex-col text-xs">
                            {item.fragile && <span>Fragile</span>}
                            {item.specialHandling && <span>Special handling</span>}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditItem(item.id)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} added
            </div>
            <Button onClick={handleSubmit}>
              Generate Accurate Quote
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}