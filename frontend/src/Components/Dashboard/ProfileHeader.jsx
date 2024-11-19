import React from "react";
import { BiEdit } from "react-icons/bi";

const ProfileHeader = () => {
  return (
    <div className="profile--header">
      <h2 className="header--title">개인 프로필</h2>
      <div className="edit">
        <BiEdit className="icon" />
      </div>
    </div>
  );
};

export default ProfileHeader;
