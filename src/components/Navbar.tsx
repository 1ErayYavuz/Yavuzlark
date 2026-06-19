import { Sparkles, Coins, Calculator, UserCheck, MonitorPlay, Clock, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  activeTab: "prices" | "calculator" | "admin";
  onTabChange: (tab: "prices" | "calculator" | "admin") => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Navbar({ activeTab, onTabChange, theme, onThemeToggle }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-md border border-amber-400/20">
              <Sparkles className="w-5.5 h-5.5 text-slate-900" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-widest text-white block">
                YAVUZLAR <span className="text-amber-500">KUYUMCULUK</span>
              </span>
              <span className="font-sans text-[10px] block tracking-[0.25em] text-slate-400 font-bold uppercase leading-none">
                SARRAF • ÇAYCUMA
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange("prices")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "prices"
                  ? "bg-amber-500 text-slate-900 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Coins className="w-4 h-4" />
              GÜNCEL FİYATLAR
            </button>

            <button
              onClick={() => onTabChange("calculator")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "calculator"
                  ? "bg-amber-500 text-slate-900 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calculator className="w-4 h-4" />
              ALTIN HESAPLA
            </button>

            <button
              onClick={() => onTabChange("admin")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-amber-500 text-slate-900 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              YÖNETİM PANELİ
            </button>
          </nav>

          {/* Right Action (Live status + clock + theme toggle) */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={onThemeToggle}
              className="p-1.5 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:text-amber-500 text-slate-400 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
              title={theme === "dark" ? "Aydınlık Tema" : "Karanlık Tema"}
              id="theme-toggle-btn"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500 animate-[spin_8s_linear_infinite]" />
              ) : (
                <Moon className="w-4 h-4 text-amber-600" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-lg border border-slate-800 text-right">
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
                {currentTime || "--:--:--"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold rounded-lg tracking-wider font-sans shrink-0 uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>CANLI</span>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sub-navigation Menu */}
      <div className="md:hidden w-full bg-slate-900/50 border-t border-slate-800 py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-around">
          <button
            onClick={() => onTabChange("prices")}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-bold tracking-wider cursor-pointer ${
              activeTab === "prices" ? "text-amber-500" : "text-slate-500"
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            LİSTE
          </button>
          <button
            onClick={() => onTabChange("calculator")}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-bold tracking-wider cursor-pointer ${
              activeTab === "calculator" ? "text-amber-500" : "text-slate-500"
            }`}
          >
            <Calculator className="w-4.5 h-4.5" />
            HESAPLA
          </button>
          <button
            onClick={() => onTabChange("admin")}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-bold tracking-wider cursor-pointer ${
              activeTab === "admin" ? "text-amber-500" : "text-slate-500"
            }`}
          >
            <UserCheck className="w-4.5 h-4.5" />
            YÖNETİCİ
          </button>
        </div>
      </div>
    </header>
  );
}
