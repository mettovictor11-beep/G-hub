
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyDC2yj-Iqeat4EYwGzoXSgmXbE1yCgl3qQ",
  authDomain: "g-hub-3e4fa.firebaseapp.com",
  projectId: "g-hub-3e4fa",
  storageBucket: "g-hub-3e4fa.firebasestorage.app",
  messagingSenderId: "397562394115",
  appId: "1:397562394115:web:645e63077e27830b368036",
  measurementId: "G-9K455VB2GM",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
