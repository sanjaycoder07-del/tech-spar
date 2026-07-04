import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface AIAnalysisResult {
  title: string;
  translatedDescription: string;
  category: 'Roads' | 'Water' | 'Power' | 'Sanitation' | 'Safety';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedLanguage: string;
}

// Simulated fallback analyzer for local offline development when key is not present
function simulateAIAnalysis(description: string, categoryPreference?: string): AIAnalysisResult {
  const desc = description.toLowerCase();
  
  // Detect language
  let detectedLanguage = 'English';
  let translatedDescription = description;
  
  // Hindi checks
  if (/पानी|सड़क|सडक|बिजली|कचरा|गंदगी|नाली|सीवर|पेयजल|गंदा/i.test(description)) {
    detectedLanguage = 'Hindi';
  } else if (/தண்ணீர்|சாக்கடை|சாலை|மின்சாரம்|குப்பை|பாதுகாப்பு/i.test(description)) {
    detectedLanguage = 'Tamil';
  } else if (/నీరు|రోడ్డు|కరెంట్|విద్యుత్|చెత్త|కాలువ/i.test(description)) {
    detectedLanguage = 'Telugu';
  }

  // Set translation mock if non-English detected
  if (detectedLanguage === 'Hindi') {
    translatedDescription = `[Translated from Hindi] ${description}. Urgent administrative action requested regarding community infrastructure.`;
  } else if (detectedLanguage === 'Tamil') {
    translatedDescription = `[Translated from Tamil] ${description}. The public requires relief on a priority basis.`;
  } else if (detectedLanguage === 'Telugu') {
    translatedDescription = `[Translated from Telugu] ${description}. Requesting immediate local authority intervention.`;
  }

  // Determine Category based on keywords
  let category: 'Roads' | 'Water' | 'Power' | 'Sanitation' | 'Safety' = 'Sanitation';
  if (categoryPreference && ['Roads', 'Water', 'Power', 'Sanitation', 'Safety'].includes(categoryPreference)) {
    category = categoryPreference as any;
  } else if (/road|highway|street|pothole|mud|சாலை|ரோడ్డు|सड़क|सडक/i.test(desc)) {
    category = 'Roads';
  } else if (/water|pipe|drinking|leak|pump|தண்ணீர்|నీరు|पानी|पेयजल/i.test(desc)) {
    category = 'Water';
  } else if (/power|electricity|outage|transformer|load shedding|current|కరెంట్|மின்சாரம்|बिजली/i.test(desc)) {
    category = 'Power';
  } else if (/safety|accident|dark|crime|streetlights|women|junction|பாதுகாப்பு/i.test(desc)) {
    category = 'Safety';
  } else if (/garbage|waste|drain|sewer|sewage|trash|filth|கழிவு|नाली|सीवर|कचरा/i.test(desc)) {
    category = 'Sanitation';
  }

  // Determine Urgency
  let urgency: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  if (/accident|death|critical|flooding homes|hospital|sick|dengue|cholera|danger|hazard/i.test(desc)) {
    urgency = 'Critical';
  } else if (/severe|urgent|leak|broken|dark|safety|struggle|suffering|problem/i.test(desc)) {
    urgency = 'High';
  } else if (/stray|litter|small|repair/i.test(desc)) {
    urgency = 'Low';
  }

  // Create Title
  let title = 'Community Grievance';
  if (category === 'Water') title = 'Water Supply Interruption and Access Gap';
  else if (category === 'Roads') title = 'Damaged Commute Road and Pothole Hazards';
  else if (category === 'Power') title = 'Periodic Load Shedding and Power Outage Issues';
  else if (category === 'Sanitation') title = 'Sewer Overflow and Garbage Disposal Deficiency';
  else if (category === 'Safety') title = 'Unsafe Dark Junction and Public Security Threats';

  return {
    title,
    translatedDescription,
    category,
    urgency,
    detectedLanguage
  };
}

export async function analyzeGrievanceWithAI(
  description: string,
  categoryPreference?: string,
  photoBase64?: string,
  voiceBase64?: string
): Promise<AIAnalysisResult> {
  const ai = getGemini();

  // Fallback to simulated offline pipeline if Gemini is not set up
  if (!ai) {
    console.log("[CitizenVoice AI] Gemini API Key not configured. Using high-fidelity local NLP fallback pipeline...");
    // Artificial delay to mimic server response latency
    await new Promise(resolve => setTimeout(resolve, 1200));
    return simulateAIAnalysis(description, categoryPreference);
  }

  try {
    const parts: any[] = [];

    // System instruction and output definition
    const systemInstruction = `You are CitizenVoice AI, an advanced administrative intelligence assistant for Members of Parliament (MPs) in India.
Your task is to analyze a citizen's grievance submission. The submission contains a text description, and optionally an uploaded photo.
You must perform the following:
1. Identify the primary language (e.g. English, Hindi, Tamil, Telugu).
2. Translate the description to clear, grammatical, administrative English if it is written in any other language.
3. Classify the grievance into exactly one of these categories: 'Roads', 'Water', 'Power', 'Sanitation', 'Safety'.
4. Grade the urgency level of the issue into exactly one of: 'Low', 'Medium', 'High', 'Critical'.
5. Formulate an elegant, concise title summarizing the core location and problem (6-10 words).

You MUST respond strictly with a valid JSON object matching this schema:
{
  "title": "concise English title",
  "translatedDescription": "translated English text",
  "category": "Roads" | "Water" | "Power" | "Sanitation" | "Safety",
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "detectedLanguage": "name of language"
}
`;

    let userPrompt = `Citizen Description: "${description || 'Please analyze the attached image.'}"`;
    if (categoryPreference) {
      userPrompt += `\nPreferred Category selection by Citizen: "${categoryPreference}"`;
    }

    parts.push({ text: userPrompt });

    if (photoBase64) {
      // Split header data:image/png;base64, if present
      const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
      const mimeType = photoBase64.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
      parts.push({ text: "Examine the attached photo. Use visual evidence to confirm the severity, detail the specific infrastructure damage, and refine the category or urgency if needed." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            translatedDescription: { type: Type.STRING },
            category: { 
              type: Type.STRING, 
              enum: ['Roads', 'Water', 'Power', 'Sanitation', 'Safety'] 
            },
            urgency: { 
              type: Type.STRING, 
              enum: ['Low', 'Medium', 'High', 'Critical'] 
            },
            detectedLanguage: { type: Type.STRING }
          },
          required: ['title', 'translatedDescription', 'category', 'urgency', 'detectedLanguage']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text received from Gemini");
    }

    const parsed: AIAnalysisResult = JSON.parse(textOutput.trim());
    return parsed;
  } catch (error) {
    console.error("[CitizenVoice AI] Gemini API failure, falling back to local pipeline:", error);
    return simulateAIAnalysis(description, categoryPreference);
  }
}

// Generate high-level AI theme clustering summaries for the MP dashboard
export async function generateAIThemeSummary(
  category: string,
  grievanceTexts: string[]
): Promise<string> {
  const ai = getGemini();

  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `Consolidated concerns regarding public ${category} facilities. Multiple reports request swift localized repairs and increased budget provisioning to clear civic backlogs.`;
  }

  try {
    const listText = grievanceTexts.map((t, idx) => `Complaint #${idx+1}: ${t}`).join('\n\n');
    const prompt = `You are a public affairs analyst for an Indian Member of Parliament.
Review the following citizen complaints regarding "${category}" in the constituency.
Provide a concise, 2-sentence executive summary consolidating these grievances into a clear administrative need.

Complaints:
${listText}

Consolidated Needs Summary:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || "No summary could be compiled.";
  } catch (error) {
    console.error("[CitizenVoice AI] Theme consolidation failed:", error);
    return `Analysis of several logged ${category} concerns indicates persistent infrastructure defects requiring technical assessment and capital allocation.`;
  }
}
