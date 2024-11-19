import { auth, db, facebook_provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const facebookLogin = async (setMessage, navigate) => {
  try {
    const result = await signInWithPopup(auth, facebook_provider);
    const user = result.user;

    setMessage("페이스북 로그인에 성공했습니다!");
    navigate("/multistepform", {
      state: { userName: user.displayName, email: user.email },
    });

  } catch (error) {
    setMessage(`페이스북 로그인 오류: ${error.message}`);
  }
};

export default facebookLogin;
