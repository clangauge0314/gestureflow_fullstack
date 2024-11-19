import React, { useEffect, useState } from "react";
import { BiBarChartAlt, BiMicrophone, BiPauseCircle } from "react-icons/bi";
import axios from "axios";
import { useSelector } from "react-redux";

const Card = () => {
  const [course, setCourse] = useState([]);

  const userToken = useSelector((state) => state.user.userToken);
  const meetingIDs = useSelector((state) => state.user.meetingIDs);

  useEffect(() => {
    const sendMeetingIDs = async () => {
      if (meetingIDs.length > 0) {
        try {
          const response = await axios.post(
            "http://183.107.128.217:3000/api/get-header-data",
            { meetingIDs },
            {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            }
          );

          if (response.status === 200) {
            const data = response.data.meetings;

            const totalPresentations = meetingIDs.length;
            const remainingPresentations = data.filter(
              (meeting) => meeting.has_started_count === 0
            ).length;
            const totalAiScore = data.reduce(
              (sum, meeting) => sum + (meeting.average_ai_score || 0),
              0
            );
            const averageAiScore = totalPresentations
              ? (totalAiScore / totalPresentations).toFixed(2)
              : 0;

            setCourse([
              {
                title: `총 발표 수: ${totalPresentations}`,
                icon: <BiMicrophone />,
              },
              {
                title: `남은 발표: ${remainingPresentations}`,
                icon: <BiPauseCircle />,
              },
              {
                title: `AI 평균 점수: ${averageAiScore}`,
                icon: <BiBarChartAlt />,
              },
            ]);
          } else {
            console.log("Error fetching data from server.");
          }
        } catch (error) {
          console.log("Error during POST request:", error);
        }
      }
    };

    sendMeetingIDs();
  }, [meetingIDs, userToken]);

  return (
    <div className="card--container">
      {course.map((item, index) => (
        <div className="card" key={index}>
          <div className="card--cover">{item.icon}</div>
          <div className="card--title">
            <h2>{item.title}</h2>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Card;
