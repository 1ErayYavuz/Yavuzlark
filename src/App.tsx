import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import RateBoard from "./components/RateBoard";
import Calculator from "./components/Calculator";
import AdminPanel from "./components/AdminPanel";
import Footer from "./components/Footer";
import { PriceListUpdate } from "./types";
import { DEFAULT_PRICE_LIST } from "./data/defaultPrices";
import { decodePriceList } from "./utils/share";
import { Sparkles, Coins, RefreshCw, AlertTriangle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"prices" | "calculator" | "admin">("prices");
  const [pricesData, setPricesData] = useState<PriceListUpdate>(DEFAULT_PRICE_LIST);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Theme state: defaults to dark, overrides via local storage if set
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("yavuzlar-theme") as "dark" | "light") || "dark";
  });

  // Sync theme changes to local storage and document structure
  useEffect(() => {
    localStorage.setItem("yavuzlar-theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  // Fetch prices on startup
  const fetchPrices = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // Dynamic Client-side URL Decoder check
    try {
      const hashStr = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      const searchParams = new URLSearchParams(window.location.search);
      const shareVal = hashParams.get("p") || searchParams.get("p") || hashParams.get("data") || searchParams.get("data");
      
      if (shareVal) {
        console.log("Loading custom prices from URL sharing link...");
        const decoded = decodePriceList(shareVal, DEFAULT_PRICE_LIST);
        setPricesData(decoded);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (e) {
      console.error("Error reading URL share parameter:", e);
    }

    try {
      const response = await fetch("/api/prices");
      if (response.ok) {
        const data = await response.json();
        setPricesData(data);
      } else {
        console.warn("Failed to retrieve prices from server. Falling back to default list.");
        setPricesData(DEFAULT_PRICE_LIST);
      }
    } catch (err) {
      console.error("Error fetching rates. Falling back to client-default prices.", err);
      // Fallback so page works beautifully offline or during initial startup
      setPricesData(DEFAULT_PRICE_LIST);
    } finally {
      // Ensure smooth looking transition
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Update handler for admin saving
  const handlePricesSaved = (updatedData: PriceListUpdate) => {
    setPricesData(updatedData);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${
      theme === "dark" 
        ? "dark bg-slate-950 text-slate-200" 
        : "light bg-slate-50 text-slate-900"
    }`}>
      
      {/* Dynamic Nav bar */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
        theme={theme}
        onThemeToggle={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
      />

      {/* Main body viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isLoading ? (
          /* High-end Golden loader spinner with sparkles */
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-900 border-t-amber-500 animate-spin"></div>
              <Sparkles className="w-6 h-6 text-amber-500 absolute top-5 left-5 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-serif text-sm tracking-widest text-amber-500 font-bold uppercase">
                YAVUZLAR KUYUMCULUK
              </p>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Altın fiyatları ve sarraf verileri güvenle yükleniyor...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            
            {/* Main Tabs switching */}
            {activeTab === "prices" && (
              <RateBoard 
                data={pricesData} 
                onRefresh={fetchPrices} 
                isLoading={isLoading} 
              />
            )}

            {activeTab === "calculator" && (
              <Calculator data={pricesData} />
            )}

            {activeTab === "admin" && (
              <AdminPanel 
                currentUpdate={pricesData} 
                onPricesSaved={handlePricesSaved} 
              />
            )}

          </div>
        )}

      </main>

      {/* Modern location & contact footer */}
      <Footer />
    </div>
  );
}
