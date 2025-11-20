
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from '../types';

// API Key must be obtained from process.env.API_KEY per guidelines
// Safe access for browser environments
const API_KEY = typeof process !== 'undefined' ? process.env.API_KEY : undefined;

// Initialize client only if key exists (supports simulation mode)
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Simülasyon Modu (Offline/Free Mock)
 * Eğer API Key yoksa, gerçek yapay zeka yerine bu fonksiyon çalışır.
 */
const generateMockSubtasks = (title: string): string[] => {
  const t = title.toLowerCase();
  if (t.includes('menü') || t.includes('tadımı')) {
    return [
      "Maliyet analizi yap",
      "Rakip fiyatlarını kontrol et",
      "Mutfak ekibiyle tadım yap",
      "Sunum fotoğraflarını çek"
    ];
  } else if (t.includes('rapor') || t.includes('bütçe') || t.includes('finans')) {
    return [
      "Geçen ayın verilerini çek",
      "Gider kalemlerini kategorize et",
      "Kar/Zarar tablosunu güncelle",
      "Yönetim özetini yaz"
    ];
  } else if (t.includes('toplantı') || t.includes('sunum')) {
    return [
      "Gündem maddelerini belirle",
      "Katılımcılara davetiye gönder",
      "Projeksiyon ve ses sistemini test et",
      "Toplantı tutanağını hazırla"
    ];
  } else {
    return [
      "İlgili departmanla görüş",
      "Taslak çalışmayı hazırla",
      "Yönetim onayına sun",
      "Son revizeleri yap"
    ];
  }
};

export const generateSubtasks = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
  // 1. Simülasyon Kontrolü (Ücretsiz/Demo Modu)
  if (!ai) {
    console.log("Gemini API Key yok, simülasyon modu devrede.");
    // Yapay bir gecikme ekle (gerçekçilik için)
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockSubtasks(taskTitle);
  }

  // 2. Gerçek AI Modu
  try {
    const model = "gemini-2.5-flash";
    const prompt = `Aşağıdaki görev için 3 ile 5 arasında uygulanabilir alt görev (kontrol listesi) oluştur. Sadece JSON string array döndür:
    Görev: "${taskTitle}"
    Açıklama: "${taskDescription}"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonStr = response.text;
    return jsonStr ? JSON.parse(jsonStr) : [];
  } catch (error) {
    console.error("AI Alt Görev Hatası:", error);
    // Hata durumunda da simülasyona düş
    return generateMockSubtasks(taskTitle);
  }
};

export const analyzeWorkload = async (tasks: Task[]): Promise<string> => {
  if (!ai) return "📌 Simülasyon: Ekip yoğunluğu dengeli görünüyor, kritik görevlere öncelik verin.";

  try {
    const taskSummary = tasks.slice(0, 10).map(t => `- ${t.title} (${t.status})`).join('\n');
    const prompt = `Bir proje yöneticisi gibi davran. Aşağıdaki görev listesini analiz et ve mevcut iş yükü durumu hakkında TÜRKÇE, motive edici, tek cümlelik çok kısa bir özet yaz:\n${taskSummary}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    return "";
  }
};
