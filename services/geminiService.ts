import { GoogleGenAI, Type } from "@google/genai";

// Ensure API Key exists safely to prevent browser crashes
let apiKey = '';
try {
  // Check if process is defined (Node/Build env) before accessing .env
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
} catch (e) {
  console.warn("API Key environment variable missing or process not defined.");
}

const ai = new GoogleGenAI({ apiKey });

// Helper to clean Markdown JSON blocks
const cleanJson = (text: string) => {
    return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

// --- Chat Assistant ---
export const getChatResponse = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  tripContext: any
) => {
  if (!apiKey) return "Necesito una API Key configurada en Netlify para funcionar.";

  try {
    // Serializamos los datos del viaje para que la IA los entienda
    const contextString = JSON.stringify(tripContext);

    const systemInstruction = `
      Eres "Odyssey AI", un asistente de viaje experto, sarcástico pero útil, especializado en Japón.
      
      TIENES ACCESO A LOS SIGUIENTES DATOS DEL VIAJE DEL USUARIO (NO INVENTES DATOS, USA ESTOS):
      ${contextString}

      Tus tareas:
      1. Responder preguntas sobre el itinerario (horarios, ubicaciones, qué toca hoy).
      2. Dar consejos sobre cómo ir de un sitio a otro basándote en los datos de transporte que tienen.
      3. Si preguntan por horarios de apertura de lugares específicos que están en el itinerario y no tienes el dato exacto en el JSON, usa tu conocimiento general sobre Japón para estimarlo, pero avisa de que es una estimación.
      4. Sé breve y directo. Responde siempre en Español.
      5. Si te preguntan algo que no está en el viaje, responde como un guía turístico experto de Japón.
    `;

    // Preparamos el historial para Gemini
    // El SDK espera roles 'user' y 'model'.
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
      },
      history: history
    });

    const result = await chat.sendMessage({ message: message });
    return result.text;

  } catch (error) {
    console.error("Chat Error:", error);
    return "Lo siento, mis circuitos están un poco mareados con el sake. Inténtalo de nuevo.";
  }
};

// --- Game / Quiz Generator ---
export const generateTripQuiz = async (dayContext: string) => {
    if (!apiKey) return null; // Fail gracefully if no key
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Genera una pregunta de trivial tipo test (con 4 opciones) sobre la cultura, historia o curiosidades de este lugar/actividad que vamos a visitar hoy: "${dayContext}". 
            Responde SOLO con este JSON:
            {
                "question": "texto pregunta",
                "options": ["a", "b", "c", "d"],
                "correctIndex": number (0-3),
                "explanation": "breve explicación"
            }`,
            config: { responseMimeType: "application/json" }
        });
        
        const jsonStr = cleanJson(response.text);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Quiz Error", e);
        return null;
    }
}

// --- Maps Grounding ---
export const getNearbyRecommendations = async (location: string, date: string) => {
  if (!apiKey) return "Falta la API Key en la configuración.";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Estoy en ${location} el ${date}. Dime 2 datos históricos interesantes sobre este lugar específico y 2 sitios de comida auténtica muy bien valorados a menos de 5 minutos a pie. Responde en Español de forma concisa.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return "No se pudieron obtener recomendaciones en este momento.";
  }
};

// --- Place Details (Grounding) ---
export const getPlaceDetails = async (placeName: string) => {
  if (!apiKey) return "Sin conexión a Gemini.";
  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `¿Qué es exactamente ${placeName} en Japón? Dame un resumen muy breve (1 frase), horario de apertura habitual y valoración general.`,
          config: {
              tools: [{ googleMaps: {} }],
          }
      });
      return response.text;
  } catch (error) {
      console.error("Place Details Error:", error);
      return "No se pudo obtener información.";
  }
}

// --- Geolocation (Coords) ---
export const getCoordinates = async (location: string): Promise<[number, number] | undefined> => {
    if (!apiKey) return undefined;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Dame las coordenadas de latitud y longitud de "${location}" en Japón. Responde SOLO con un JSON formato { "lat": number, "lng": number }.`,
            config: { responseMimeType: "application/json" }
        });
        
        const jsonStr = cleanJson(response.text);
        const data = JSON.parse(jsonStr);
        
        if (data.lat && data.lng) return [data.lat, data.lng];
        return undefined;
    } catch (e) {
        return undefined;
    }
}

// --- General Intelligence ---
export const getJapanCuriosity = async () => {
  if (!apiKey) return "Configura tu API Key para ver curiosidades.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Cuéntame un dato cultural fascinante, corto y poco conocido sobre Japón que un viajero podría no saber. Máximo 2 frases. En Español.",
    });
    return response.text;
  } catch (error) {
    return "Japón tiene más de 6,800 islas.";
  }
};

// --- Image Analysis (Gemini 3 Pro) ---
export const analyzeTravelPhoto = async (base64Image: string) => {
  if (!apiKey) return "Falta la API Key.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analiza esta foto. Si es comida, dime qué es y cómo se come correctamente. Si es un monumento, cuenta su historia. Si es texto, tradúcelo. Responde en Español." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Analysis Error:", error);
    return "No se pudo analizar la imagen.";
  }
};

// --- Image Editing (Gemini 2.5 Flash Image - Nano Banana) ---
export const editTravelPhoto = async (base64Image: string, prompt: string) => {
  if (!apiKey) throw new Error("Falta la API Key");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt + ". Maintain realism.",
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No se generó ninguna imagen");
  } catch (error) {
    console.error("Edit Error:", error);
    throw error;
  }
};