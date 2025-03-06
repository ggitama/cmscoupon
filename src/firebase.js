import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB5MQOYIFnC75LhBl2c0NNL5Njzwt6t9F4",
    authDomain: "coupon-av-uob.firebaseapp.com",
    projectId: "coupon-av-uob",
    storageBucket: "coupon-av-uob.firebasestorage.app",
    messagingSenderId: "884709325588",
    appId: "1:884709325588:web:a73471a0dea6fd244fe001",
    measurementId: "G-RQ9K84S845"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
