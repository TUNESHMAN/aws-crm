export interface CreateNote {
  title: string;
  content: string;
  entityType: 'Contact' | 'Lead' | 'Opportunity' | 'Account';
  isPrivate?: boolean;
}