import { PriceListUpdate } from "../types";

export const DEFAULT_PRICE_LIST: PriceListUpdate = {
  date: "15.06.2026",
  title: "YAVUZLAR KUYUMCULUK",
  subtitle: "GÜNLÜK ALTIN FİYAT LİSTESİ",
  note: "HAYIRLI İŞLER",
  prices: [
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
  ]
};
