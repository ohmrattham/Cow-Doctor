import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import * as tf from "@tensorflow/tfjs-node";
import { createCanvas, loadImage } from "canvas";
import cors from "cors";

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: 'https://ohmrattham.github.io'
}));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ โปรดตั้งค่า GEMINI_API_KEY ใน .env");
  process.exit(1);
}

// โหลดโมเดล Teachable Machine
let model;
(async () => {
  try {
    model = await tf.loadLayersModel(
      "https://teachablemachine.withgoogle.com/models/I_d2z8vuR/model.json"
    );
    console.log("✅ โมเดล Teachable Machine โหลดเสร็จแล้ว");
  } catch (err) {
    console.error("❌ โหลดโมเดลล้มเหลว:", err);
  }
})();

const classNames = [
  "โรคไข้ 3 วัน",
  "โรคปากเท้าเปื่อย",
  "โรค BlackLeg",
  "โรคคอบวม",
  "โรคแอนแทรกซ์",
  "โรคลัมปีสกิน"
];

async function analyzeImage(base64Data, mimeType) {
  try {
    const buffer = Buffer.from(base64Data, "base64");

    const img = await loadImage(buffer);
    const canvas = createCanvas(224, 224);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 224, 224);

    const input = tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0);

    const prediction = model.predict(input);
    const scores = prediction.arraySync()[0];

    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);

    return { maxScore, maxIndex, scores };
  } catch (error) {
    console.error("❌ Error analyzeImage:", error);
    return null;
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { textInput, chatHistory, hasImage, imageData, imageMimeType } = req.body;

    let diseaseDetected = null;
    let diseaseConfidence = 0;

    if (hasImage && imageData && model) {
      const result = await analyzeImage(imageData, imageMimeType);
      if (result) {
        diseaseConfidence = result.maxScore;
        if (diseaseConfidence > 0.7) {
          diseaseDetected = classNames[result.maxIndex];
        }
      }
    }

    let prompt = "";

    if (diseaseDetected) {
      prompt = `ขอข้อมูลเกี่ยวกับโรค ${diseaseDetected} ในวัว และวิธีการรักษาและป้องกันโรคนี้`;
    } else {
      if (Array.isArray(chatHistory)) {
        prompt = chatHistory
          .map((item) => (item.role === "user" ? "ผู้ใช้: " : "AI: ") + item.text)
          .join("\n");
      }
      prompt += "\nผู้ใช้: " + textInput + "\nAI:";
    }

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
        params: { key: GEMINI_API_KEY },
      }
    );

    let reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ขอโทษครับ ผมไม่สามารถตอบได้ตอนนี้";

    if (diseaseDetected) {
      reply = `✅ ตรวจพบว่าอาจเป็น: ${diseaseDetected}\n\n📖 ${reply}`;
    }

    res.json({ reply });
  } catch (error) {
    console.error("API /api/chat error:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
