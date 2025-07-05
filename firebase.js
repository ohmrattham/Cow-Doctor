import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getStorage
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// 🐮 ตั้งค่า Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBuK-lFcSg6gTb1j2rccsk4KeufTKUbdJA",
  authDomain: "cow-doctor.firebaseapp.com",
  projectId: "cow-doctor",
  storageBucket: "cow-doctor.appspot.com",
  messagingSenderId: "630940653087",
  appId: "1:630940653087:web:84b07c02cb9b643348a72a",
  measurementId: "G-PKSWWWG462"
};

// 🚀 เริ่มการเชื่อมต่อ Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); // ✅ สำคัญ! เพื่อให้อัปโหลดรูปวัวได้

// ✅ ส่งออกให้ไฟล์อื่นใช้
export {
  auth,
  provider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  db,
  storage, // ต้องมี!
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc
};
