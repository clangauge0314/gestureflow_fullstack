import { auth, db, github_provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const githubLogin = async (setMessage, navigate) => {
  try {
    const result = await signInWithPopup(auth, github_provider);
    const user = result.user;

    const username = user.displayName || user.email.split("@")[0];

    setMessage("깃허브 로그인에 성공했습니다!");
    navigate("/multistepform", {
      state: { userName: user.displayName, email: user.email },
    });
  } catch (error) {
    setMessage(`깃허브 로그인 오류: ${error.message}`);
  }
};

export default githubLogin;
