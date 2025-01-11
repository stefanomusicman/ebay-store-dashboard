import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { FIREBASE_API } from "src/config-global";
import { getStorage } from 'firebase/storage';

const firebaseApp = initializeApp(FIREBASE_API);

const db = getFirestore(firebaseApp);

const storage = getStorage(firebaseApp);

export { firebaseApp, db, storage };