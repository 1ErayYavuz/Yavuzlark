export interface GoldPrice {
  id: string; // unique key, e.g. '24_ayar', 'kalin_ceyrek'
  name: string; // Turkish name of gold product
  buy: number | null; // buying price in TL
  sell: number | null; // selling price in TL
  lastUpdated?: string; // ISO timestamp
}

export interface PriceListUpdate {
  date: string; // "15.06.2026" or current date
  title: string; // "ÇAYCUMA KUYUMCULAR DERNEĞİ"
  subtitle: string; // "TAVSİYE EDİLEN PERAKENDE GÜNLÜK FİYAT LİSTESİ"
  note: string; // "HAYIRLI İŞLER"
  prices: GoldPrice[];
}

export interface AdminCredentials {
  username: string;
  pin: string;
}
