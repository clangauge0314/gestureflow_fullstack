import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_4RrFLE22YNOTg6AaELazMmX5E8-LPYY",
  authDomain: "arduino-raspi-authentication.firebaseapp.com",
  projectId: "arduino-raspi-authentication",
  storageBucket: "arduino-raspi-authentication.appspot.com",
  messagingSenderId: "3996977439",
  appId: "1:3996977439:web:804acc940db80e272a882a",
  measurementId: "G-41ZVQ7HWC7",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const github_provider = new GithubAuthProvider();
const facebook_provider = new FacebookAuthProvider();

const db = getFirestore(app);

export {
  app,
  auth,
  db,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  provider,
  github_provider,
  facebook_provider,
};
