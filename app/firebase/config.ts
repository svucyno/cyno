import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCA62-2QTxxezoq8aLP9ZhZNFn2fY51JDA",
  authDomain: "cyno-bd415.firebaseapp.com",
  projectId: "cyno-bd415",
  storageBucket: "cyno-bd415.firebasestorage.app",
  messagingSenderId: "593658803011",
  appId: "1:593658803011:web:35c25225df8d9a909a35f6",
  measurementId: "G-6243EDPYLZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
