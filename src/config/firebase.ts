import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA56S8sNUAoRWHYCLJb00_7qcvIJl9KCyw",
  authDomain: "time-tracker-system-d5cca.firebaseapp.com",
  databaseURL: "https://time-tracker-system-d5cca-default-rtdb.firebaseio.com",
  projectId: "time-tracker-system-d5cca",
  storageBucket: "time-tracker-system-d5cca.firebasestorage.app",
  messagingSenderId: "823115181841",
  appId: "1:823115181841:web:7b7b2d72ace4fc2ee0a6b0",
  measurementId: "G-4C77B3BT69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Firebase Realtime Database and get a reference to the service
export const database = getDatabase(app)

export default app
