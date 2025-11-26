
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ------------------------------------------------------------------
// IMPORTANTE: SUBSTITUA OS VALORES ABAIXO PELOS DO SEU PROJETO FIREBASE
// Você encontra isso no Console do Firebase -> Configurações do Projeto
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD-EXEMPLO-DA-SUA-CHAVE-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services so we can use them in App.tsx
export const db = getFirestore(app);
export const auth = getAuth(app);
