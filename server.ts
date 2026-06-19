import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side storage folder
const isVercel = process.env.VERCEL === "1";
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const ORIGINAL_DATA_DIR = path.join(process.cwd(), "data");

const PRICES_FILE = path.join(DATA_DIR, "prices.json");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

if (isVercel) {
  // Copy original files to /tmp for writing if they don't already exist in the lambda instance
  const originalPrices = path.join(ORIGINAL_DATA_DIR, "prices.json");
  if (!fs.existsSync(PRICES_FILE) && fs.existsSync(originalPrices)) {
    try {
      fs.copyFileSync(originalPrices, PRICES_FILE);
    } catch (e) {
      console.error("Vercel Init: Failed to copy prices.json to /tmp", e);
    }
  }
  const originalAuth = path.join(ORIGINAL_DATA_DIR, "auth.json");
  if (!fs.existsSync(AUTH_FILE) && fs.existsSync(originalAuth)) {
    try {
      fs.copyFileSync(originalAuth, AUTH_FILE);
    } catch (e) {
      console.error("Vercel Init: Failed to copy auth.json to /tmp", e);
    }
  }
} else {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Default PIN is "1234"
const DEFAULT_PIN = "1234";

// Middleware to parse json payloads
app.use(express.json({ limit: "50mb" }));

// Simple Logger to help analyze requests
function logToServer(msg: string) {
  try {
    const logPath = path.join(DATA_DIR, "app_debug.log");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`, "utf-8");
  } catch (e) {
    console.error("Logger error:", e);
  }
}

// Diagnostic middleware to log all requests
app.use((req, res, next) => {
  logToServer(`${req.method} ${req.url} - IP ${req.ip} - Content-Length: ${req.headers["content-length"] || 0} bytes`);
  next();
});

// Allowed categories to show and save under user instructions
const ALLOWED_IDS = [
  "22_ayar",
  "kalin_ceyrek",
  "ziynet_ceyrek_yeni",
  "ziynet_ceyrek_eski",
  "tam_ziynet",
  "kulplu_resat",
  "cumhuriyet",
  "resat_besli",
  "resat_half_besli",
  "1gram_24_ayar"
];

// Helper to get prices and perform automatic migrations for legacy data formats
function loadPrices() {
  const defaultPrices = [
    { id: "22_ayar", name: "22 Ayar", sell: 6450, buy: 5895 },
    { id: "kalin_ceyrek", name: "Kalın çeyrek", sell: 11300, buy: 10800 },
    { id: "ziynet_ceyrek_yeni", name: "Ziynet Çeyrek Yeni", sell: 11000, buy: 10400 },
    { id: "ziynet_ceyrek_eski", name: "Ziynet Çeyrek Eski", sell: 10900, buy: 10400 },
    { id: "tam_ziynet", name: "Tam Ziynet", sell: 42600, buy: 41300 },
    { id: "kulplu_resat", name: "Kulplu Reşat", sell: 44500, buy: 42500 },
    { id: "cumhuriyet", name: "Cumhuriyet", sell: 44000, buy: 42500 },
    { id: "resat_besli", name: "Reşat Beşli", sell: 250000, buy: 220000 },
    { id: "resat_half_besli", name: "Reşat 1/2 Y. Beşli", sell: 140000, buy: 115000 },
    { id: "1gram_24_ayar", name: "1Gram 24 Ayar", sell: 6620, buy: 6450 }
  ];

  const defaultPayload = {
    date: "15.06.2026",
    title: "YAVUZLAR KUYUMCULUK",
    subtitle: "GÜNLÜK ALTIN FİYAT LİSTESİ",
    note: "HAYIRLI İŞLER",
    prices: defaultPrices
  };

  if (fs.existsSync(PRICES_FILE)) {
    try {
      const data = fs.readFileSync(PRICES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.prices)) {
        // Map exactly our 10 allowed items
        const migratedPrices = defaultPrices.map(def => {
          const saved = parsed.prices.find((p: any) => {
            const pId = String(p.id || "");
            const pName = String(p.name || "").toLowerCase();
            
            if (def.id === "22_ayar") {
              // Exclude 'alt sınır' entries from matching the main 22 Ayar category
              return (pId === "22_ayar" && !pName.includes("sınır") && !pName.includes("sinir")) || pName === "22 ayar";
            }
            if (def.id === "1gram_24_ayar") {
              return pId === "1gram_24_ayar" || (pId === "24_ayar" && pName.includes("1gram")) || pName.includes("1gram") || pName.includes("1 gram");
            }
            return pId === def.id || pName.includes(def.name.toLowerCase());
          });

          if (saved) {
            return {
              id: def.id,
              name: def.name,
              sell: saved.sell === "" || saved.sell === undefined ? null : saved.sell === null ? null : parseFloat(saved.sell),
              buy: saved.buy === "" || saved.buy === undefined ? null : saved.buy === null ? null : parseFloat(saved.buy),
              lastUpdated: saved.lastUpdated || new Date().toISOString()
            };
          }
          return {
            ...def,
            lastUpdated: new Date().toISOString()
          };
        });

        const migratedPayload = {
          date: parsed.date || defaultPayload.date,
          title: parsed.title || defaultPayload.title,
          subtitle: parsed.subtitle || defaultPayload.subtitle,
          note: parsed.note || defaultPayload.note,
          prices: migratedPrices
        };
        // Auto-save the clean migrated payload to heal state
        savePrices(migratedPayload);
        return migratedPayload;
      }
    } catch (e) {
      console.error("Error reading saved prices file, returning fallback.", e);
    }
  }
  
  return defaultPayload;
}

// Helper to save prices
function savePrices(data: any) {
  fs.writeFileSync(PRICES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

let dbInstance: any = null;

function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const app = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
      dbInstance = getFirestore(app, config.firestoreDatabaseId || "(default)");
      console.log("Firebase initialized dynamically. Using Firestore database id:", config.firestoreDatabaseId || "(default)");
    }
  } catch (err) {
    console.error("Firebase dynamic initialization failed:", err);
  }
  return dbInstance;
}

let supabaseInstance: any = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
        }
      });
      console.log("Supabase dynamically initialized successfully.");
    } catch (err) {
      console.error("Failed to dynamically initialize Supabase:", err);
    }
  }
  return supabaseInstance;
}

// Durable loader using Supabase, Firestore with standard migration / file fallback
async function loadPricesWithDatabase() {
  const localFallback = loadPrices(); // Sync helper that loads local and performs schema heal
  
  // 1. Try Supabase first if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("prices")
        .select("data")
        .eq("id", "current")
        .maybeSingle(); // Prevent standard PGRST116 single-row exception
        
      if (error) {
        console.warn("Supabase load error:", error.message);
      } else if (data && data.data) {
        const dbData = data.data;
        if (dbData && Array.isArray(dbData.prices)) {
          // Check if it's parsed cleanly. Migrate schema on the fly if needed
          const defaultPrices = [
            { id: "22_ayar", name: "22 Ayar", sell: 6450, buy: 5895 },
            { id: "kalin_ceyrek", name: "Kalın çeyrek", sell: 11300, buy: 10800 },
            { id: "ziynet_ceyrek_yeni", name: "Ziynet Çeyrek Yeni", sell: 11000, buy: 10400 },
            { id: "ziynet_ceyrek_eski", name: "Ziynet Çeyrek Eski", sell: 10900, buy: 10400 },
            { id: "tam_ziynet", name: "Tam Ziynet", sell: 42600, buy: 41300 },
            { id: "kulplu_resat", name: "Kulplu Reşat", sell: 44500, buy: 42500 },
            { id: "cumhuriyet", name: "Cumhuriyet", sell: 44000, buy: 42500 },
            { id: "resat_besli", name: "Reşat Beşli", sell: 250000, buy: 220000 },
            { id: "resat_half_besli", name: "Reşat 1/2 Y. Beşli", sell: 140000, buy: 115000 },
            { id: "1gram_24_ayar", name: "1Gram 24 Ayar", sell: 6620, buy: 6450 }
          ];
          const migratedPrices = defaultPrices.map(def => {
            const saved = dbData.prices.find((p: any) => p.id === def.id);
            if (saved) {
              return {
                id: def.id,
                name: def.name,
                sell: saved.sell === "" || saved.sell === undefined ? null : saved.sell === null ? null : parseFloat(saved.sell),
                buy: saved.buy === "" || saved.buy === undefined ? null : saved.buy === null ? null : parseFloat(saved.buy),
                lastUpdated: saved.lastUpdated || new Date().toISOString()
              };
            }
            return {
              ...def,
              lastUpdated: new Date().toISOString()
            };
          });

          const currentPayload = {
            date: dbData.date || localFallback.date,
            title: dbData.title || localFallback.title,
            subtitle: dbData.subtitle || localFallback.subtitle,
            note: dbData.note || localFallback.note,
            prices: migratedPrices
          };
          
          // Keep local backup file completely fresh too
          savePrices(currentPayload);
          return currentPayload;
        }
      } else {
        // Row doesn't exist yet, populate it for the first time with local file values!
        console.log("No price row in Supabase. Initializing with local data...");
        await savePricesWithDatabase(localFallback);
        return localFallback;
      }
    } catch (err) {
      console.error("Failed to fetch prices from Supabase, trying fallback:", err);
    }
  }

  // 2. Fallback to Firebase Firestore if configured
  try {
    const db = getDb();
    if (db) {
      const docRef = doc(db, "prices", "current");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbData = docSnap.data();
        if (dbData && Array.isArray(dbData.prices)) {
          // Check if it's parsed cleanly. If any of the required fields are missing, perform same migration as local
          const defaultPrices = [
            { id: "22_ayar", name: "22 Ayar", sell: 6450, buy: 5895 },
            { id: "kalin_ceyrek", name: "Kalın çeyrek", sell: 11300, buy: 10800 },
            { id: "ziynet_ceyrek_yeni", name: "Ziynet Çeyrek Yeni", sell: 11000, buy: 10400 },
            { id: "ziynet_ceyrek_eski", name: "Ziynet Çeyrek Eski", sell: 10900, buy: 10400 },
            { id: "tam_ziynet", name: "Tam Ziynet", sell: 42600, buy: 41300 },
            { id: "kulplu_resat", name: "Kulplu Reşat", sell: 44500, buy: 42500 },
            { id: "cumhuriyet", name: "Cumhuriyet", sell: 44000, buy: 42500 },
            { id: "resat_besli", name: "Reşat Beşli", sell: 250000, buy: 220000 },
            { id: "resat_half_besli", name: "Reşat 1/2 Y. Beşli", sell: 140000, buy: 115000 },
            { id: "1gram_24_ayar", name: "1Gram 24 Ayar", sell: 6620, buy: 6450 }
          ];
          const migratedPrices = defaultPrices.map(def => {
            const saved = dbData.prices.find((p: any) => p.id === def.id);
            if (saved) {
              return {
                id: def.id,
                name: def.name,
                sell: saved.sell === "" || saved.sell === undefined ? null : saved.sell === null ? null : parseFloat(saved.sell),
                buy: saved.buy === "" || saved.buy === undefined ? null : saved.buy === null ? null : parseFloat(saved.buy),
                lastUpdated: saved.lastUpdated || new Date().toISOString()
              };
            }
            return {
              ...def,
              lastUpdated: new Date().toISOString()
            };
          });

          const currentPayload = {
            date: dbData.date || localFallback.date,
            title: dbData.title || localFallback.title,
            subtitle: dbData.subtitle || localFallback.subtitle,
            note: dbData.note || localFallback.note,
            prices: migratedPrices
          };
          
          // Keep local backup file completely fresh too
          savePrices(currentPayload);
          return currentPayload;
        }
      } else {
        // Document doesn't exist yet, populate it for the first time with local file values!
        console.log("No price document in Firestore. Initializing with local data...");
        await savePricesWithDatabase(localFallback);
        return localFallback;
      }
    }
  } catch (err) {
    console.error("Failed to fetch prices from Firebase Firestore, using local fallback:", err);
  }
  return localFallback;
}

// Durable saver that writes to Supabase, Firestore AND keeps a local file backup
async function savePricesWithDatabase(data: any) {
  // 1. Keep local file up-to-date
  savePrices(data);
  
  // 2. Try to store to Supabase if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("prices")
        .upsert({ id: "current", data: data });
      if (error) {
        console.error("Failed to save prices to Supabase:", error.message);
      } else {
        console.log("Prices successfully saved to Supabase.");
      }
    } catch (err) {
      console.error("Failed to save prices to Supabase:", err);
    }
  }

  // 3. Try to store to central Firestore database
  try {
    const db = getDb();
    if (db) {
      const docRef = doc(db, "prices", "current");
      await setDoc(docRef, data);
      console.log("Prices successfully saved to central Firestore database.");
    }
  } catch (err) {
    console.error("Failed to save prices to central Firestore database, continuing with local persistent storage fallback:", err);
  }
}

// Helper for PIN Auth
function checkPin(submittedPin: string): boolean {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const authData = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
      return authData.pin === submittedPin;
    } catch (e) {
      console.error("Error reading auth file, falling back to default PIN.", e);
    }
  }
  return submittedPin === DEFAULT_PIN;
}

// Helper to save PIN
function updatePin(newPin: string) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ pin: newPin }), "utf-8");
}

// Initialize Gemini Client dynamically to pick up GEMINI_API_KEY1 or GEMINI_API_KEY at request time if set in Secrets
function getGeminiClient(): GoogleGenAI | null {
  const apiSecretKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
  if (!apiSecretKey) {
    logToServer("getGeminiClient: Neither GEMINI_API_KEY1 nor GEMINI_API_KEY environment variable is defined.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiSecretKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
// 1. Fetch current prices
app.get("/api/prices", async (req, res) => {
  try {
    const prices = await loadPricesWithDatabase();
    res.json(prices);
  } catch (err: any) {
    res.status(500).json({ error: "Fiyatlar yüklenirken sunucu hatası oluştu.", details: err.message });
  }
});

// 2. Validate PIN Auth
app.post("/api/auth/verify", (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: "Geçersiz PIN girdisi." });
  }
  const isCorrect = checkPin(String(pin));
  res.json({ success: isCorrect });
});

// 3. Update PIN
app.post("/api/auth/update-pin", (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) {
    return res.status(400).json({ error: "Eksik parametreler." });
  }
  if (!checkPin(String(currentPin))) {
    return res.status(403).json({ error: "Mevcut şifre/PIN kodunuz hatalı." });
  }
  if (String(newPin).length < 4) {
    return res.status(400).json({ error: "Yeni PIN en az 4 karakter uzunluğunda olmalıdır." });
  }
  
  updatePin(String(newPin));
  res.json({ success: true, message: "Yönetici şifreniz başarıyla güncellendi!" });
});

// 4. Update prices manually
app.post("/api/prices", async (req, res) => {
  const { pin, data } = req.body;
  
  if (!pin || !checkPin(String(pin))) {
    return res.status(403).json({ error: "Sadece yetkili yöneticiler giriş yapabilir. Lütfen şifrenizi kontrol edin." });
  }

  if (!data || !Array.isArray(data.prices)) {
    return res.status(400).json({ error: "Gönderilen veri şablonu hatalı." });
  }

  try {
    // Add lastUpdated fields automatically for audit log
    const timestamp = new Date().toISOString();
    const sanitisedPrices = data.prices.map((p: any) => ({
      ...p,
      buy: p.buy === "" || p.buy === undefined ? null : p.buy === null ? null : parseFloat(p.buy),
      sell: p.sell === "" || p.sell === undefined ? null : p.sell === null ? null : parseFloat(p.sell),
      lastUpdated: timestamp
    }));

    const updatePayload = {
      date: data.date || new Date().toLocaleDateString("tr-TR"),
      title: data.title || "YAVUZLAR KUYUMCULUK",
      subtitle: data.subtitle || "GÜNLÜK ALTIN FİYAT LİSTESİ",
      note: data.note || "HAYIRLI İŞLER",
      prices: sanitisedPrices
    };

    await savePricesWithDatabase(updatePayload);
    res.json({ success: true, message: "Fiyatlar başarıyla güncellendi!", data: updatePayload });
  } catch (err: any) {
    res.status(500).json({ error: "Değişiklikler kaydedilirken sunucu hatası oluştu.", details: err.message });
  }
});

// 5. Analyze image using Gemini AI
app.post("/api/prices/analyze-image", async (req, res) => {
  const { pin, base64Image, mimeType } = req.body;

  logToServer(`Attempting analyze-image. PIN matches: ${checkPin(String(pin))}. Base64 size: ${base64Image ? base64Image.length : 0} chars. Mime: ${mimeType}`);

  if (!pin || !checkPin(String(pin))) {
    logToServer("analyze-image: Auth failed. Invalid PIN.");
    return res.status(403).json({ error: "Yetkisiz erişim. Lütfen geçerli PIN kodu girin." });
  }

  if (!base64Image) {
    logToServer("analyze-image: Failed. Base64 is missing.");
    return res.status(400).json({ error: "Yüklenecek bir görüntü bulunamadı." });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    logToServer("analyze-image: Failed. Gemini SDK client is not initialized.");
    return res.status(400).json({ 
      error: "Gemini Yapay Zeka servisi etkinleştirilemedi. Lütfen sistem sırlarında (Secrets / Settings) GEMINI_API_KEY1 veya GEMINI_API_KEY değerinin doğru tanımlandığından emin olun." 
    });
  }

  const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const finalMime = mimeType || "image/jpeg";

  try {
    logToServer("analyze-image: Calling Gemini API generateContent...");
    const prompt = `Lütfen yüklediğim kuyumcu veya dernek günlük altın tavsiye fiyat listesi fotoğrafını oku. 
Tabloda CİNSİ (Ürün adı/Altın ayarı), SATIŞ ve ALIŞ fiyatları bulunuyor. 
Ayrıca listenin en üstünde TARİH (Örn: 15.06.2026), BAŞLIK (Örn: ÇAYCUMA KUYUMCULAR DERNEĞİ) ve iyi iş dileği NOT alanı (Örn: HAYIRLI İŞLER) yazıyor.

Okurken şu kurallara KESİNLİKLE uy:
1. Türkçe metinleri ve sayıları kusursuz olarak çözümle. Bazen tablolar yamuk veya bulanık olduğunda hizalamayı doğru yap. Bir satırdaki cinsi, o satırın karşısına denk gelen SATIŞ ve ALIŞ fiyatları ile eşleştir.
2. Sayı formatlarını ayıkla. Örnek: '6.450,00 TL' -> 6450, '250.000,00' -> 250000. Sayıyı doğrudan number formatında ver.
3. Eğer SATIŞ veya ALIŞ kolonu boş ise veya çizgi varsa, o alan için kesinlikle null değerini ata. Kesinlikle uydurma veri girme ya da sıfır (0) yapma. Boş olan alan null olmalıdır!
4. Sadece aşağıdaki 10 aktif ürünü oku ve eşleştirip ata (Diğer kategorileri siteye kaydetmeyeceğimiz için prices dizisine ekleme!):
   - '22 Ayar'
   - 'Kalın çeyrek'
   - 'Ziynet Çeyrek Yeni'
   - 'Ziynet Çeyrek Eski'
   - 'Tam Ziynet'
   - 'Kulplu Reşat'
   - 'Cumhuriyet'
   - 'Reşat Beşli'
   - 'Reşat 1/2 Y. Beşli'
   - '1Gram 24 Ayar'

Uyarı: En baştaki "24 Ayar" satırını (zaten Alış fiyatı yoktur) ve "22 Ayar alt sınır" satırını kesinlikle alma! Onun yerine sadece "1Gram 24 Ayar" ve "22 Ayar" satırlarını oku. Ayrıca 18 Ayar, 14 Ayar, Gümüş, 0.50 gram altın, 0.25 gram altın satırlarını kesinlikle prices listesine dahil etme!

5. Date (TARİH) bilgisini bul ve tarih formatında (Örn: '15.06.2026') olarak döndür.
6. En üstte yazan başlık bilgisini can kulağıyla oku ve title (Örn: 'ÇAYCUMA KUYUMCULAR DERNEĞİ') olarak ata. Subtitle alanına ise 'TAVSİYE EDİLEN PERAKENDE GÜNLÜK FİYAT LİSTESİ' yazısını bulursan ekle. En tepedeki sağ köşe notunu da note (Örn: 'HAYIRLI İŞLER') olarak yerleştir.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: rawBase64,
              mimeType: finalMime
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Dernek veya kurum adı, örn: ÇAYCUMA KUYUMCULAR DERNEĞİ" },
            subtitle: { type: Type.STRING, description: "Listenin alt başlığı, örn: TAVSİYE EDİLEN PERAKENDE GÜNLÜK FİYAT LİSTESİ" },
            date: { type: Type.STRING, description: "Listedeki tarih bilgisi, örn: 15.06.2026" },
            note: { type: Type.STRING, description: "Sağ köşede veya başka yerde yazan iyi niyet mesajı, örn: HAYIRLI İŞLER" },
            prices: {
              type: Type.ARRAY,
              description: "Çözümlenen altın cinsleri listesi, tam olarak istenen 10 aktif ürünü içermelidir.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Altın adı, örn: '22 Ayar', 'Kalın çeyrek', '1Gram 24 Ayar'" },
                  sell: { type: Type.NUMBER, description: "SATIŞ sütunundaki sayısal değer, boşsa null" },
                  buy: { type: Type.NUMBER, description: "ALIŞ sütunundaki sayısal değer, boşsa null" }
                },
                required: ["name"]
              }
            }
          },
          required: ["title", "prices"]
        }
      }
    });

    const parsedJsonText = response.text ? response.text.trim() : "{}";
    const parsedData = JSON.parse(parsedJsonText);

    // Provide default fallback ids by matching names to prevent broken lists
    if (parsedData.prices && Array.isArray(parsedData.prices)) {
      const matchMap: { [key: string]: string } = {
        "22 ayar": "22_ayar",
        "kalın çeyrek": "kalin_ceyrek",
        "ziynet çeyrek yeni": "ziynet_ceyrek_yeni",
        "ziynet çeyrek eski": "ziynet_ceyrek_eski",
        "tam ziynet": "tam_ziynet",
        "kulplu reşat": "kulplu_resat",
        "cumhuriyet": "cumhuriyet",
        "reşat beşli": "resat_besli",
        "reşat 1/2 y. beşli": "resat_half_besli",
        "1gram 24 ayar": "1gram_24_ayar"
      };

      const filteredMappedPrices: any[] = [];
      parsedData.prices.forEach((extractedItem: any) => {
        const lowerName = String(extractedItem.name).toLowerCase().trim();
        let matchedId = "";
        for (const key of Object.keys(matchMap)) {
          if (lowerName.includes(key) || key.includes(lowerName)) {
            matchedId = matchMap[key];
            break;
          }
        }

        // Only keep if it mapped to one of our ALLOWED_IDS
        if (matchedId && ALLOWED_IDS.includes(matchedId)) {
          // Normalize names to official values to look neat on UI
          const officialNames: { [key: string]: string } = {
            "22_ayar": "22 Ayar",
            "kalin_ceyrek": "Kalın çeyrek",
            "ziynet_ceyrek_yeni": "Ziynet Çeyrek Yeni",
            "ziynet_ceyrek_eski": "Ziynet Çeyrek Eski",
            "tam_ziynet": "Tam Ziynet",
            "kulplu_resat": "Kulplu Reşat",
            "cumhuriyet": "Cumhuriyet",
            "resat_besli": "Reşat Beşli",
            "resat_half_besli": "Reşat 1/2 Y. Beşli",
            "1gram_24_ayar": "1Gram 24 Ayar"
          };

          filteredMappedPrices.push({
            id: matchedId,
            name: officialNames[matchedId] || extractedItem.name,
            sell: extractedItem.sell === null || extractedItem.sell === undefined ? null : parseFloat(extractedItem.sell),
            buy: extractedItem.buy === null || extractedItem.buy === undefined ? null : parseFloat(extractedItem.buy)
          });
        }
      });

      parsedData.prices = filteredMappedPrices;
    }

    logToServer(`analyze-image: Gemini API successful. Out prices: ${parsedData.prices ? parsedData.prices.length : 0}`);
    res.json({ success: true, payload: parsedData });
  } catch (err: any) {
    console.error("AI analyzing error:", err);
    logToServer(`analyze-image: Exception caught: ${err.message}. Stack: ${err.stack}`);
    res.status(400).json({ 
      error: "Yapay zeka görseli okurken bir hata ile karşılaştı. Lütfen daha net bir fotoğraf yüklemeyi deneyin.", 
      details: err.message 
    });
  }
});

// Export app for serverless deployment platforms like Vercel
export default app;

// Vite & Static Asset Handling (Skip in Vercel environment as Vercel routes handle static assets at the CDN layer)
async function startServer() {
  if (isVercel) {
    // Run self-healing state/database migrations on Vercel container boot
    try {
      loadPrices();
    } catch (e) {
      console.error("Vercel container boot migration error:", e);
    }
    return;
  }

  // Run self-healing state/database migrations on standalone server boot
  try {
    loadPrices();
    console.log("Prices self-healing migration executed successfully on boot.");
  } catch (e) {
    console.error("Boot migration error:", e);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted at http://0.0.0.0:${PORT}`);
  });
}

startServer();
