import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import axios from "axios";

import { useSelector } from "react-redux";

import "./MultiStepForm.css";
import arudino_image from "../../assets/images/arduino.png";
import abkocamera_image from "../../assets/images/abkocamera.png";

import { db } from "../../assets/config/firebaseConfig";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

const MultiStepForm = () => {
  const location = useLocation();
  const { userName, email } = location.state || {
    userName: "Guest",
    email: "guest@example.com",
  };
  const userToken = useSelector((state) => state.user.userToken);

  const [step, setStep] = useState(1);
  const [minDateTime, setMinDateTime] = useState("");
  const [isArduinoConnected, setIsArduinoConnected] = useState(true);
  const [isAbkoCameraConnected, setIsAbkoCameraConnected] = useState(true);
  const [formData, setFormData] = useState({
    meetingID: "",
    presenter_name: userName || "Guest",
    presenter_email: email || "guest@example.com",
    scheduled_start_time: "",
    scheduled_duration: 0,
    actual_start_time: null,
    actual_duration: null,
    interrupted: false,
  });

  useEffect(() => {
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0, 16);
    setMinDateTime(formattedDateTime);
  }, []);

  const titleData = [
    { title: `${userName}님 환영합니다! <br /> Meeting ID를 생성해주세요.` },
    { title: "발표 시작 일시 및 발표 시간을 입력하세요." },
    { title: "아두이노 및 카메라 연결 상태를 확인하세요." },
  ];

  const totalSteps = 3;
  const navigate = useNavigate();

  const formatDateForMySQL = (isoDate) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const nextStep = () => {
    if (step === 1 && !formData.meetingID) {
      alert("Meeting ID가 비어 있습니다. 먼저 Meeting ID를 생성해주세요.");
      return;
    }
    if (
      step === 2 &&
      (!formData.scheduled_start_time || !formData.scheduled_duration)
    ) {
      alert("시작 일시 및 발표 시간이 비어 있습니다.");
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleChange = (input) => (e) => {
    setFormData({ ...formData, [input]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://183.107.128.217:3000/api/insert-presentations-table",
        formData,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (response.status === 200) {
        alert("발표정보가 정상적으로 데이터베이스에 저장되었습니다.");
        navigate("/dashboard");
      } else {
        alert("저장 도중 에러가 발생했습니다.");
      }
    } catch (error) {
      alert("저장 도중 에러가 발생했습니다.", error);
    }
  };

  const generateMeetingID = async () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let meetingID = "";

    for (let i = 0; i < 30; i++) {
      meetingID += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    try {
      const response = await axios.post(
        "http://183.107.128.217:3000/api/create-database",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          meeting_id: meetingID,
        }
      );

      if (response.status === 200) {
        setFormData({ ...formData, meetingID });

        const meetingDocRef = doc(db, "meetings", email);
        const docSnapshot = await getDoc(meetingDocRef);

        if (docSnapshot.exists()) {
          await updateDoc(meetingDocRef, {
            meetingIDs: arrayUnion(meetingID),
          });
        } else {
          await setDoc(meetingDocRef, {
            meetingIDs: [meetingID],
          });
        }

        alert("Meeting ID 생성 및 데이터베이스 생성 성공");
      } else {
        alert("Meeting ID 생성 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("Meeting ID 생성 오류:", error);
    }
  };

  const handleArduinoRefresh = async (
    arduino_status_post_time,
    is_arduino_operational,
    message
  ) => {
    const formattedDate = formatDateForMySQL(arduino_status_post_time);

    try {
      const response = await axios.post(
        "http://183.107.128.217:3000/api/update-arduino-status",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          meeting_id: formData.meetingID,
          arduino_status_post_time: formattedDate,
          is_arduino_operational,
          message,
        }
      );

      if (response.status === 200) {
        console.log("아두이노 상태가 성공적으로 업데이트되었습니다.");
      } else {
        console.log("아두이노 상태 업데이트 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("아두이노 상태 업데이트 오류:", error);
    }
  };

  const refreshArduinoStatus = async () => {
    try {
      const now = new Date().toISOString();
      const response = await axios.get(
        "http://183.107.128.217:3000/api/get-arduino-status"
      );

      let message = "";

      if (response.data === "success") {
        setIsArduinoConnected(true);
        message = "아두이노 정상 작동 중";
      } else {
        setIsArduinoConnected(false);
        alert("아두이노 상태를 확인할 수 없습니다.");
        message = "아두이노 상태를 확인할 수 없습니다.";
      }

      await handleArduinoRefresh(now, isArduinoConnected, message);
    } catch (error) {
      setIsArduinoConnected(false);
      const errorMessage = error.response
        ? `Error fetching camera status: ${error.response.data.message}`
        : error.request
        ? "No response received from the server."
        : `An error occurred: ${error.message}`;

      alert(errorMessage);

      await handleArduinoRefresh(
        new Date().toISOString(),
        isArduinoConnected,
        errorMessage
      );
    }
  };

  const refreshAbkoCameraStatus = async () => {
    try {
      const now = new Date().toISOString();
      const response = await axios.get(
        "http://183.107.128.217:3000/api/get-camera-status"
      );

      let message = "";
      if (response.data.message === "success") {
        setIsAbkoCameraConnected(true);
        message = "카메라 정상 작동 중";
      } else {
        setIsAbkoCameraConnected(false);
        alert("카메라 상태를 확인할 수 없습니다.");
        message = "카메라 상태를 확인할 수 없습니다.";
      }

      await handleCameraRefresh(now, isAbkoCameraConnected, message);
    } catch (error) {
      setIsAbkoCameraConnected(false);
      const errorMessage = error.response
        ? `Error fetching camera status: ${error.response.data.message}`
        : error.request
        ? "No response received from the server."
        : `An error occurred: ${error.message}`;

      alert(errorMessage);

      await handleCameraRefresh(
        new Date().toISOString(),
        isAbkoCameraConnected,
        errorMessage
      );
    }
  };

  const handleCameraRefresh = async (
    camera_status_post_time,
    is_camera_operational,
    message
  ) => {
    const formattedDate = formatDateForMySQL(camera_status_post_time);

    try {
      const response = await axios.post(
        "http://183.107.128.217:3000/api/update-camera-status",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          meeting_id: formData.meetingID,
          camera_status_post_time: formattedDate,
          is_camera_operational,
          message,
        }
      );

      if (response.status === 200) {
        console.log("카메라 상태가 성공적으로 업데이트되었습니다.");
      } else {
        console.log("카메라 상태 업데이트 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("카메라 상태 업데이트 오류:", error);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <>
      <Helmet>
        <title>GestureFlow SignUp MultiStep</title>
      </Helmet>
      <div className="multi-step-wrapper">
        <div className="form">
          <div className="container">
            <div className="header"></div>
            <div
              className="text"
              dangerouslySetInnerHTML={{ __html: titleData[step - 1].title }}
            ></div>
          </div>

          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="inputs">
            {step === 1 && (
              <div className="input-group">
                <input
                  type="text"
                  className="meetingid_input"
                  placeholder="Meeting ID"
                  value={formData.meetingID}
                  onChange={handleChange("meetingID")}
                  disabled
                />
                <button className="generate-btn" onClick={generateMeetingID}>
                  생성하기
                </button>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="inputContainer">
                  <label className="meeting_label" htmlFor="startDate">
                    발표 시작 일시
                  </label>
                  <input
                    className="inputField"
                    type="datetime-local"
                    id="startDate"
                    value={formData.scheduled_start_time}
                    min={minDateTime}
                    onChange={handleChange("scheduled_start_time")}
                  />
                </div>
                <div className="inputContainer">
                  <label className="meeting_label" htmlFor="duration">
                    발표 시간
                  </label>
                  <input
                    className="inputField"
                    type="number"
                    id="duration"
                    value={formData.scheduled_duration}
                    onChange={handleChange("scheduled_duration")}
                    placeholder="발표 시간을 입력하세요"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="images">
                <div className="image-container">
                  <img
                    src={arudino_image}
                    alt="Arduino"
                    className="device-image"
                  />
                  <div className="status-container">
                    <span
                      className={`status ${
                        isArduinoConnected ? "connected" : "disconnected"
                      }`}
                    >
                      연결 상태: {isArduinoConnected ? "연결됨" : "연결 안됨"}
                    </span>
                    <button
                      className="refresh-btn"
                      onClick={refreshArduinoStatus}
                    >
                      새로고침
                    </button>
                  </div>
                </div>
                <div className="image-container">
                  <img
                    src={abkocamera_image}
                    alt="ABKO Camera"
                    className="device-image"
                  />
                  <div className="status-container">
                    <span
                      className={`status ${
                        isAbkoCameraConnected ? "connected" : "disconnected"
                      }`}
                    >
                      연결 상태:{" "}
                      {isAbkoCameraConnected ? "연결됨" : "연결 안됨"}
                    </span>
                    <button
                      className="refresh-btn"
                      onClick={refreshAbkoCameraStatus}
                    >
                      새로고침
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="step-buttons">
            {step > 1 && (
              <div className="submit gray" onClick={prevStep}>
                이전
              </div>
            )}
            {step < totalSteps ? (
              <>
                {step === 1 && (
                  <div
                    className="submit"
                    onClick={() => navigate("/dashboard")}
                  >
                    대시보드로 이동
                  </div>
                )}
                <div className="submit" onClick={nextStep}>
                  다음
                </div>
              </>
            ) : (
              <div
                className={`submit ${
                  !isArduinoConnected || !isAbkoCameraConnected
                    ? "disabled"
                    : ""
                }`}
                onClick={
                  !isArduinoConnected || !isAbkoCameraConnected
                    ? null
                    : handleSubmit
                }
              >
                시작하기
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MultiStepForm;
