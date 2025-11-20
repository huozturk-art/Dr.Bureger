
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from '../types';

// API Key process.env üzerinden alınıyor (Vite ortamında define edilmiş olmalı)
const API_KEY = process.env.API_KEY;

// Initialize client only if key exists
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateSubtasks = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
  if (!ai) {
    console.warn("Gemini API Key bulunamadı. AI özellikleri devre dışı.");
    return [];
  }

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
    return [];
  }
};

export const analyzeWorkload = async (tasks: Task[]): Promise<string> => {
  if (!ai) return "";

  try {
    const taskSummary = tasks.slice(0, 10).map(t => `- ${t.title} (${t.status})`).join('\n');
    const prompt = `Bir proje yöneticisi gibi davran. Aşağıdaki görev listesini analiz et ve mevcut iş yükü durumu hakkında TÜRKÇE, motive edici, tek cümlelik çok kısa bir özet yaz:\n${taskSummary}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    // Hata durumunda sessizce boş dön, UI'ı bozma
    return "";
  }
};
