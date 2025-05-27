// API Types
export interface QuoteRequest {
  collectionAddress: string;
  deliveryAddress: string;
  moveDate: Date;
  vanSize: VanSize;
}

export interface QuoteResponse {
  price: number;
  distance: number;
  currency: string;
  estimatedTime: string;
}

export interface DriverApplication {
  name: string;
  email: string;
  phone: string;
  experience: string;
  vanType: VanSize;
  location: string;
  licenseDocument: File;
  insuranceDocument: File;
  liabilityDocument: File;
  vehiclePhoto: File;
}

// Shared Types
export type VanSize = "small" | "medium" | "large" | "luton";

export interface Van {
  id: VanSize;
  title: string;
  description: string;
  loadSpace: string;
  maxLength: string;
  payload: string;
  bestFor: string;
  priceMultiplier: number;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface Area {
  id: number;
  name: string;
}
