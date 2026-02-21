import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNkQpEKNucTsf9rCNTscOkDgXTHUKXirs",
  authDomain: "solve-sixteen.firebaseapp.com",
  projectId: "solve-sixteen",
  storageBucket: "solve-sixteen.firebasestorage.app",
  messagingSenderId: "893103365807",
  appId: "1:893103365807:web:2f82ccaef22da04abbfe5a",
  measurementId: "G-9W2TJLGGCF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
