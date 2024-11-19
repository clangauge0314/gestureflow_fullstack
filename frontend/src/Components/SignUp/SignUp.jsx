import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./SignUp.css";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";

import { auth, db } from "../../assets/config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await sendEmailVerification(user);
      setMessage("회원가입 성공! 이메일 인증을 확인하세요.");
      const meetingDocRef = doc(db, "meetings", "userDocuments"); 
      await setDoc(meetingDocRef, {});
    } catch (error) {
      setMessage(`회원가입 오류: ${error.message}`);
    }
  };

  return (
    <>
      <div>
        <Helmet>
          <title>GestureFlow SignUp</title>
        </Helmet>
      </div>
      <div className="signup-wrapper">
        <div className="form">
          <div className="container">
            <div className="header"></div>
            <div className="text">회원가입하기</div>
          </div>
          <div className="inputs">
            <div className="input">
              <FaRegUser className="icons" />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input">
              <MdOutlineEmail className="icons" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input">
              <RiLockPasswordLine className="icons" />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div
            className={`showMessage ${
              message.includes("성공") ? "success" : "error"
            }`}
          >
            {message}
          </div>
          <div className="submit-container">
            <div className="submit gray" onClick={() => navigate("/login")}>
              로그인
            </div>
            <div className="submit" onClick={handleSignUp}>
              회원가입
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
