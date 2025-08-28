export interface Note {
  pk: string;
  sk: string;
  id: string;
  title: string;
  content: string;
  entityType: "Contact" | "Lead" | "Opportunity" | "Account";
  isPrivate?: boolean;
  created: string;
  updated: string;
  type: "NOTE";
  customerId: string;
  attachmentKey?: string;
  filename?: string;
  summary: string;
}
