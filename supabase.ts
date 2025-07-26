

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      propiedades: {
        Row: {
          id: string;
          created_at: string;
          titulo: string;
          precio: number;
          moneda: string;
          ubicacion: string;
          zona: string | null;
          link: string;
          image_url: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          description: string | null;
          status: string;
          seller_name: string | null;
          dias_en_mercado: number | null;
          total_area: number | null;
          covered_area: number | null;
          uncovered_area: number | null;
          balcony_area: number | null;
          visualizaciones: number | null;
          latitude: number | null;
          longitude: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          titulo: string;
          precio: number;
          moneda: string;
          ubicacion: string;
          zona?: string | null;
          link: string;
          image_url?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          description: string | null;
          status: string;
          seller_name?: string | null;
          dias_en_mercado?: number | null;
          total_area?: number | null;
          covered_area?: number | null;
          uncovered_area?: number | null;
          balcony_area?: number | null;
          visualizaciones?: number | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          titulo?: string;
          precio?: number;
          moneda?: string;
          ubicacion?: string;
          zona?: string | null;
          link?: string;
          image_url?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          description?: string | null;
          status?: string;
          seller_name?: string | null;
          dias_en_mercado?: number | null;
          total_area?: number | null;
          covered_area?: number | null;
          uncovered_area?: number | null;
          balcony_area?: number | null;
          visualizaciones?: number | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      propietarios: {
        Row: {
          id: string;
          created_at: string;
          nombre_propietario: string;
          email: string | null;
          telefono: string | null;
          direccion_propiedad: string;
          estado: string;
          notas: string | null;
          fecha_visita: string | null;
          valor_tasacion: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nombre_propietario: string;
          email?: string | null;
          telefono?: string | null;
          direccion_propiedad: string;
          estado?: string;
          notas?: string | null;
          fecha_visita?: string | null;
          valor_tasacion?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          nombre_propietario?: string;
          email?: string | null;
          telefono?: string | null;
          direccion_propiedad?: string;
          estado?: string;
          notas?: string | null;
          fecha_visita?: string | null;
          valor_tasacion?: number | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          updated_at: string | null;
          email: string;
        };
        Insert: {
          id: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          updated_at?: string | null;
          email: string;
        };
        Update: {
          id?: string;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          updated_at?: string | null;
          email?: string;
        };
      };
    };
    Views: {
      // empty
    };
    Functions: {
      // empty
    };
    Enums: {
      // empty
    };
    CompositeTypes: {
      // empty
    };
  };
}


const supabaseUrl: string = 'https://lwcsouyknwbxeexektyr.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3NvdXlrbndieGVleGVrdHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU1MTgsImV4cCI6MjA2ODg1MTUxOH0.HSejOE04B7PXnXYF8sOO8MFVD52hS4u7cz06IqicBmw';

const createSupabaseClient = (): SupabaseClient<Database> | null => {
  const isConfigured = supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';
  
  if (isConfigured) {
    try {
      return createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      return null;
    }
  }
  
  console.warn("Supabase URL and Anon Key are not configured. Please update supabase.ts");
  return null;
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = !!supabase;