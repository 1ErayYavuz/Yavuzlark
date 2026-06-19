import { useState } from "react";
import { GoldPrice, PriceListUpdate } from "../types";
import { 
  Search, 
  Clock, 
  Coins, 
  ShieldAlert, 
  Info, 
  Sparkles,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";

interface RateBoardProps {
  data: PriceListUpdate;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function RateBoard({ data, onRefresh, isLoading }: RateBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "ayar" | "ziynet" | "gram">("all");
  const [sortField, setSortField] = useState<"name" | "buy" | "sell" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Handle classification of items
  const getCategory = (p: GoldPrice): "ayar" | "ziynet" | "gram" => {
    const name = p.name.toLowerCase();
    if (name.includes("ayar")) return "ayar";
    if (name.includes("çeyrek") || name.includes("tam") || name.includes("reşat") || name.includes("beşli") || name.includes("cumhuriyet")) return "ziynet";
    return "gram";
  };

  const handleSort = (field: "name" | "buy" | "sell") => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to desc for prices
    }
  };

  // Filter and search
  let filteredPrices = data.prices.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    const cat = getCategory(p);
    return matchesSearch && cat === selectedFilter;
  });

  // Sort
  if (sortField) {
    filteredPrices = [...filteredPrices].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortField === "buy") {
        valA = a.buy ?? (sortOrder === "asc" ? Infinity : -Infinity);
        valB = b.buy ?? (sortOrder === "asc" ? Infinity : -Infinity);
      } else if (sortField === "sell") {
        valA = a.sell ?? (sortOrder === "asc" ? Infinity : -Infinity);
        valB = b.sell ?? (sortOrder === "asc" ? Infinity : -Infinity);
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB, "tr") : valB.localeCompare(valA, "tr");
      } else {
        return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }
    });
  }

  // Format currency
  const formatTL = (value: number | null) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div id="rate-board-section" className="w-full space-y-6">
      {/* Header Panel */}
      <div className="glass-panel text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-300">
        {/* Glowing backdrop lines */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/20 text-amber-250 text-xs tracking-widest font-mono rounded-full border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              {data.note || "HAYIRLI İŞLER"}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wider text-white">
              {data.title || "YAVUZLAR KUYUMCULUK"}
            </h1>
            <p className="text-slate-400 font-sans text-sm tracking-wide">
              {data.subtitle || "GÜNLÜK ALTIN FİYAT LİSTESİ"}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 shrink-0 bg-slate-900/60 px-5 py-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-amber-500 font-mono text-sm">
              <Clock className="w-4 h-4" />
              <span>GÜNCELLEME TARİHİ</span>
            </div>
            <span className="text-2xl font-serif font-bold tracking-widest text-white">
              {data.date}
            </span>
          </div>
        </div>
      </div>

      {/* TV Broadcast Alert Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4.5 flex items-start sm:items-center gap-3 shadow-lg shadow-amber-500/5">
        <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-sans font-bold text-xs text-amber-400 tracking-wider uppercase mb-0.5">ÖNEMLİ MÜŞTERİ BİLGİLENDİRME UYARISI</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            Bu ekranda gösterilen fiyatlar piyasa koşullarına göre <strong>anlık olarak değişiklik gösterebilir</strong>. Lütfen işlem yapmadan önce güncel fiyatların doğruluğunu <strong>mağaza yetkililerimize sorarak teyit ediniz</strong>.
          </p>
        </div>
      </div>

      {/* Control Area (Filters, Search, Refresh) */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Altın ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all duration-200 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-nowrap overflow-x-auto w-full lg:w-auto gap-1 py-1 px-1 bg-slate-900/60 rounded-lg scrollbar-none border border-slate-800">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
              selectedFilter === "all"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSelectedFilter("ayar")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
              selectedFilter === "ayar"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ayar Altınlar
          </button>
          <button
            onClick={() => setSelectedFilter("ziynet")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
              selectedFilter === "ziynet"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sikke & Ziynet
          </button>
          <button
            onClick={() => setSelectedFilter("gram")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
              selectedFilter === "gram"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Gram & Külçe
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-500 hover:text-amber-400 border border-slate-800 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          SAYFAYI YENİLE
        </button>
      </div>

      {/* Main Board Table */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 font-serif text-sm tracking-widest text-amber-500">
                <th 
                  onClick={() => handleSort("name")}
                  className="py-5 px-6 font-semibold cursor-pointer select-none hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    ALTIN CİNSİ
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("sell")}
                  className="py-5 px-6 font-semibold cursor-pointer select-none text-right hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    SATIŞ FİYATI (TL)
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("buy")}
                  className="py-5 px-6 font-semibold cursor-pointer select-none text-right hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    ALIŞ FİYATI (TL)
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950 font-sans">
              {filteredPrices.length > 0 ? (
                filteredPrices.map((p, idx) => {
                  const formattedSell = formatTL(p.sell);
                  const formattedBuy = formatTL(p.buy);

                  return (
                    <tr 
                      key={p.id}
                      className="group bg-slate-900/10 hover:bg-slate-800/10 transition-all duration-200"
                    >
                      {/* Name */}
                      <td className="py-4.5 px-6 text-sm font-semibold text-slate-200 group-hover:text-amber-500 transition-colors">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500/70 shrink-0" />
                          <span>{p.name}</span>
                          {p.name.includes("24 Ayar") && (
                            <span className="hidden md:inline px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-mono tracking-wider font-semibold rounded uppercase">
                              Saf Altın
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sell */}
                      <td className="py-4.5 px-6 text-right font-mono text-[15px] font-bold">
                        {p.sell !== null ? (
                          <span className="text-slate-100 bg-emerald-500/5 group-hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 transition-all">
                            {formattedSell}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic font-sans font-normal border border-slate-800 bg-slate-950/40 px-2 py-1 rounded">
                            Boş (Sadece Alış)
                          </span>
                        )}
                      </td>

                      {/* Buy */}
                      <td className="py-4.5 px-6 text-right font-mono text-[15px] font-bold">
                        {p.buy !== null ? (
                          <span className="text-slate-100 bg-amber-500/5 group-hover:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/10 transition-all">
                            {formattedBuy}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic font-sans font-normal border border-slate-800 bg-slate-950/40 px-2 py-1 rounded">
                            Boş (Sadece Satış)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 px-6 text-center text-slate-500 font-sans text-sm">
                    <ShieldAlert className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                    Aradığınız kriterlere uygun altın fiyatı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Info Cards / Gold Investment FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl space-y-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-3 text-amber-550">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Info className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-serif font-bold text-sm text-white tracking-wide">YASAL TAVSİYE UYARISI</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Bu ekranda görüntülenen alış ve satış fiyatları, <b>Çaycuma Kuyumcular Derneği</b> tarafından sunulan perakende tavsiye edilen günlük listelerdir. Piyasa koşullarına göre nihai fiyatlar dükkanımızda değişiklik gösterebilir.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-3 text-amber-550">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-serif font-bold text-sm text-white tracking-wide">ATATÜRK & REŞAT AYRIMI</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Cumhuriyet (Atatürk) ve Reşat altınlar, kuyum piyasasında basım tarihlerine ve ağırlıklarına göre fark gösterir. Ziynet Çeyrek seçerken "yeni" ve "eski" tarih durumu fiyatta perakende alım-satım farkı oluşturmaktadır.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-3 shadow-md border border-slate-800 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 text-amber-550">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-serif font-bold text-sm text-white tracking-wide">HAFTALIK ÖZEL DESTEK</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Altın bozdurma işlemleriniz, alyans ve takı alışverişleriniz için dükkanımızda en samimi ve cazip oranları sunuyoruz. Sizleri Çaycuma merkez mağazamıza bir kahve içmeye bekleriz.
          </p>
        </div>
      </div>
    </div>
  );
}
