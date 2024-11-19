import "./App.css";
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "./redux/store.js";
import { setUserToken, clearUserToken } from "./redux/features/userSlice.js";

import { auth } from "./assets/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import Background from "./Components/Homepage/Components/Background/Background.jsx";
import Login from "./Components/Login/Login";
import SignUp from "./Components/SignUp/SignUp";
import ForgotPW from "./Components/Login/forgotPW";
import Dashboard from "./Components/Dashboard/Dashboard.jsx";
import MultiStepForm from "./Components/MultiStep/MultiStepForm.jsx";
import Loading from "./Components/Loading/Loading.jsx";
import PresentationDetail from "./Components/Dashboard/PresentationDetail.jsx";

function App() {
  const heroData = [
    { text1: "자신감 있는 발표", text2: "GestureFlow와 함께" },
    { text1: "Indulge", text2: "your passions" },
    { text1: "Give in to", text2: "your passions" },
  ];

  const [heroCount, setHeroCount] = useState(0);
  const [playStatus, setPlayStatus] = useState(false);
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          dispatch(setUserToken(token));
          setLogged(true);
        } catch (error) {
          console.error("Error getting token:", error);
          dispatch(clearUserToken());
          setLogged(false);
        }
      } else {
        dispatch(clearUserToken());
        setLogged(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    console.log("로그인 상태: ", logged);
  }, [logged]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Background
                heroData={heroData[heroCount]}
                heroCount={heroCount}
                playStatus={playStatus}
                setHeroCount={setHeroCount}
                setPlayStatus={setPlayStatus}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgotpw" element={<ForgotPW />} />
          <Route
            path="/multistepform"
            element={logged ? <MultiStepForm /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={logged ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/p/:meetingID"
            element={logged ? <PresentationDetail /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
