import "./Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className="nav">
      <div className="nav-logo">GestureFlow</div>
      <ul className="nav-menu">
        <li>Home</li>
        <li>Explore</li>
        <li>About</li>
        <li className="nav-start" onClick={() => navigate("/login")}>시작하기!</li>
      </ul>
    </div>
  );
};

export default Navbar;
