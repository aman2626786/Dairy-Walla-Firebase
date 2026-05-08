import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA9Yu8uSBopX6TXX5eVSpMDbiaikEQ-8WI",
  authDomain: "cobalt-list-472201-v5.firebaseapp.com",
  projectId: "cobalt-list-472201-v5",
  storageBucket: "cobalt-list-472201-v5.firebasestorage.app",
  messagingSenderId: "137172102311",
  appId: "1:137172102311:web:0717e37e27a2874254ff82",
  measurementId: "G-QDF6822T5R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);