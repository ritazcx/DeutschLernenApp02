import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { DictionaryEntry } from '@/types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- Dictionary (Search & Word of Day) ---

export const fetchWordOfTheDay = async (difficulty: string = "A2"): Promise<DictionaryEntry> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a useful German word for a ${difficulty} level learner.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The German word" },
          gender: { type: Type.STRING, description: "The article (der, die, das) if noun, else empty" },
          translation: { type: Type.STRING, description: "English translation" },
          definition: { type: Type.STRING, description: "A simple definition of the word in English" },
          exampleSentenceGerman: { type: Type.STRING, description: "Example sentence in German" },
          exampleSentenceEnglish: { type: Type.STRING, description: "Example sentence in English" },
          difficulty: { type: Type.STRING, description: "The CEFR level (e.g. A1, A2)" }
        },
        required: ["word", "translation", "definition", "exampleSentenceGerman", "exampleSentenceEnglish"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data returned");
  return JSON.parse(text) as DictionaryEntry;
};

export const searchDictionaryWord = async (term: string): Promise<DictionaryEntry> => {
  // 1. Get Text Data (Definition, Gender, Examples)
  const textPromise = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Provide a dictionary entry for the German word or phrase: "${term}".
    If the user inputs an English word, translate it to German first and provide the entry for the German word.
    Provide the most common usage.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The German word" },
          gender: { type: Type.STRING, description: "The article (der, die, das) if noun, else empty" },
          translation: { type: Type.STRING, description: "English translation" },
          definition: { type: Type.STRING, description: "Most commonly used explanation/definition in English" },
          exampleSentenceGerman: { type: Type.STRING, description: "Typical example sentence in German context" },
          exampleSentenceEnglish: { type: Type.STRING, description: "English translation of the example" },
        },
        required: ["word", "translation", "definition", "exampleSentenceGerman", "exampleSentenceEnglish"],
      },
    },
  });

  // 2. Generate Illustration
  const imagePromise = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `A simple, modern, flat-style vector illustration representing the concept: "${term}". Minimalist design, white background.` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  const [textResponse, imageResponse] = await Promise.all([textPromise, imagePromise]);

  // Parse Text
  const textData = textResponse.text;
  if (!textData) throw new Error("Could not find word");
  const entry = JSON.parse(textData) as DictionaryEntry;

  // Parse Image
  let imageUrl: string | undefined = undefined;
  for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  return { ...entry, imageUrl };
};


// --- Chat Tutor ---

export const createTutorChat = (): Chat => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are 'Hans', a friendly and patient German language tutor. 
      Your goal is to help the user practice German conversation.
      
      Rules:
      1. Reply primarily in German, appropriate for the user's level (assume A2/B1 unless they seem advanced).
      2. If the user makes a grammar or vocabulary mistake, kindly correct it at the END of your response in a separate block formatted like this: 
         "[Correction: <corrected_sentence>] - <brief_explanation_in_english>"
      3. Keep responses concise (under 50 words) to encourage back-and-forth dialog.
      4. Be encouraging!`,
    },
  });
};

// --- Text to Speech ---

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, male voice fits "Hans"
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return undefined;
  }
};

// --- Translator / Writing Assistant ---

export const translateOrExplain = async (query: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `User Query: "${query}"
    
    Act as a German Language Writing Assistant.
    1. If the input is German: Correct any grammar/spelling errors. Provide the corrected version and a bullet point explanation of what was wrong.
    2. If the input is English: Translate it to natural-sounding German and provide a usage example.
    3. If it is a question about German: Answer it clearly and concisely.
    
    Format the output in Markdown.`,
  });
  
  return response.text || "Sorry, I couldn't understand that.";
};
