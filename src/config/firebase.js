// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries
// import { getStorage } from "firebase/storage";
// import { getFirestore} from 'firebase/firestore';
// import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCVHIlGQP6ji8VzvJegLXpXPMijARdkMNU",
//   authDomain: "project4k4.firebaseapp.com",
//   databaseURL: "https://project4k4-default-rtdb.firebaseio.com",
//   projectId: "project4k4",
//   storageBucket: "project4k4.appspot.com",
//   messagingSenderId: "388482863854",
//   appId: "1:388482863854:web:0581c0ab14bf3e98dc99ff"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const storage = getStorage(app);
// const db = getFirestore(app);

// // Initialize Firestore with unlimited cache size
// const firestoreDb = initializeFirestore(app, {
//   cacheSizeBytes: CACHE_SIZE_UNLIMITED //Storing the cache size as unlimited
// });

// export { storage, firestoreDb, db };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVHIlGQP6ji8VzvJegLXpXPMijARdkMNU",
  authDomain: "project4k4.firebaseapp.com",
  databaseURL: "https://project4k4-default-rtdb.firebaseio.com",
  projectId: "project4k4",
  storageBucket: "project4k4.appspot.com",
  messagingSenderId: "388482863854",
  appId: "1:388482863854:web:0581c0ab14bf3e98dc99ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Get the Firestore instance and set cache size
const db = getFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

export { storage, db };
