import React, { useState, useRef } from "react";
import { PriceListUpdate, GoldPrice } from "../types";
import { encodePriceList } from "../utils/share";
import { 
  Lock, 
  Unlock, 
  Save, 
  UploadCloud, 
  Trash2, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  UserCheck, 
  ChevronRight, 
  Info,
  Calendar,
  KeyRound,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";

interface AdminPanelProps {
  currentUpdate: PriceListUpdate;
  onPricesSaved: (updatedData: PriceListUpdate) => void;
}

export default function AdminPanel({ currentUpdate, onPricesSaved }: AdminPanelProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Managing prices states
  const [formData, setFormData] = useState<PriceListUpdate>({ ...currentUpdate });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // AI OCR States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState("");
  const [aiResultPreview, setAiResultPreview] = useState<PriceListUpdate | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<string>("Görüntü aktarılıyor...");

  // Password / PIN Change states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinChangeStatus, setPinChangeStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication logic
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        setAuthError("");
        // Load latest fresh copy of data once authenticated
        const freshRes = await fetch("/api/prices");
        const freshData = await freshRes.json();
        setFormData(freshData);
      } else {
        setAuthError("Girdiğiniz yönetici şifresi / PIN hatalıdır. Lütfen sırlar panelini kontrol edin ya da varsayılan şifre olan '1234' değerini deneyin.");
      }
    } catch (err) {
      setAuthError("Sunucu ile bağlantı kurulamadı. Lütfen sunucu durumunu kontrol edin.");
    }
  };

  // Log out helper
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput("");
    setAiResultPreview(null);
    setSaveStatus(null);
  };

  // Manual input updates helpers
  const handleMetadataChange = (field: keyof Omit<PriceListUpdate, "prices">, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceChange = (id: string, field: "buy" | "sell", value: string) => {
    const numericValue = value === "" ? null : parseFloat(value);
    
    setFormData(prev => {
      const updatedPrices = prev.prices.map(item => {
        if (item.id === id) {
          return {
            ...item,
            [field]: isNaN(numericValue as number) ? null : numericValue
          };
        }
        return item;
      });
      
      return {
        ...prev,
        prices: updatedPrices
      };
    });
  };

  const handleClearField = (id: string, field: "buy" | "sell") => {
    setFormData(prev => {
      const updatedPrices = prev.prices.map(item => {
        if (item.id === id) {
          return {
            ...item,
            [field]: null
          };
        }
        return item;
      });
      
      return {
        ...prev,
        prices: updatedPrices
      };
    });
  };

  // Save changes to API
  const handleSavePrices = async (dataToSave: PriceListUpdate = formData) => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pinInput,
          data: dataToSave
        })
      });
      
      const resData = await res.json();
      if (res.ok && resData.success) {
        setSaveStatus({ success: true, msg: "Tüm fiyatlar ve başlıklar başarıyla veri tabanına kaydedildi!" });
        onPricesSaved(resData.data);
        setFormData(resData.data);
        setAiResultPreview(null); // Clear comparison display after save
      } else {
        const errorMsg = resData.error ? `${resData.error} (${resData.details || ''})` : "Fiyatlar kaydedilemedi.";
        setSaveStatus({ success: false, msg: errorMsg });
      }
    } catch (err: any) {
      setSaveStatus({ success: false, msg: "Fiyatlar kaydedilirken sunucu bağlantı hatası oluştu." });
    } finally {
      setIsSaving(false);
    }
  };

  // Client-side lightweight image compressor to decrease payload size before reaching server/proxy constraints (e.g. 413 Payload Too Large)
  const compressImage = (base64Str: string, originalMime: string, maxDimension = 1600, quality = 0.75): Promise<{ base64: string; mime: string }> => {
    return new Promise((resolve) => {
      // Create HTML image element from base64
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Resize if exceeding maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ base64: base64Str, mime: originalMime });
            return;
          }

          // Force white background (handles transparent images nicely)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Standardize on image/jpeg for powerful compression output
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve({ base64: compressed, mime: "image/jpeg" });
        } catch (e) {
          console.error("Canvas compression failed, sending original.", e);
          resolve({ base64: base64Str, mime: originalMime });
        }
      };
      img.onerror = () => {
        resolve({ base64: base64Str, mime: originalMime });
      };
      img.src = base64Str;
    });
  };

  // Upload and analyze table using Gemini
  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    setIsAnalyzing(true);
    setAiAnalysisError("");
    setAiResultPreview(null);
    setAnalysisSteps("Fotoğraf yükleniyor ve hazırlanıyor...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target?.result as string;
      const originalMime = file.type;

      try {
        setAnalysisSteps("Çözünürlük optimize ediliyor ve görsel sıkıştırılıyor...");
        const { base64: base64Data, mime: mimeType } = await compressImage(originalBase64, originalMime);

        setAnalysisSteps("Çaycuma Kuyumcular Derneği tablosundaki satırlar taranıyor...");
        
        // Artificial steps for outstanding UX
        const step1Timer = setTimeout(() => setAnalysisSteps("Yapay Zeka (Gemini AI) sütunları hizalıyor: SATIŞ vs ALIŞ..."), 2000);
        const step2Timer = setTimeout(() => setAnalysisSteps("Fiyat hanelerindeki noktalı küsuratlar sayılara dönüştürülüyor..."), 4000);
        const step3Timer = setTimeout(() => setAnalysisSteps("Tarih ve Başlık bilgileri ayıklanıyor..."), 6000);

        const res = await fetch("/api/prices/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin: pinInput,
            base64Image: base64Data,
            mimeType: mimeType
          })
        });

        // Clean up the timers
        clearTimeout(step1Timer);
        clearTimeout(step2Timer);
        clearTimeout(step3Timer);

        let outcome: any = {};
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          outcome = await res.json();
        } else {
          const textError = await res.text();
          console.error("Server raw error response:", textError);
          if (res.status === 413) {
            throw new Error("Fotoğraf dosyasının boyutu sunucu limitini aştı. Lütfen daha küçük veya sıkıştırılmış bir görsel yükleyin.");
          } else if (textError.includes("Starting Server") || textError.includes("application starts") || textError.includes("wait while your application")) {
            throw new Error("Sunucu şu anda güncelleniyor ve yeniden başlatılıyor. Lütfen 5-10 saniye bekledikten sonra fotoğrafı tekrar yükleyin.");
          } else {
            throw new Error(`Yapay zeka analiz servisine ulaşılamadı (Hata Kodu: ${res.status}). Lütfen daha sonra tekrar deneyin.`);
          }
        }

        if (res.ok && outcome.success) {
          setAiResultPreview(outcome.payload);
          setAnalysisSteps("");
        } else {
          setAiAnalysisError(outcome.error || "Görsel çözümlenirken yapay zeka servisinde bir sorun oluştu.");
        }
      } catch (err: any) {
        setAiAnalysisError(err.message || "Yapay Zeka analizi sunucu bağlantısı hatası nedeniyle tamamlanamadı.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dropzone drag-and-drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImageFile(file);
    }
  };

  // Apply AI findings as current form data
  const handleApplyAiData = () => {
    if (aiResultPreview) {
      setFormData({ ...aiResultPreview });
      setAiResultPreview(null);
      setSaveStatus({ success: true, msg: "Yapay zekanın çıkardığı fiyatlar aşağıdaki kontrol tablosuna başarıyla aktarıldı. Kaydetmek için 'Değişiklikleri Kaydet' butonuna basınız." });
    }
  };

  // Update PIN Change
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin) return;
    setPinChangeStatus(null);

    try {
      const res = await fetch("/api/auth/update-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPinChangeStatus({ success: true, msg: "Yönetici şifreniz başarıyla değiştirildi! Yeni şifreniz aktif olmuştur." });
        setPinInput(newPin); // automatically update current login session pin to prevent decoupling
        setCurrentPin("");
        setNewPin("");
      } else {
        setPinChangeStatus({ success: false, msg: data.error || "Şifre değiştirme başarısız oldu." });
      }
    } catch (err) {
      setPinChangeStatus({ success: false, msg: "Şifre güncellenirken sunucu bağlantı hatası oluştu." });
    }
  };

  // Unauthenticated Display
  if (!isAuthenticated) {
    return (
      <div id="admin-login-lockscreen" className="w-full max-w-md mx-auto py-12 animate-fade-in">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden text-slate-100 border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wider uppercase">Yönetici Girişi</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto font-sans leading-relaxed">
                Fiyat tablolarını elle girmek, güncellemek veya fotoğraf ile yapay zeka entegrasyonundan otomatik çektirmek için parolanızı girin.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4 font-sans">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  YÖNETİCİ ŞİFRESİ (PIN KODU)
                </label>
                <input
                  type="password"
                  placeholder="PIN Kodu Girin (Varsayılan: 1234)"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 rounded-lg p-3 text-center text-sm tracking-widest font-mono text-slate-200 placeholder-slate-700"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-950/40 border border-red-900/30 text-xs text-red-400 rounded-lg flex items-start gap-2 text-left font-sans leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold tracking-widest rounded-lg cursor-pointer transform hover:-translate-y-0.5 transition duration-150 uppercase"
              >
                Giriş Yetkisini Al
              </button>
            </form>

            <div className="pt-2 text-[10px] text-slate-500 font-sans flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-500" />
              <span>Cihaz şifre sıfırlaması için lütfen sistem ayarlarınızı kontrol edin.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard view
  return (
    <div id="admin-authenticated-panel" className="w-full space-y-8 animate-fade-in">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 font-sans">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white">YÖNETİCİ KONTROL PANELİ</h1>
            <p className="text-xs text-slate-400">Yetkili Oturum Açık • Manuel & Yapay Zeka Güncellemesi Aktif</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 text-xs tracking-wider border border-slate-800 hover:border-red-900/30 rounded-lg cursor-pointer transition font-semibold"
        >
          OTURUMU KAPAT
        </button>
      </div>

      {/* Grid of upload & change code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Yapay Zeka ile Otomatik Fotoğraf Okuma (Gold OCR) (lg:col-span-4) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Sparkles className="w-5 h-5 text-amber-550" />
                <h2 className="font-serif font-bold text-white text-sm tracking-wide">YAPAY ZEKA (GEMINI AI) İLE ELEKTRONİK OKUMA</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Kuyumcular derneğinden veya panodan aldığınız basılı tavsiye fiyat listesinin fotoğrafını yükleyin. 
                Gemini AI resimdeki tabloları, rakamları ve boşlukları tek seferde tarayıp fiyatları otomatik günceller.
              </p>

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none transition-all duration-200 ${
                  isAnalyzing 
                    ? "border-amber-500 bg-amber-500/5 animate-pulse" 
                    : "border-slate-800 hover:border-amber-500/30 hover:bg-slate-900/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUploaded}
                  accept="image/*"
                  className="hidden"
                />
                
                {isAnalyzing ? (
                  <div className="space-y-4 font-sans">
                    <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-400 font-mono tracking-wide">TABLO ANALİZ EDİLİYOR...</p>
                      <p className="text-[11px] text-slate-400 italic max-w-[240px] mx-auto leading-relaxed">
                        {analysisSteps}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans">
                    <UploadCloud className="w-10 h-10 text-amber-500/70 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-300">Resim Sürükleyin veya Dosya Seçin</p>
                      <p className="text-[10px] text-slate-500 leading-none">JPEG, PNG formatları (Maks. 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Analysis Errors */}
              {aiAnalysisError && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/30 text-xs text-red-400 rounded-lg flex items-start gap-2 leading-relaxed font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{aiAnalysisError}</span>
                </div>
              )}

              {/* AI Success / Preview Block */}
              {aiResultPreview && (
                <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-4 animate-scale-up font-sans">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/20">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-400 tracking-wider">OKUMA TAMAMLANDI!</h4>
                      <p className="text-[10px] text-slate-400">Yapay zeka resimdeki {aiResultPreview.prices.length} kalemi başarıyla ayıkladı.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded border border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarih Bilgisi:</span>
                      <span className="text-amber-400 font-bold">{aiResultPreview.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Çıkarılan Başlık:</span>
                      <span className="text-slate-300 font-semibold text-right truncate max-w-[150px]" title={aiResultPreview.title}>{aiResultPreview.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Slogan / Not:</span>
                      <span className="text-green-400 italic font-semibold">{aiResultPreview.note}</span>
                    </div>
                  </div>

                  {/* Compare Preview & Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApplyAiData}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Yükle & Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiResultPreview(null)}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs rounded-lg cursor-pointer border border-slate-800 hover:text-white"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sub-panel Change Password / PIN */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-white text-sm tracking-wide">YÖNETİCİ ŞİFRE (PIN) DEĞİŞTİR</h3>
            </div>
            
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">Mevcut Şifre</label>
                  <input
                    type="password"
                    placeholder="Mevcut PIN"
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/30 focus:outline-none p-2 rounded text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">Yeni Şifre</label>
                  <input
                    type="password"
                    placeholder="Yeni PIN"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/30 focus:outline-none p-2 rounded text-xs text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              {pinChangeStatus && (
                <div className={`p-2.5 rounded text-xs border ${
                  pinChangeStatus.success 
                    ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                    : "bg-red-950/20 border-red-900/30 text-red-400"
                }`}>
                  {pinChangeStatus.msg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white text-xs font-semibold rounded cursor-pointer border border-slate-800 hover:border-slate-700 transition"
              >
                Şifreyi Güncelle
              </button>
            </form>
          </div>

          {/* Canlı Fiyat Listesi Paylaşım Bağlantısı Oluşturucu */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Share2 className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-white text-sm tracking-wide">MÜŞTERİ PAYLAŞIM LİNKİ</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Buradaki fiyat değişikliklerini yaptıktan sonra müşterilerinizle paylaşmak için özel bir bağlantı oluşturabilirsiniz. Bağlantıyı açan kişiler, sisteme giriş yapmadan doğrudan sizin belirlediğiniz güncel fiyatları canlı olarak görür.
            </p>

            <div className="space-y-3 font-sans pt-1">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}#p=${encodePriceList(formData)}`}
                  className="w-full bg-slate-950 border border-slate-850 focus:outline-none p-2.5 pr-20 rounded-lg text-[10px] text-slate-400 font-mono select-all truncate"
                  id="share-link-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("share-link-input") as HTMLInputElement;
                    if (el) {
                      el.select();
                      navigator.clipboard.writeText(el.value);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }
                  }}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 text-[10px] font-bold rounded cursor-pointer border border-slate-850 flex items-center gap-1 transition"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3 h-3 text-green-500 animate-pulse" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-500" />
                      Kopyala
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Merhaba, Güncel Yavuzlar Kuyumculuk altın fiyatlarımızı aşağıdaki bağlantıya tıklayarak canlı olarak görebilirsiniz:\n\n${window.location.origin}${window.location.pathname}#p=${encodePriceList(formData)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 text-center shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp ile Gönder
                </a>
                
                <a
                  href={`${window.location.origin}${window.location.pathname}#p=${encodePriceList(formData)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 text-xs rounded-lg cursor-pointer border border-slate-850 flex items-center justify-center transition"
                  title="Önizleme Aç"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fiyatları Elle Düzenleme Kontrol Masası (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            
            {/* Main Header / Metadata Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif font-bold text-white text-sm tracking-wide">LİSTE BAŞLIK VE TARİH VERİLERİ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSavePrices()}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-slate-950 text-xs font-bold leading-none tracking-wide rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none shadow"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Değişiklikleri Kaydet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">DERNEK / ENSTİTÜ BAŞLIĞI</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleMetadataChange("title", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 focus:outline-none p-2.5 rounded-lg text-xs font-semibold text-slate-100"
                  />
                </div>
                <div className="space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">LİSTE TARİHİ</label>
                  <input
                    type="text"
                    placeholder="Örn: 15.06.2026"
                    value={formData.date}
                    onChange={e => handleMetadataChange("date", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 focus:outline-none p-2.5 rounded-lg text-xs font-bold text-slate-100 font-serif"
                  />
                </div>
                <div className="space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">LİSTE ALT BAŞLIĞI</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => handleMetadataChange("subtitle", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 focus:outline-none p-2.5 rounded-lg text-xs text-slate-400"
                  />
                </div>
                <div className="space-y-1 font-sans">
                  <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">HAYIRLI DİLEK MESAJI (NOT / SAĞ KÖŞE)</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={e => handleMetadataChange("note", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 focus:outline-none p-2.5 rounded-lg text-xs text-green-400 font-medium italic"
                  />
                </div>
              </div>

              {saveStatus && (
                <div className={`p-3.5 rounded-lg border text-xs font-sans ${
                  saveStatus.success 
                    ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                    : "bg-red-950/20 border-red-900/30 text-red-400"
                }`}>
                  {saveStatus.msg}
                </div>
              )}
            </div>

            {/* Price rows table control */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Info className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif font-bold text-white text-sm tracking-wide">ALTIN KALEMLERİ FİYAT DEFTERİ</h3>
              </div>

              <div className="max-h-[480px] overflow-y-auto pr-1 border border-slate-950 rounded-xl space-y-2">
                {formData.prices && formData.prices.map((p, index) => (
                  <div 
                    key={p.id}
                    className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 hover:border-slate-850 transition flex flex-col md:flex-row items-start md:items-center gap-3 justify-between"
                  >
                    <div className="flex items-center gap-2 w-full md:w-1/3 shrink-0">
                      <span className="text-slate-600 text-xs font-mono w-5">{(index + 1).toString().padStart(2, "0")}</span>
                      <span className="text-slate-200 text-xs font-bold truncate">{p.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full md:w-2/3">
                      {/* Buy input */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-slate-500">
                          <span>Alış Fiyatı</span>
                          {p.buy !== null && (
                            <button
                              type="button"
                              onClick={() => handleClearField(p.id, "buy")}
                              className="text-red-500 hover:text-red-400 cursor-pointer text-[8px] tracking-normal inline-flex items-center"
                              title="Boşa al"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            placeholder="Alış (Boş)"
                            value={p.buy ?? ""}
                            onChange={e => handlePriceChange(p.id, "buy", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/30 focus:outline-none p-2 rounded text-xs font-mono text-slate-200"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-slate-600 font-mono">TL</span>
                        </div>
                      </div>

                      {/* Sell input */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-slate-500">
                          <span>Satış Fiyatı</span>
                          {p.sell !== null && (
                            <button
                              type="button"
                              onClick={() => handleClearField(p.id, "sell")}
                              className="text-red-500 hover:text-red-400 cursor-pointer text-[8px] tracking-normal inline-flex items-center"
                              title="Boşa al"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            placeholder="Satış (Boş)"
                            value={p.sell ?? ""}
                            onChange={e => handlePriceChange(p.id, "sell", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/30 focus:outline-none p-2 rounded text-xs font-mono text-slate-200"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-slate-600 font-mono">TL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save footer */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSavePrices()}
                  disabled={isSaving}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-slate-950 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none font-sans"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Değişiklikleri Kaydet
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
