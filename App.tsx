

import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { ScrapingProcessModal } from './components/ScrapingProcessModal';
import { AIChatWidget } from './components/AIChatWidget';
import { Property, PropertyStatus, View, Filters, ScraperConfig, ScrapingPayload, ZoneScrapingInfo, UserProfile, Role } from './types';
import { fetchProperties, updatePropertyStatus as updateStatusInDb } from './services/propertyService';
import { isSupabaseConfigured, supabase } from './supabase';
import { SupabaseConfigScreen } from './components/SupabaseConfigScreen';
import { Sidebar } from './components/Sidebar';
import { ComparativeAnalysisView } from './components/ComparativeAnalysisView';
import { StrategyView } from './components/StrategyView';
import { ZoneSelectionModal } from './components/ScraperOptionsModal';
import { slugify } from './utils/slugify';
import { CRMView } from './components/CRMView';
import { AddToCRMModal } from './components/AddToCRMModal';
import { MetricsView } from './components/MetricsView';
import { Login } from './components/Login';
import { UserManagementView } from './components/UserManagementView';
import type { Session, User, PostgrestError } from '@supabase/supabase-js';

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setSession(session);
          
          if (session?.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const profile = profileData as unknown as ({ role: Role } | null);

            // Explicitly check for and throw errors to be handled by the catch block.
            if (profileError) throw profileError;
            if (!profile) throw new Error(`Profile not found for authenticated user: ${session.user.email}`);
            
            // If everything is successful, set the user.
            setUser({ id: session.user.id, email: session.user.email!, role: profile.role });
          } else {
            // If there's no session, there's no user.
            setUser(null);
          }
        } catch (error: any) {
          console.error("--- ERROR DE AUTENTICACIÓN ---");
          console.error("No se pudo obtener el perfil del usuario. Causa más probable: la política de Row Level Security (RLS) de Supabase es incorrecta (causando un timeout o un error) o el perfil del usuario no existe en la tabla 'profiles'.");
          console.error("Error detallado:", error);

          setUser(null);
          setSession(null);
          if (supabase) {
            await supabase.auth.signOut().catch(e => console.error("Error during cleanup sign out:", e));
          }
        } finally {
          // IMPORTANT: This ensures the loading spinner is always removed,
          // even if an error occurs. This prevents the infinite loading screen.
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- APP CONTENT ---
const initialFilters: Filters = {
  location: 'All',
  minPrice: '',
  maxPrice: '',
  status: 'All',
  showOnlyOpportunities: false,
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingPayload, setScrapingPayload] = useState<ScrapingPayload | null>(null);

  const [isZoneSelectionModalOpen, setIsZoneSelectionModalOpen] = useState(false);
  const [activeScraperConfig, setActiveScraperConfig] = useState<ScraperConfig | null>(null);

  const [activeView, setActiveView] = useState<View>('dashboard');

  const [propertyForCrm, setPropertyForCrm] = useState<Property | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProperties = await fetchProperties();
      setProperties(fetchedProperties);
    } catch (err) {
      setError('No se pudieron cargar las propiedades desde la base de datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadProperties();
    } else {
      setLoading(false);
    }
  }, [loadProperties]);
  
  const opportunityData = useMemo(() => {
    const propertiesWithCalculatedMetrics: Property[] = properties.map(p => {
      const { covered_area, uncovered_area, balcony_area, price } = p;
      const c_area = covered_area || 0;
      const u_area = uncovered_area || 0;
      const b_area = balcony_area || 0;
      const total_area = c_area + u_area + b_area;
      const total_calculated_sqm = c_area + (u_area * 0.5) + (b_area * 0.5);
      const calculated_price_per_sqm = (price > 0 && total_calculated_sqm > 0) ? price / total_calculated_sqm : 0;
      return { ...p, total_area, total_calculated_sqm, calculated_price_per_sqm };
    });

    const zoneStats = propertiesWithCalculatedMetrics.reduce((acc, p) => {
      if (p.zona && p.calculated_price_per_sqm && p.calculated_price_per_sqm > 0) {
        if (!acc[p.zona]) acc[p.zona] = { prices: [], count: 0 };
        acc[p.zona].prices.push(p.calculated_price_per_sqm);
        acc[p.zona].count++;
      }
      return acc;
    }, {} as Record<string, { prices: number[], count: number }>);

    const zoneAverages = Object.entries(zoneStats)
      .filter(([_, stats]) => stats.count >= 2)
      .reduce((acc, [zona, stats]) => {
        acc[zona] = stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length;
        return acc;
      }, {} as Record<string, number>);

    return propertiesWithCalculatedMetrics.map(p => {
      if(p.zona){
        const averagePricePerSqm = zoneAverages[p.zona];
        if (averagePricePerSqm && p.calculated_price_per_sqm && p.calculated_price_per_sqm > 0) {
          const discountPercentage = ((p.calculated_price_per_sqm - averagePricePerSqm) / averagePricePerSqm) * 100;
          return { ...p, averagePricePerSqm, discountPercentage };
        }
      }
      return p;
    });
  }, [properties]);

  const filteredProperties = useMemo(() => {
    let baseProperties = [...opportunityData];
    const isOpportunityFilterActive = activeView === 'opportunities' || filters.showOnlyOpportunities;
    if (isOpportunityFilterActive) {
        baseProperties = baseProperties.filter(p => p.discountPercentage !== undefined && p.discountPercentage < 0);
    }
    return baseProperties.filter(p => {
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : -Infinity;
        const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (filters.location !== 'All' && p.zona !== filters.location) return false;
        if (filters.status !== 'All' && p.status !== filters.status) return false;
        return true;
    });
  }, [opportunityData, filters, activeView]);

  const handleStartScraping = (scraper: ScraperConfig) => {
    setActiveScraperConfig(scraper);
    setIsZoneSelectionModalOpen(true);
  };
  
  const handleExecuteScraping = (selectedZones: string[]) => {
    setIsZoneSelectionModalOpen(false);
    if (!activeScraperConfig) return;
    const zones: ZoneScrapingInfo[] = selectedZones.map(zone => ({
      zona: zone,
      url: `https://www.zonaprop.com.ar/departamentos-venta-${slugify(zone)}.html`
    }));
    setScrapingPayload({
      source: activeScraperConfig.name,
      zones: zones.length > 0 ? zones : [{ zona: 'Default', url: activeScraperConfig.url }],
    });
    setIsScraping(true);
  };

  const handleScrapingComplete = useCallback(() => {
    setIsScraping(false);
    setScrapingPayload(null);
    setActiveScraperConfig(null);
    setTimeout(() => loadProperties(), 1000); 
  }, [loadProperties]);

  const handleSelectProperty = (property: Property) => setSelectedProperty(property);
  const handleCloseModal = () => setSelectedProperty(null);
  
  const handleInitiateAddToCRM = (property: Property) => {
    setSelectedProperty(null);
    setPropertyForCrm(property);
  };

  const handleUpdatePropertyStatus = useCallback(async (propertyId: string, status: PropertyStatus) => {
    const originalProperties = properties;
    setProperties(prev => prev.map(p => (p.id === propertyId ? { ...p, status } : p)));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? {...prev, status} : null);
    }
    try {
      await updateStatusInDb(propertyId, status);
    } catch (error) {
      setProperties(originalProperties);
      alert("Error al actualizar el estado.");
    }
  }, [properties, selectedProperty]);

  const renderCurrentView = () => {
    switch(activeView) {
      case 'user_management':
        return <UserManagementView />;
      case 'metrics':
        return <MetricsView properties={opportunityData} />;
      case 'analysis':
        return <ComparativeAnalysisView properties={opportunityData} onSelectProperty={handleSelectProperty}/>;
      case 'crm':
        return <CRMView />;
      case 'inventory':
      case 'opportunities':
         return (
          <Dashboard
            properties={filteredProperties}
            allProperties={opportunityData}
            onSelectProperty={handleSelectProperty}
            filters={filters}
            onFilterChange={setFilters}
            onStartScraping={handleStartScraping}
            loading={loading}
            initialFilters={initialFilters}
            onUpdateStatus={handleUpdatePropertyStatus}
            activeView={activeView}
          />
        );
      case 'dashboard':
      default:
        return <StrategyView properties={opportunityData} />;
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isSupabaseConfigured) return <SupabaseConfigScreen />;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeView={activeView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
           {error && <div className="bg-red-500/20 text-red-700 p-3 rounded-md mb-4 text-center">{error}</div>}
           {renderCurrentView()}
        </main>
      </div>
      
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdatePropertyStatus}
          onAddToCRM={handleInitiateAddToCRM}
        />
      )}
      {isScraping && scrapingPayload && activeScraperConfig && (
        <ScrapingProcessModal
          webhookUrl={activeScraperConfig.url}
          payload={scrapingPayload}
          onComplete={handleScrapingComplete}
        />
      )}
      {isZoneSelectionModalOpen && activeScraperConfig && (
        <ZoneSelectionModal
          isOpen={isZoneSelectionModalOpen}
          onClose={() => setIsZoneSelectionModalOpen(false)}
          onExecute={handleExecuteScraping}
        />
      )}
      {propertyForCrm && (
        <AddToCRMModal
          property={propertyForCrm}
          onClose={() => setPropertyForCrm(null)}
          onSuccess={() => {
            setPropertyForCrm(null);
             if (activeView === 'crm') {
                window.location.reload();
            }
          }}
        />
      )}
      <AIChatWidget properties={opportunityData} onSelectProperty={handleSelectProperty} />
    </div>
  );
};

// --- MAIN APP WRAPPER ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
