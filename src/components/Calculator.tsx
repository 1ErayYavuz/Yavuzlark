import { useState, useEffect } from "react";
import { PriceListUpdate, GoldPrice } from "../types";
import { Calculator as CalcIcon, RefreshCw, ShoppingCart, ArrowRightLeft, Sparkles, Scale, Info } from "lucide-react";

interface CalculatorProps {
  data: PriceListUpdate;
}

export default function Calculator({ data }: CalculatorProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [calcMode, setCalcMode] = useState<"buy" | "sell">("sell"); // "sell" means client gets it (store's selling price), "buy" means client cashes in (store's buying price)
  const [result, setResult] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default to first product on mount or data change
  useEffect(() => {
    if (data.prices && data.prices.length > 0) {
      setSelectedProductId(data.prices[0].id);
    }
  }, [data]);

  const selectedProduct = data.prices.find(p => p.id === selectedProductId);

  // Recalculate whenever inputs change
  useEffect(() => {
    if (!selectedProduct || amount === "" || amount <= 0) {
      setResult(null);
      setErrorMsg(null);
      return;
    }

    if (calcMode === "sell") {
      // Store selling to user (Satış price)
      if (selectedProduct.sell === null || selectedProduct.sell === undefined) {
        setResult(null);
        setErrorMsg(`Maalesef "${selectedProduct.name}" ürünü için şu anda güncel bir satış fiyatı belirtilmemiştir.`);
      } else {
        setResult(selectedProduct.sell * amount);
        setErrorMsg(null);
      }
    } else {
      // Store buying from user (Alış price)
      if (selectedProduct.buy === null || selectedProduct.buy === undefined) {
        setResult(null);
        setErrorMsg(`Maalesef "${selectedProduct.name}" ürünü için şu anda güncel bir bozma/alış fiyatı belirtilmemiştir.`);
      } else {
        setResult(selectedProduct.buy * amount);
        setErrorMsg(null);
      }
    }
  }, [amount, selectedProductId, calcMode, selectedProduct]);

  const handleReset = () => {
    setAmount("");
    setResult(null);
    setErrorMsg(null);
  };

  const formatTL = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(val);
  };

  return (
    <div id="calculator-section" className="w-full max-w-3xl mx-auto">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden text-slate-150 border border-slate-800">
        {/* Shiny gold ambient graphic */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <CalcIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                HESAPLAMA MOTORU & SARRAF HESABI
              </h2>
              <p className="text-xs text-slate-400 font-sans tracking-wide">
                Anlık güncel kuyumcu derneği tarifeleriyle takı veya birikim hesabı yapın
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="space-y-4">
              {/* Calculator Mode Toggles */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Yapılacak İşlem Teması
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900">
                  <button
                    type="button"
                    onClick={() => setCalcMode("sell")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      calcMode === "sell"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Altın Alacağım
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode("buy")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      calcMode === "buy"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Altın Bozduracağım
                  </button>
                </div>
              </div>

              {/* Product Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Altın / Gümüş Cinsi
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-550 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 font-sans cursor-pointer"
                >
                  {data.prices.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.name} {p.sell !== null ? `(S: ${p.sell} TL)` : ""} {p.buy !== null ? `(A: ${p.buy} TL)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity / Weight Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                  Miktar (Gram / Adet / Çift)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    placeholder="Örnek: 1, 10, 2.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-16 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 font-sans"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-1.5 text-slate-550 pointer-events-none text-xs font-mono">
                    <Scale className="w-3.5 h-3.5 text-amber-500/60" />
                    <span>BİRİM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Side */}
            <div className="flex flex-col justify-between bg-slate-950/80 p-5 rounded-xl border border-slate-900 relative">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  HESAP DETAYI
                </span>

                {/* Display Chosen Rate Details */}
                {selectedProduct && (
                  <div className="border-b border-slate-800/80 pb-3 mt-1.5 space-y-1.5">
                    <h3 className="text-slate-200 text-sm font-semibold tracking-wide font-sans">{selectedProduct.name}</h3>
                    <div className="flex gap-4 text-xs font-mono">
                      {selectedProduct.sell !== null && (
                        <div>
                          <span className="text-slate-500 mr-1">Satış:</span>
                          <span className="text-green-400 font-bold">{selectedProduct.sell} TL</span>
                        </div>
                      )}
                      {selectedProduct.buy !== null && (
                        <div>
                          <span className="text-slate-500 mr-1">Bozma / Alış:</span>
                          <span className="text-amber-500 font-bold">{selectedProduct.buy} TL</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main calculation Display */}
                {result !== null ? (
                  <div className="space-y-1 py-2">
                    <span className="text-slate-400 text-xs font-normal font-sans block">Tahmini Toplam Tutar</span>
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-amber-500 tracking-wide block">
                      {formatTL(result)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans block italic leading-none pt-1">
                      * Hesaplamalar vergiler ve ek işçilik maliyetlerini kapsamamaktadır.
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="p-3 bg-red-950/40 border border-red-900/30 text-xs text-red-400 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 space-y-2">
                    <p className="text-xs font-sans">Lütfen miktar giriniz</p>
                    <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                      Miktar girdikten sonra işlem tipine göre alacağınız veya bozduracağınız miktarın Türk Lirası karşılığı anında gösterilecektir.
                    </p>
                  </div>
                )}
              </div>

              {/* Reset Control */}
              <button
                type="button"
                onClick={handleReset}
                disabled={amount === ""}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 disabled:cursor-not-allowed hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Hesaplayıcıyı Temizle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
