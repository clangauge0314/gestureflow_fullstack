import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./Login.css";
import { FaGoogle, FaGithub, FaFacebook } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";

import {
  auth,
  signInWithEmailAndPassword,
} from "../../assets/config/firebaseConfig";
import googleLogin from "../../assets/config/socialLogin/googleLogin";
import githubLogin from "../../assets/config/socialLogin/githubLogin";
import facebookLogin from "../../assets/config/socialLogin/facebookLogin";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [Message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        setMessage("이메일 인증이 필요합니다. 메일을 확인해주세요.");
        return;
      }

      setMessage("로그인에 성공했습니다!");
      navigate("/multistepform", { state: { userName: user.displayName, email: user.email } });
    } catch (error) {
      setMessage(`로그인 실패: ${error.message}`);
    }
  };

  return (
    <>
      <div>
        <Helmet>
          <title>GestureFlow Login</title>
        </Helmet>
      </div>
      <div className="login-wrapper">
        <div className="form">
          <div className="container">
            <div className="header"></div>
            <div className="text">로그인하기</div>
          </div>
          <div className="social-login">
            <div
              className="google-login"
              onClick={() => googleLogin(setMessage, navigate)}
            >
              <FaGoogle className="social-icons" />
              구글 계정 로그인
            </div>
            <div
              className="github-login"
              onClick={() => githubLogin(setMessage, navigate)}
            >
              <FaGithub className="social-icons" />
              깃허브 계정 로그인
            </div>
            <div
              className="facebook-login"
              onClick={() => facebookLogin(setMessage, navigate)}
            >
              <FaFacebook className="social-icons" />
              페이스북 계정 로그인
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
          <div className="forgot-password">
            비밀번호를 찾으시려면{" "}
            <span onClick={() => navigate("/forgotpw")}>
              여기를 클릭하세요!
            </span>
          </div>
          <div
            className={`showMessage ${
              Message.includes("성공") ? "success" : "error"
            }`}
          >
            {Message}
          </div>
          <div className="submit-container">
            <div className="submit" onClick={handleLogin}>
              로그인
            </div>
            <div className="submit gray" onClick={() => navigate("/signup")}>
              회원가입
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
