export interface Customer {
  pk: string;
  sk: string;

  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  created: string;
  updated: string;
  type: 'CUSTOMER';
}