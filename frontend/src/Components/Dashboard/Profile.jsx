import React, { useState, useEffect } from "react";
import ProfileHeader from "./ProfileHeader";
import "./Profile.css";
import userImage from "../../assets/images/userImage.png";
import { BiHistory } from "react-icons/bi";

import { signOut } from "firebase/auth";
import { auth } from "../../assets/config/firebaseConfig";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Profile = () => {
  const userToken = useSelector((state) => state.user.userToken);
  const meetingIDs = useSelector((state) => state.user.meetingIDs);

  const [user, setUser] = useState({
    displayName: "Guest",
    email: "Unknown Email",
    photoURL: userImage,
  });

  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        displayName: currentUser.displayName || "Guest",
        email: currentUser.email || "No Email",
        photoURL: currentUser.photoURL || userImage,
      });
    }
  }, []);

  useEffect(() => {
    const sendMeetingIDs = async () => {
      if (meetingIDs.length > 0) {
        try {
          const response = await axios.post(
            "http://183.107.128.217:3000/api/get-scheduled-data",
            { meetingIDs },
            {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            }
          );

          if (response.status === 200) {
            const meetingsData = response.data.meetings;
            const formattedLogs = meetingsData.map((meeting) => ({
              title: `발표날짜: ${formatDate(meeting.scheduled_start_time)}`,
              duration: `발표시간: ${meeting.scheduled_duration}분`,
              icon: <BiHistory />,
            }));

            setLogs(formattedLogs);
          } else {
            console.log("Error fetching data from server.");
          }
        } catch (error) {
          console.log("Error during POST request:", error);
        }
      }
    };

    sendMeetingIDs();
  }, [meetingIDs]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const utcTime = date.getTime() - 9 * 60 * 60 * 1000;
    const localDate = new Date(utcTime);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="profile">
      <ProfileHeader />
      <div className="user--profile">
        <div className="user--detail">
          <img src={user.photoURL} alt="User Profile" />
          <h3 className="username">{user.displayName}</h3>
          <span className="log_span">{user.email}</span>
          <span className="logout" onClick={handleLogout}>
            로그아웃
          </span>
        </div>
        <div className="user--logs">
          <span className="scheduled">예정된 발표일정</span>
          {logs.map((log, index) => (
            <div className="log" key={index}>
              <div className="log--detail">
                <div className="log--cover">{log.icon}</div>
                <div className="log--name">
                  <h4 className="title">{log.title}</h4>
                  <span className="duration">{log.duration}</span>
                </div>
              </div>
              <div className="action"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
