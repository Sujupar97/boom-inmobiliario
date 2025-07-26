export enum PropertyStatus {
  New = "New",
  Contacted = "Contacted",
  VisitScheduled = "Visit Scheduled",
  Negotiating = "Negotiating",
  Discarded = "Discarded",
  Acquired = "Acquired",
}

export enum OwnerStatus {
  NuevoLead = "Nuevo Lead",
  TasacionAgendada = "Tasación Agendada",
  TasacionEntregada = "Tasación Entregada",
  EnSeguimiento = "En Seguimiento",
  Captado = "Captado",
  Descartado = "Descartado",
}

export interface Owner {
  id: string;
  created_at: string;
  nombre_propietario: string;
  email: string | null;
  telefono: string | null;
  direccion_propiedad: string;
  estado: OwnerStatus;
  notas: string | null;
  fecha_visita: string | null;
  valor_tasacion: number | null;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string; // The specific address
  zona: string | null; // The neighborhood/zone for analysis
  link: string;
  imageUrl: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  status: PropertyStatus;
  created_at: string;

  // New fields from scraping
  seller_name: string | null;
  days_on_market: number | null;
  total_area: number | null;
  covered_area: number | null;
  uncovered_area: number | null;
  balcony_area: number | null;
  visualizaciones: number | null;
  
  // Calculated fields
  total_calculated_sqm?: number;
  calculated_price_per_sqm?: number;
  averagePricePerSqm?: number;
  discountPercentage?: number;

  // Fields for proximity analysis
  latitude?: number;
  longitude?: number;
}

export type View = 'dashboard' | 'inventory' | 'opportunities' | 'crm' | 'analysis' | 'metrics' | 'user_management';

export interface Filters {
  location: string; // Changed from locations: string[]
  minPrice: string;
  maxPrice: string;
  status: string;
  showOnlyOpportunities: boolean; // For the advanced filter switch
}


// Types for AI Chat Widget
export type ChatMessage = {
  id: number;
  sender: 'user' | 'ai';
} & ({
  type: 'text';
  text: string;
} | {
  type: 'property_list';
  properties: Pick<Property, 'id' | 'title' | 'location' | 'price'>[];
});

export type ScraperConfig = {
  name: string;
  url: string;
};

export interface ZoneScrapingInfo {
  zona: string;
  url: string;
}

export interface ScrapingPayload {
  source: string;
  zones: ZoneScrapingInfo[];
}

// Auth & User Management Types
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
}