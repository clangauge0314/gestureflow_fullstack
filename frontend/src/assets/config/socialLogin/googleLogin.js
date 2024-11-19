import { auth, db, provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const googleLogin = async (setMessage, navigate) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    setMessage("구글 로그인에 성공했습니다!");
    navigate("/multistepform", {
      state: { userName: user.displayName, email: user.email },
    });
  } catch (error) {
    setMessage(`구글 로그인 오류: ${error.message}`);
  }
};

export default googleLogin;
