import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import ReactPlayer from "react-player";
import Papa from "papaparse";
import { useTable } from "react-table";
import HorizontalBarChart from "./HorizontalBarChart";
import analyzeData from "../../assets/config/openai/openai";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./PresentationDetail.css";
import SidebarDetail from "./SidebarDetail";
import abkoCameraImage from "../../assets/images/abkoCamera.png";
import arduinoImage from "../../assets/images/arduino.png";
import ProgressBar from "@ramonak/react-progress-bar";

const PresentationDetail = () => {
  const { meetingID } = useParams();
  const userToken = useSelector((state) => state.user.userToken);

  const socketRef = useRef(null);
  const playerRef = useRef(null);
  const [presentationData, setPresentationData] = useState(null);
  const [fileUrls, setFileUrls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [notebookStatus, setNotebookStatus] = useState("");
  const [arduinoStatus, setArduinoStatus] = useState("");
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [isStartButtonDisabled, setIsStartButtonDisabled] = useState(false);

  const [getDataStatus, setGetDataStatus] = useState("초기 설정 중..");
  const [startTime, setStartTime] = useState("");
  const [remainingTime, setRemainingTime] = useState("");
  const [progress, setProgress] = useState(0);

  const [tableData, setTableData] = useState([]);
  const [displayData, setDisplayData] = useState([]);

  const [secondTableData, setSecondTableData] = useState([]);
  const [secondDisplayData, setSecondDisplayData] = useState([]);

  const [arduinoData, setArduinoData] = useState([]);
  const [displayArduinoData, setDisplayArduinoData] = useState([]);

  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [videoTimelines, setVideoTimelines] = useState([]);
  const [aiFeedbacks, setAiFeedbacks] = useState([]);
  const [displayFeedback, setDisplayFeedback] = useState("");

  useEffect(() => {
    const fetchPresentationData = async () => {
      if (!userToken || !meetingID) {
        setError("Missing user token or meeting ID.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://183.107.128.217:3000/api/get-presentationstatus",
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            params: { meetingID: meetingID },
          }
        );

        if (response.data && response.data.data.length > 0) {
          setPresentationData(response.data.data[0]);
        } else {
          setError("No data available for this presentation.");
        }
      } catch (error) {
        setError("Failed to fetch presentation data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresentationData();
  }, [userToken, meetingID]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!fileUrls && presentationData && presentationData.interrupted) {
        try {
          const response = await axios.get(
            "http://183.107.128.217:3000/api/get-urls",
            {
              headers: { Authorization: `Bearer ${userToken}` },
              params: { meetingID: meetingID },
            }
          );
          setFileUrls(response.data.data);
        } catch (err) {
          console.error("Error fetching file URLs:", err.message);
        }
      }

      if (fileUrls && fileUrls.movement_csv && tableData.length === 0) {
        Papa.parse(fileUrls.movement_csv, {
          download: true,
          header: true,
          complete: (result) => {
            setTableData(result.data);
          },
        });
      }

      if (fileUrls && fileUrls.audio_csv && secondTableData.length === 0) {
        await new Promise((resolve) => {
          Papa.parse(fileUrls.audio_csv, {
            download: true,
            header: true,
            complete: (result) => {
              setSecondTableData(result.data);
              resolve();
            },
          });
        });
      }

      if (arduinoData.length === 0) {
        try {
          const response = await axios.get(
            "http://183.107.128.217:3000/api/get-arduino-data",
            {
              headers: { Authorization: `Bearer ${userToken}` },
              params: { meetingID },
            }
          );

          const loadedArduinoData = response.data.map((item, index) => {
            const minutes = Math.floor(index / 60);
            const seconds = index % 60;
            const Timestamp = `${String(minutes).padStart(2, "0")}:${String(
              seconds
            ).padStart(2, "0")}`;
            return { ...item, Timestamp };
          });

          setArduinoData(loadedArduinoData);
        } catch (error) {
          console.error("Error fetching Arduino data:", error);
        }
      }
    };

    loadAllData();
  }, [
    fileUrls,
    userToken,
    meetingID,
    presentationData,
    tableData,
    secondTableData,
    arduinoData,
  ]);

  useEffect(() => {
    const checkRecordCount = async () => {
      try {
        const response = await axios.get(
          "http://183.107.128.217:3000/api/get-feedback-record",
          {
            headers: { Authorization: `Bearer ${userToken}` },
            params: { meetingID },
          }
        );

        setVideoTimelines(response.data.videoTimelines);
        setAiFeedbacks(response.data.aiFeedbacks);

        if (
          !isAnalyzed &&
          response.data.count === 0 &&
          tableData.length > 0 &&
          secondTableData.length > 0 &&
          arduinoData.length > 0
        ) {
          const combinedData = {
            movementData: tableData,
            audioData: secondTableData,
            arduinoData: arduinoData,
          };
          analyzeData(combinedData, meetingID);
          setIsAnalyzed(true);
        } else {
          console.log(
            "이미 Gemini 1.5 Flash가 발표 데이터 분석을 완료했습니다."
          );
          setIsAnalyzed(true);
          return;
        }
      } catch (error) {
        setIsAnalyzed(false);
        console.error("Error fetching record count:", error);
      }
    };

    checkRecordCount();
  }, [tableData, secondTableData, arduinoData, isAnalyzed, meetingID]);

  const handleProgress = (progress) => {
    const currentTime = progress.playedSeconds;

    if (currentTime === 0) {
      setDisplayData(tableData.slice(0, 5));
      setSecondDisplayData(secondTableData.slice(0, 5));
      setDisplayArduinoData(arduinoData.slice(0, 3));
      setDisplayFeedback("");
      return;
    }

    const startIndex = binarySearch(
      tableData,
      currentTime,
      convertTimestampToSeconds
    );
    const endIndex = binarySearch(
      tableData,
      currentTime + 5,
      convertTimestampToSeconds
    );
    setDisplayData(tableData.slice(startIndex, endIndex).slice(0, 5));

    const startIndex2 = binarySearch(
      secondTableData,
      currentTime,
      convertTimestampToSeconds
    );
    const endIndex2 = binarySearch(
      secondTableData,
      currentTime + 5,
      convertTimestampToSeconds
    );
    setSecondDisplayData(
      secondTableData.slice(startIndex2, endIndex2).slice(0, 5)
    );

    const arduinoStartIndex = binarySearch(
      arduinoData,
      currentTime,
      convertTimestampToSeconds
    );
    const arduinoEndIndex = binarySearch(
      arduinoData,
      currentTime + 3,
      convertTimestampToSeconds
    );
    setDisplayArduinoData(
      arduinoData.slice(arduinoStartIndex, arduinoEndIndex).slice(0, 4)
    );

    const feedbackIndex = findFeedbackIndex(currentTime);
    if (feedbackIndex !== -1) {
      setDisplayFeedback(aiFeedbacks[feedbackIndex]);
    } else {
      setDisplayFeedback("해당 시간에 피드백 없음");
    }
  };

  const binarySearch = (data, targetTime, convertFn) => {
    let left = 0;
    let right = data.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = convertFn(data[mid]["Timestamp"]);

      if (midTime < targetTime) {
        left = mid + 1;
      } else if (midTime > targetTime) {
        right = mid - 1;
      } else {
        return mid;
      }
    }
    return left;
  };

  const convertTimestampToSeconds = (timestamp) => {
    if (!timestamp) {
      return 0;
    }

    const parts = timestamp.split(":");
    if (parts[2]) {
      return (
        parseInt(parts[0], 10) * 60 +
        parseInt(parts[1], 10) +
        parseInt(parts[2], 10) / 1000
      );
    } else {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
  };

  const findFeedbackIndex = (currentTime) => {
    for (let i = 0; i < videoTimelines.length; i++) {
      if (
        convertTimestampToSeconds(videoTimelines[i]) <= currentTime &&
        currentTime < convertTimestampToSeconds(videoTimelines[i]) + 10
      ) {
        return i;
      }
    }
    return -1;
  };

  const columns = useMemo(
    () =>
      tableData.length > 0
        ? Object.keys(tableData[0]).map((key) => ({
            Header: key,
            accessor: key,
          }))
        : [],
    [tableData]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data: displayData });

  const secondColumns = useMemo(
    () =>
      secondTableData.length > 0
        ? Object.keys(secondTableData[0])
            .slice(0, 7)
            .map((key) => ({
              Header: key,
              accessor: key,
            }))
        : [],
    [secondTableData]
  );

  const {
    getTableProps: getSecondTableProps,
    getTableBodyProps: getSecondTableBodyProps,
    headerGroups: secondHeaderGroups,
    rows: secondRows,
    prepareRow: prepareSecondRow,
  } = useTable({ columns: secondColumns, data: secondDisplayData });

  const arduinoColumns = useMemo(
    () => [
      { Header: "Timestamp", accessor: "Timestamp" },
      { Header: "Heart Rate", accessor: "heart_rate" },
      { Header: "Accelerometer Data", accessor: "accelerometer_data" },
    ],
    []
  );

  const {
    getTableProps: getArduinoTableProps,
    getTableBodyProps: getArduinoTableBodyProps,
    headerGroups: arduinoHeaderGroups,
    rows: arduinoRows,
    prepareRow: prepareArduinoRow,
  } = useTable({ columns: arduinoColumns, data: displayArduinoData });

  const formatScheduledTime = (scheduledTime) => {
    const date = new Date(scheduledTime);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleStartClick = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const confirmStart = () => {
    toast.dismiss();
    setIsWebSocketConnected(true);
    setShowPopup(false);
    setConnectionStatus("웹 소켓과 연결을 시도 중입니다...");
    setNotebookStatus("노트북 상태: 연결 대기 중...");
    setArduinoStatus("아두이노 상태: 연결 대기 중...");

    socketRef.current = new WebSocket("ws://183.107.128.217:8080");

    socketRef.current.onopen = () => {
      socketRef.current.send(JSON.stringify({ deviceType: "react" }));
      setConnectionStatus("웹 소켓과 연결되었습니다.");
      toast.success("웹 소켓 연결에 성공했습니다!", {
        autoClose: 3000,
      });
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.clientCount === undefined) {
        console.log("undefined");
        message.clientCount = 3;
      }

      if (message.message === "countdown") {
        setRemainingTime(message.remainingTime);
        const [minutes, seconds] = message.remainingTime
          .replace("분", "")
          .replace("초", "")
          .split(" ")
          .map(Number);
        const remainingTimeInSeconds = minutes * 60 + seconds;
        const totalDurationInSeconds = presentationData.scheduled_duration * 60;
        const calculatedProgress =
          ((totalDurationInSeconds - remainingTimeInSeconds) /
            totalDurationInSeconds) *
          100;
        setProgress(calculatedProgress);
      }

      if (message.message === "current_time") {
        setStartTime(message.current_time);
      }

      if (message.message === "get_start") {
        console.log("message.clientCount:", message.clientCount);
        setGetDataStatus(`Client count: ${message.clientCount}`);
      }

      if (message.status === "arduino_connected") {
        setArduinoStatus("아두이노 상태: 연결 완료");
        toast.success("아두이노가 웹 소켓에 연결되었습니다!", {
          autoClose: 3000,
        });
      }

      if (message.status === "notebook_connected") {
        setNotebookStatus("노트북 상태: 연결 완료");
        toast.success("노트북이 웹 소켓에 연결되었습니다!", {
          autoClose: 3000,
        });
      }

      if (message.status === "notebook_disconnected") {
        setNotebookStatus("노트북 상태: 연결 대기 중...");
        toast.warning("노트북 연결이 해제되었습니다.", {
          autoClose: 3000,
        });
      }

      if (message.status === "arduino_disconnected") {
        setArduinoStatus("아두이노 상태: 연결 대기 중...");
        toast.warning("아두이노 연결이 해제되었습니다.", {
          autoClose: 3000,
        });
      }

      if (message.clientCount == 3) {
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          setShowClientPopup(true);
          setGetDataStatus("react에서 웹 소켓으로 시작 메세지 전송 성공");
          console.log("react에서 웹 소켓으로 메세지 전송 성공");
        } else {
          setGetDataStatus("react에서 웹 소켓으로 메세지 전송 실패");
          console.log("react에서 웹 소켓으로 메세지 전송 실패");
        }
      } else {
        setShowClientPopup(false);
      }

      console.log(message.clientCount);
    };

    socketRef.current.onerror = () => {
      setConnectionStatus("웹 소켓 연결에 실패했습니다.");
      toast.error("웹 소켓 연결 실패", { autoClose: 3000 });
    };

    socketRef.current.onclose = () => {
      setConnectionStatus("웹 소켓 연결이 종료되었습니다.");
      toast.info("웹 소켓 연결을 종료합니다.");
    };
  };

  const handleStart = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setIsStartButtonDisabled(true);
      socketRef.current.send(
        JSON.stringify({
          message: "get_start",
          apiKey: meetingID,
          duration: presentationData.scheduled_duration,
        })
      );
      toast.success(
        "시작하기 버튼이 클릭되었습니다. 웹 소켓으로 시작 메시지를 보냈습니다.",
        {
          autoClose: 3000,
        }
      );
    } else {
      toast.error("웹 소켓이 연결되어 있지 않습니다.", { autoClose: 3000 });
    }
  };

  const handleExit = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: "interrupt" }));
      toast.success(
        "종료하기 버튼이 클릭되었습니다. 웹 소켓으로 인터럽트 메시지를 보냈습니다.",
        {
          autoClose: 3000,
        }
      );
    } else {
      toast.error("웹 소켓이 연결되어 있지 않습니다.", { autoClose: 3000 });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="component-body">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <div className="dashboard">
        <SidebarDetail />
        <div className="presentation-content">
          {presentationData && presentationData.interrupted ? (
            <div className="content-centered">
              {fileUrls ? (
                <div className="result-container">
                  <div className="result-header">발표 결과 페이지</div>
                  <div className="result-main-content">
                    <div
                      style={{ maxWidth: "1400px", maxHeight: "800px" }}
                      className="result-left-panel"
                    >
                      {" "}
                      <div className="video-container">
                        <div className="video-frame">
                          <ReactPlayer
                            ref={playerRef}
                            url={fileUrls.mediapipe_video}
                            controls
                            width="100%"
                            height="100%"
                            onProgress={handleProgress}
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="result-right-panel"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <div style={{ flex: "7", overflowY: "auto" }}>
                        <h2>Arduino Data Table</h2>
                        <table
                          {...getArduinoTableProps()}
                          style={{ width: "100%", border: "1px solid gray" }}
                        >
                          <thead>
                            {arduinoHeaderGroups.map((headerGroup) => (
                              <tr
                                {...headerGroup.getHeaderGroupProps()}
                                key={headerGroup.id}
                              >
                                {headerGroup.headers.map((column) => (
                                  <th
                                    {...column.getHeaderProps()}
                                    style={{
                                      borderBottom: "solid 3px blue",
                                      background: "aliceblue",
                                      fontWeight: "bold",
                                      padding: "8px",
                                    }}
                                    key={column.id}
                                  >
                                    {column.render("Header")}
                                  </th>
                                ))}
                              </tr>
                            ))}
                          </thead>
                          <tbody {...getArduinoTableBodyProps()}>
                            {arduinoRows.map((row) => {
                              prepareArduinoRow(row);
                              return (
                                <tr {...row.getRowProps()} key={row.id}>
                                  {row.cells.map((cell) => (
                                    <td
                                      {...cell.getCellProps()}
                                      style={{
                                        padding: "8px",
                                        border: "solid 1px gray",
                                        background: "white",
                                      }}
                                      key={cell.column.id}
                                    >
                                      {cell.render("Cell")}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div
                        style={{
                          flex: "3",
                          padding: "8px",
                          borderTop: "1px solid gray",
                        }}
                      >
                        <h2>AI 피드백</h2>
                        {isAnalyzed ? (
                          <p>{displayFeedback}</p>
                        ) : (
                          <p>AI가 발표 데이터를 분석중입니다...</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="result-footer">
                    <HorizontalBarChart
                      data={tableData}
                      arduinoData={arduinoData}
                    />
                  </div>
                  <div
                    className="result-bottom-left"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    <h3>Movement Data</h3>
                    <table
                      {...getTableProps()}
                      style={{ width: "100%", border: "1px solid gray" }}
                    >
                      <thead>
                        {headerGroups.map((headerGroup) => (
                          <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                              <th {...column.getHeaderProps()} key={column.id}>
                                {column.render("Header")}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody {...getTableBodyProps()}>
                        {rows.map((row, index) => {
                          prepareRow(row);
                          return (
                            <tr
                              {...row.getRowProps()}
                              key={row.id}
                              style={{
                                backgroundColor:
                                  index === 0 ? "#d3d3d3" : "white",
                              }}
                            >
                              {row.cells.map((cell) => (
                                <td
                                  {...cell.getCellProps()}
                                  key={cell.column.id}
                                >
                                  {cell.render("Cell")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="result-bottom-right">
                    <h3>Audio Data</h3>
                    <table
                      {...getSecondTableProps()}
                      style={{ width: "100%", border: "1px solid gray" }}
                    >
                      <thead>
                        {secondHeaderGroups.map((headerGroup) => (
                          <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                              <th {...column.getHeaderProps()} key={column.id}>
                                {column.render("Header")}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody {...getSecondTableBodyProps()}>
                        {secondRows.map((row, index) => {
                          prepareSecondRow(row);
                          return (
                            <tr
                              {...row.getRowProps()}
                              key={row.id}
                              style={{
                                backgroundColor:
                                  index === 0 ? "#d3d3d3" : "white",
                              }}
                            >
                              {row.cells.map((cell) => (
                                <td
                                  {...cell.getCellProps()}
                                  key={cell.column.id}
                                >
                                  {cell.render("Cell")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p>파일 정보를 가져오는 중입니다...</p>
              )}
            </div>
          ) : showClientPopup ? (
            <div className="content-centered">
              <h2>데이터 수집 페이지</h2>
              <p>{getDataStatus}</p>
              <div>
                <p>
                  발표 시작 시간: <span id="startTime">{startTime}</span>
                </p>
                <p>
                  발표 시간:{" "}
                  <span id="presentationDuration">
                    {remainingTime} / {presentationData.scheduled_duration}분
                  </span>
                </p>
              </div>

              <ProgressBar
                completed={parseFloat(progress.toFixed(2))}
                width="600px"
                height="30px"
                bgColor="#234bc0"
              />

              <div className="image-container">
                <div className="image-with-logs">
                  <img
                    src={abkoCameraImage}
                    alt="abkoCamera"
                    className="image-left"
                  />
                  <textarea
                    className="log-textarea"
                    placeholder="노트북 로그"
                    readOnly
                  ></textarea>
                </div>
                <div className="image-with-logs">
                  <img
                    src={arduinoImage}
                    alt="arduino"
                    className="image-right"
                  />
                  <textarea
                    className="log-textarea"
                    placeholder="아두이노 로그"
                    readOnly
                  ></textarea>
                </div>
              </div>
              <div className="button-container">
                <button
                  className="start-button"
                  onClick={handleStart}
                  disabled={isStartButtonDisabled}
                >
                  시작하기
                </button>
                <button className="exit-button" onClick={handleExit}>
                  종료하기
                </button>
              </div>
            </div>
          ) : presentationData ? (
            <div className="content-centered">
              <h2>발표 상세 정보</h2>
              <div>
                <strong>발표 시작 예정 시간:</strong>{" "}
                {formatScheduledTime(presentationData.scheduled_start_time)}
              </div>
              <div>
                <strong>발표 예정 시간:</strong>{" "}
                {presentationData.scheduled_duration} 분
              </div>
              <div>
                <strong>발표 시작 여부:</strong>{" "}
                {presentationData.has_started ? "Yes" : "No"}
              </div>
              <button className="started-yet" onClick={handleStartClick}>
                발표 시작하기
              </button>
              {isWebSocketConnected && connectionStatus && (
                <div
                  className={`connection-status ${
                    connectionStatus.includes("연결되었습니다")
                      ? "connected"
                      : "connecting"
                  }`}
                >
                  {connectionStatus}
                </div>
              )}
              {isWebSocketConnected && notebookStatus && (
                <div
                  className={`connection-status ${
                    notebookStatus.includes("연결 완료")
                      ? "connected"
                      : "connecting"
                  }`}
                >
                  {notebookStatus}
                </div>
              )}

              {isWebSocketConnected && arduinoStatus && (
                <div
                  className={`connection-status ${
                    arduinoStatus.includes("연결 완료")
                      ? "connected"
                      : "connecting"
                  }`}
                >
                  {arduinoStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="component-body">
              <div className="dashboard">
                <div className="content-centered">
                  <p>발표 데이터를 찾을 수 없습니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>정말로 발표를 시작하시겠습니까?</h3>
            <div className="popup-buttons">
              <button className="popup-button" onClick={confirmStart}>
                네
              </button>
              <button className="popup-button" onClick={closePopup}>
                아니오
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationDetail;
