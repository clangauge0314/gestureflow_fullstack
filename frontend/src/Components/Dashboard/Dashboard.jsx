import "./Dashboard.css";
import Sidebar from "./Sidebar.jsx";
import Content from "./Content.jsx";
import Profile from "./Profile.jsx";

import React, { useEffect, useState } from "react";
import { auth, db } from "../../assets/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { setMeetingIDs } from "../../redux/features/userSlice.js";

const Dashboard = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMeetingIDs = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, "meetings", currentUser.email);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.meetingIDs) {
              dispatch(setMeetingIDs(data.meetingIDs));
            }
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching meetingIDs:", error);
        }
      }
    };

    fetchMeetingIDs();
  }, [dispatch]);

  return (
    <div className="component-body">
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard--content">
          <Content />
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
