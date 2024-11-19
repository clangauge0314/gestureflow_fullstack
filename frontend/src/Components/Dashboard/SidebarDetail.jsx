import React from "react";
import "./Sidebar.css";
import {
  BiBookAlt,
  BiHome,
} from "react-icons/bi";

const Sidebar = () => {
  return (
    <div className="menu">
      <div className="logo">
        <BiBookAlt className="logo-icon" />
        <h2>GestureFlow</h2>
      </div>

      <div className="menu--list">
        <a href="/dashboard" className="item">
          <BiHome className="icon" />
          Dashboard
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
