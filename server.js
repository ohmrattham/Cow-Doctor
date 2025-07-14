import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import * as tf from "@tensorflow/tfjs-node";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));

// อนุญาต CORS
app.use(
  cors({
    origin: "*", // หรือใส่ URL frontend ที่ต้องการอนุญาต เช่น "https://ohmrattham.github.io"
  })
);

// โหลดโมเดล Teachable Machine (โหลด local หรือจาก URL ได้)
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

// ชื่อโรคตามโมเดล
const classNames = [
  "โรคไข้ 3 วัน",
  "โรคปากเท้าเปื่อย",
  "โรค BlackLeg",
  "โรคคอบวม",
  "โรคแอนแทรกซ์",
  "โรคลัมปีสกิน",
];

// วิเคราะห์ภาพจาก base64
async function analyzeImage(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, "base64");

    // แปลง buffer เป็น tensor โดยตรง
    let imageTensor = tf.node.decodeImage(buffer, 3);
    imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const input = imageTensor.expandDims(0).toFloat().div(255);

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ โปรดตั้งค่า GEMINI_API_KEY ใน .env");
  process.exit(1);
}

app.post("/api/chat", async (req, res) => {
  try {
    const { textInput, chatHistory, hasImage, imageData } = req.body;

    let diseaseDetected = null;
    let diseaseConfidence = 0;

    if (hasImage && imageData && model) {
      const result = await analyzeImage(imageData);
      if (result) {
        diseaseConfidence = result.maxScore;
        if (diseaseConfidence > 0.7) {
          diseaseDetected = classNames[result.maxIndex];
        }
      }
    }

    let prompt = "";

    if (diseaseDetected) {
      // ถ้าเจอโรค ให้ถาม Gemini เกี่ยวกับโรคนั้น
      prompt = `ขอข้อมูลเกี่ยวกับโรค ${diseaseDetected} ในวัว และวิธีการรักษาและป้องกันโรคนี้`;
    } else {
      // ถ้าไม่เจอโรคหรือไม่มีภาพ ให้รวม chatHistory กับ input
      if (Array.isArray(chatHistory)) {
        prompt = chatHistory
          .map((item) => (item.role === "user" ? "ผู้ใช้: " : "AI: ") + item.text)
          .join("\n");
      }
      prompt += "\nผู้ใช้: " + textInput + "\nAI:";
    }

    // เรียก Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
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
