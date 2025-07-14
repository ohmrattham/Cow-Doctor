import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyCiYgMeT9yMNUEM4hutxPFfz8NdrYY28w8" // แทนที่ YOUR_API_KEY ด้วย API Key จริงของคุณ
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
