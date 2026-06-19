import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  ChevronRight,
  Building
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Create simple quick action links
  const contactPhone = "0532 541 22 37";
  const contactPhoneRaw = "05325412237";
  const contactWhatsapp = "905325412237";
  const storeAddress = "Yeni Mahalle, Atatürk Bulvarı No: 14, Çaycuma / ZONGULDAK";

  return (
    <footer className="w-full bg-slate-900 mt-16 border-t border-slate-800 text-slate-300 font-sans">
      
      {/* Top Banner Contact Strip */}
      <div className="bg-slate-950/40 border-b border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Quick Item 1 */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-mono">MAĞAZA ADRESİ</h4>
              <p className="text-xs text-slate-200 mt-1 font-semibold leading-relaxed">
                {storeAddress}
              </p>
            </div>
          </div>

          {/* Quick Item 2 */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-mono">TELEFON DESTEĞİ</h4>
              <p className="text-xs text-slate-200 mt-1 font-semibold">
                <a href={`tel:${contactPhoneRaw}`} className="hover:text-amber-400 transition">
                  {contactPhone}
                </a>
              </p>
            </div>
          </div>

          {/* Quick Item 3 */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 shrink-0">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-mono">WHATSAPP DANIŞMA</h4>
              <p className="text-xs text-green-400 mt-1 font-semibold">
                <a 
                  href={`https://wa.me/${contactWhatsapp}?text=Merhaba%2C+güncel+altın+fiyatları+hakkında+bilgi+almak+istiyorum.`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:underline transition"
                >
                  Anında İletişime Geç
                </a>
              </p>
            </div>
          </div>

          {/* Quick Item 4 */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 font-mono">ÇALIŞMA SAATLERİ</h4>
              <p className="text-xs text-slate-200 mt-1 font-semibold">
                Pazartesi - Cumartesi: 08:30 - 19:00
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Body with Information & Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Brand Column (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold tracking-wider text-white uppercase">YAVUZLAR KUYUMCULUK</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Yavuzlar Kuyumculuk, Zonguldak Çaycuma merkezindeki lüks sarraf dükkanında sizlere en yüksek kaliteli takılar, alyans grupları, reşat, cumhuriyet, çeyrek ve gram altın çeşitleri ile güvenli alışveriş olanağı sağlamaktadır. Nesiller boyu süren zarafet.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Mail className="w-4 h-4 text-amber-500" />
              <a href="mailto:yavuzlarkuyumcu@gmail.com" className="hover:text-amber-550 transition">
                yavuzlarkuyumcu@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Map location element (lg:col-span-7) */}
        <div className="lg:col-span-7 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/10 p-1">
          {/* Real Google Maps embed for Çaycuma, Zonguldak so the app looks 100% genuine and not mock-like */}
          <iframe 
            title="Yavuzlar Kuyumculuk Çaycuma Harita"
            src="https://maps.google.com/maps?q=Yavuzlar%20Kuyumculuk,%20Atat%C3%BCrk%20Blv.%20No:14,%20%C3%87aycuma,%20Zonguldak&t=&z=16&ie=UTF8&iwloc=&output=embed" 
            width="100%" 
            height="180" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded bg-slate-950"
          ></iframe>
        </div>

      </div>

      {/* Copy strip */}
      <div className="bg-slate-950 py-5 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
          <span>
            © {currentYear} Yavuzlar Kuyumculuk. Tüm Hakları Saklıdır.
          </span>
          <span className="flex items-center gap-1.5 hover:text-amber-400 cursor-default">
            <Building className="w-3.5 h-3.5" />
            Zonguldak Çaycuma Sarraflığı
          </span>
        </div>
      </div>

    </footer>
  );
}
