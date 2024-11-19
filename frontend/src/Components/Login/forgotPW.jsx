import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./forgotPW.css";
import { MdOutlineEmail } from "react-icons/md";

import {
  auth,
  sendPasswordResetEmail,
} from "../../assets/config/firebaseConfig";

const forgotPW = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("비밀번호 재설정 메일 전송을 성공했습니다.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setMessage("등록되지 않은 이메일입니다.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("유효하지 않은 이메일 주소입니다.");
      } else {
        setMessage(`이메일 전송 실패: ${error.message}`);
      }
    }
  };

  return (
    <>
      <div>
        <Helmet>
          <title>GestureFlow Forgot Password</title>
        </Helmet>
      </div>
      <div className="forgotPW-wrapper">
        <div className="form">
          <div className="container">
            <div className="header"></div>
            <div className="text">비밀번호 찾기</div>
            <div className="context">
              가입하신 이메일로 비밀번호 초기화 메일을 보내드립니다.
            </div>
          </div>
          <div className="inputs">
            <div className="input">
              <MdOutlineEmail className="icons" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <div className="submit" onClick={handlePasswordReset}>
              초기화 메일 보내기
            </div>
            <div className="submit" onClick={() => navigate("/login")}>
              로그인
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default forgotPW;
