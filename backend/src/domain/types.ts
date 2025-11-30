export type VehicleStatus = "stock" | "preparation" | "sold";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  role?: "admin" | "seller";
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  merchantId: string;
  make: string;
  model: string;
  year: number;
  purchasePrice: number; // in cents
  salePrice?: number; // in cents
  mileage: number;
  status: VehicleStatus;
  mainPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cost {
  id: string;
  vehicleId: string;
  label: string;
  amount: number; // in cents
  category: "transport" | "repair" | "admin" | "other";
  incurredAt: Date;
  createdAt: Date;
}

export interface Photo {
  id: string;
  vehicleId: string;
  url: string;
  position: number;
  createdAt: Date;
}
