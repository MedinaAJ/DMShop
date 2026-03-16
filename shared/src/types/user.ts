import type { SoftDeletableEntity } from './common.js';

export interface User extends SoftDeletableEntity {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  idDefaultGroup: number;
  newsletter: boolean;
  lastLoginAt: Date | null;
}

export type UserRole = 'customer' | 'admin' | 'employee';

export interface Address {
  id: number;
  idUser: number;
  idCountry: number;
  idState: number | null;
  alias: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  postcode: string;
  phone: string | null;
  phoneMobile: string | null;
  vatNumber: string | null;
  active: boolean;
}

export interface CustomerGroup {
  id: number;
  name: string;
  reduction: number;
  showPrices: boolean;
}

export interface UserPublic {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
