const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const dotenv = require("dotenv");

const connection = require("./config/connect_db");
const createTables = require("./config/createTables");
const FirebaseAuthMiddleware = require("./middleware/middleware");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(express.json());

dotenv.config();

let cameraStatus = {};
let arduinoStatus = {};

let apiKey = null;

app.get("/api/test", (req, res) => {
  return res.json({
    examples: [
      {
        example_test: "test",
      },
    ],
  });
});

// 노트북 -> 서버 카메라 상태 전송
app.post("/api/camera-status", (req, res) => {
  const cameraStatusUpdate = req.body;

  if (!cameraStatusUpdate.message || cameraStatusUpdate.message !== "success") {
    return res
      .status(400)
      .json({ message: "카메라 상태 정보가 잘못되었습니다." });
  }

  cameraStatus = cameraStatusUpdate;

  res.json({ message: "서버가 카메라 상태를 전달받았습니다!" });
});

// 아두이노 -> 서버 상태 전송
app.post("/api/arduino-status", (req, res) => {
  const { message } = req.body;

  arduinoStatus = message;

  console.log(arduinoStatus);

  res.status(200).json({
    message: "Data received successfully",
    received: message,
  });
});

// react -> 서버 카메라 상태 전달받기
app.get("/api/get-camera-status", (req, res) => {
  if (!cameraStatus.message || cameraStatus.message !== "success") {
    return res
      .status(400)
      .json({ message: "카메라 상태 정보가 잘못되었습니다." });
  }
  res.json(cameraStatus);
});

// react -> 서버 아두이노 상태 전달받기
app.get("/api/get-arduino-status", (req, res) => {
  if (!arduinoStatus || arduinoStatus !== "success") {
    return res
      .status(400)
      .json({ message: "아두이노 상태 정보가 잘못되었습니다." });
  }
  res.json(arduinoStatus);
});

// meetingID기반 데이터베이스 생성
app.post(
  "/api/create-database",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const { meeting_id } = req.body;

    if (!meeting_id) {
      return res
        .status(400)
        .send({ message: "meetingID를 다시 생성해주세요." });
    }

    connection.query(`SHOW DATABASES LIKE '${meeting_id}'`, (err, results) => {
      if (err) {
        console.error("데이터베이스 확인 중 오류 발생:", err);
        return res.status(500).send("서버 오류");
      }

      if (results.length > 0) {
        return res.status(400).send({ message: "중복된 meetingID입니다." });
      }

      connection.query(`CREATE DATABASE ${meeting_id}`, (err) => {
        if (err) {
          console.error("데이터베이스 생성 중 오류 발생:", err);
          return res.status(500).send("데이터베이스 생성 오류");
        }

        console.log(`${meeting_id} 데이터베이스가 성공적으로 생성되었습니다.`);

        const dbConnection = mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: meeting_id,
        });

        dbConnection.connect((err) => {
          if (err) {
            console.error("데이터베이스 연결 오류:", err);
            return res.status(500).send("서버 오류");
          }

          createTables(dbConnection, res);
        });
      });
    });
  }
);

// 상태 확인 후 insert
app.post(
  "/api/update-camera-status",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const {
      meeting_id,
      camera_status_post_time,
      is_camera_operational,
      message,
    } = req.body;

    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meeting_id,
    });

    const insertQuery = `INSERT INTO CameraStatusTable (meeting_id, camera_status_post_time, is_camera_operational, message) VALUES (?, ?, ?, ?)`;

    dbConnection.query(
      insertQuery,
      [
        meeting_id,
        camera_status_post_time,
        is_camera_operational ? 1 : 0,
        message,
      ],
      (err, result) => {
        if (err) {
          console.error("CameraStatusTable에 데이터 삽입 중 오류 발생:", err);
          return res
            .status(500)
            .json({ message: "CameraStatusTable에 데이터 삽입 오류" });
        }
        res.status(200).json({ message: "카메라 상태 업데이트 성공" });

        dbConnection.end();
      }
    );
  }
);

// 상태 확인 후 insert
app.post(
  "/api/update-arduino-status",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const {
      meeting_id,
      arduino_status_post_time,
      is_arduino_operational,
      message,
    } = req.body;

    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meeting_id,
    });

    const insertQuery = `INSERT INTO ArduinoStatusTable (meeting_id, arduino_status_post_time, is_operational, message) VALUES (?, ?, ?, ?)`;

    dbConnection.query(
      insertQuery,
      [
        meeting_id,
        arduino_status_post_time,
        is_arduino_operational ? 1 : 0,
        message,
      ],
      (err, result) => {
        if (err) {
          console.error("ArduinoStatusTable에 데이터 삽입 중 오류 발생:", err);
          return res
            .status(500)
            .json({ message: "ArduinoStatusTable에 데이터 삽입 오류" });
        }
        res.status(200).json({ message: "아두이노 상태 업데이트 성공" });
        dbConnection.end();
      }
    );
  }
);

// 기본 발표데이터 만들기
app.post(
  "/api/insert-presentations-table",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const {
      meetingID,
      presenter_name,
      presenter_email,
      scheduled_start_time,
      scheduled_duration,
      actual_start_time,
      actual_duration,
      interrupted,
    } = req.body;

    const insertQuery = `
    INSERT INTO PresentationsTable (
      meeting_id, 
      presenter_name, 
      presenter_email, 
      scheduled_start_time, 
      actual_start_time, 
      scheduled_duration, 
      actual_duration, 
      interrupted
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      meetingID,
      presenter_name,
      presenter_email,
      scheduled_start_time,
      actual_start_time,
      scheduled_duration,
      actual_duration,
      interrupted,
    ];

    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meetingID,
    });

    dbConnection.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("데이터 삽입 중 오류 발생:", err);
        return res.status(500).send("데이터 삽입 오류");
      }
      res.status(200).send("Presentation successfully inserted!");
      dbConnection.end();
    });
  }
);

// 대시보드 예정된 발표일정 Fetch
app.post(
  "/api/get-scheduled-data",
  FirebaseAuthMiddleware.decodeToken,
  async (req, res) => {
    const { meetingIDs } = req.body;

    if (Array.isArray(meetingIDs) && meetingIDs.length > 0) {
      try {
        const futureMeetings = [];
        const currentTimeKST = new Date(
          new Date().getTime() + 9 * 60 * 60 * 1000
        ); // 현재 시간 (KST)

        for (const meetingID of meetingIDs) {
          const dbConnection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: meetingID,
          });

          const query = `SELECT scheduled_start_time, scheduled_duration 
            FROM PresentationsTable 
            LIMIT 1;`;

          const queryResult = await new Promise((resolve, reject) => {
            dbConnection.query(query, (err, result) => {
              if (err) {
                console.error(`Error querying meeting ID: ${meetingID}, err`);
                reject(err);
              } else {
                resolve(result[0]);
              }
            });
          });

          dbConnection.end();

          if (queryResult && queryResult.scheduled_start_time) {
            const scheduledStartTime = new Date(
              queryResult.scheduled_start_time + "Z"
            );
            const scheduledEndTime = new Date(
              scheduledStartTime.getTime() +
                queryResult.scheduled_duration * 60000
            );

            const scheduledStartTimeKST = new Date(
              scheduledStartTime.getTime()
            );

            if (scheduledStartTimeKST > currentTimeKST) {
              futureMeetings.push({
                meetingID,
                scheduled_start_time: scheduledStartTimeKST,
                scheduled_duration: queryResult.scheduled_duration,
              });
            } else if (scheduledEndTime > currentTimeKST) {
              futureMeetings.push({
                meetingID,
                scheduled_start_time: scheduledStartTimeKST,
                scheduled_duration: queryResult.scheduled_duration,
              });
            }
          }
        }

        futureMeetings.sort(
          (a, b) => a.scheduled_start_time - b.scheduled_start_time
        );

        const results = futureMeetings.slice(0, 5);
        res.status(200).json({ meetings: results });
      } catch (error) {
        console.error("Error processing meeting IDs:", error);
        res.status(500).json({ message: "Error processing meeting IDs." });
      }
    } else {
      res.status(400).json({ message: "No valid meeting IDs provided." });
      dbConnection.end();
    }
  }
);

// 대시보드 헤더 데이터 Fetch
app.post(
  "/api/get-header-data",
  FirebaseAuthMiddleware.decodeToken,
  async (req, res) => {
    const { meetingIDs } = req.body;

    if (Array.isArray(meetingIDs) && meetingIDs.length > 0) {
      try {
        let results = [];

        for (const meetingID of meetingIDs) {
          const dbConnection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: meetingID,
          });

          const queryPresentationsTable = `
            SELECT COUNT(*) as has_started_count 
            FROM PresentationsTable 
            WHERE has_started = TRUE;
          `;

          const queryAiEvaluationTable = `
            SELECT AVG(ai_score) as average_ai_score 
            FROM AiEvaluationTable;
          `;

          const hasStartedResult = await new Promise((resolve, reject) => {
            dbConnection.query(queryPresentationsTable, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result[0]);
              }
            });
          });

          const aiScoreResult = await new Promise((resolve, reject) => {
            dbConnection.query(queryAiEvaluationTable, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result[0]);
              }
            });
          });

          results.push({
            meetingID: meetingID,
            has_started_count: hasStartedResult.has_started_count,
            average_ai_score:
              aiScoreResult.average_ai_score || "아직 평가 없음",
          });

          dbConnection.end();
        }

        res.status(200).json({ meetings: results });
      } catch (error) {
        console.error("Error processing meeting IDs:", error);
        res.status(500).json({ message: "Error processing meeting IDs." });
      }
    } else {
      res.status(400).json({ message: "No valid meeting IDs provided." });
    }
  }
);

app.post(
  "/api/get-recentpresentations",
  FirebaseAuthMiddleware.decodeToken,
  async (req, res) => {
    const { meetingIDs } = req.body;

    if (Array.isArray(meetingIDs) && meetingIDs.length > 0) {
      try {
        let results = [];

        for (const meetingID of meetingIDs) {
          const dbConnection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: meetingID,
          });

          const query = `
          SELECT 
              P.meeting_id, 
              P.id,
              P.scheduled_start_time,
              P.scheduled_duration,  
              P.has_started,
              IF(
                PND.mediapipe_video IS NULL 
                AND PND.movement_csv IS NULL 
                AND PND.audio_recording IS NULL, 
                'Empty', 
                'Exists'
              ) AS notebook_data_status,
              IF(AI.meeting_id IS NOT NULL, 'Exists', 'Not Exists') AS ai_evaluation_status
          FROM 
              PresentationsTable P
          LEFT JOIN 
              PresentationNotebookDataTable PND ON P.meeting_id = PND.meeting_id
          LEFT JOIN 
              AiEvaluationTable AI ON P.meeting_id = AI.meeting_id
          ORDER BY 
              P.created_at ASC
          LIMIT 1;
        `;

          const meetingResult = await new Promise((resolve, reject) => {
            dbConnection.query(query, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });

          for (const row of meetingResult) {
            results.push({
              meetingID: row.meeting_id,
              id: row.id,
              scheduled_start_time: row.scheduled_start_time,
              scheduled_duration: row.scheduled_duration,
              has_started: row.has_started,
              notebook_data_status: row.notebook_data_status,
              ai_evaluation_status: row.ai_evaluation_status,
            });
          }

          dbConnection.end();
        }

        res.status(200).json({ meetings: results });
      } catch (error) {
        console.error("Error processing meeting IDs:", error);
        res.status(500).json({ message: "Error processing meeting IDs." });
      }
    } else {
      res.status(400).json({ message: "No valid meeting IDs provided." });
    }
  }
);

let meetingID;

// 발표 시작 전 발표 정보 Fetch
app.get(
  "/api/get-presentationstatus",
  FirebaseAuthMiddleware.decodeToken,
  async (req, res) => {
    meetingID = req.query.meetingID;

    if (!meetingID || meetingID.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid meeting IDs provided." });
    }

    try {
      const dbConnection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: meetingID,
      });

      dbConnection.connect((err) => {
        if (err) {
          console.error("Error connecting to MySQL:", err);
          return res
            .status(500)
            .json({ message: "Database connection failed." });
        }
      });

      const sqlQuery = `
        SELECT scheduled_start_time, scheduled_duration, interrupted, has_started
        FROM PresentationsTable
        WHERE meeting_id IN (?)
      `;

      dbConnection.query(sqlQuery, [meetingID], (error, results) => {
        if (error) {
          console.error("Error executing query:", error);
          return res.status(500).json({ message: "Query execution failed." });
        }

        res.status(200).json({ data: results });
      });

      dbConnection.end();
    } catch (error) {
      console.error("Error processing meeting IDs:", error);
      res.status(500).json({ message: "Error processing meeting IDs." });
    }
  }
);

app.post("/api/upload-urls", (req, res) => {
  const uploadedFiles = req.body.uploadedFiles;

  if (!uploadedFiles) {
    return res.status(400).json({ message: "No uploaded files data received" });
  }

  const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: meetingID,
  });

  dbConnection.connect((err) => {
    if (err) {
      console.error("MySQL connection error:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }

    const {
      input_file,
      output_mp3file,
      csv_output_file_video,
      csv_output_file_audio,
    } = uploadedFiles;

    const sql = `INSERT INTO PresentationNotebookDataTable 
                   (meeting_id, mediapipe_video, movement_csv, audio_recording, audio_csv) 
                   VALUES (?, ?, ?, ?, ?)`;

    dbConnection.query(
      sql,
      [
        meetingID,
        input_file,
        csv_output_file_video,
        output_mp3file,
        csv_output_file_audio,
      ],
      (err, result) => {
        dbConnection.end();

        if (err) {
          console.error("Error inserting data into MySQL:", err);
          return res
            .status(500)
            .json({ message: "Error inserting data into MySQL" });
        }

        res.status(200).json({
          message: "File URLs received and data inserted successfully",
        });
      }
    );
  });
});

app.get("/api/get-urls", FirebaseAuthMiddleware.decodeToken, (req, res) => {
  const { meetingID } = req.query;

  const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: meetingID,
  });

  dbConnection.connect((err) => {
    if (err) {
      console.error("MySQL connection error:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }

    const sql = `SELECT meeting_id, mediapipe_video, movement_csv, audio_recording, audio_csv FROM PresentationNotebookDataTable LIMIT 1`;

    dbConnection.query(sql, (err, result) => {
      dbConnection.end();

      if (err) {
        console.error("Error retrieving data from MySQL:", err);
        return res
          .status(500)
          .json({ message: "Error retrieving data from MySQL" });
      }

      if (result.length > 0) {
        res.status(200).json({ data: result[0] });
      } else {
        res.status(404).json({ message: "No data found" });
      }
    });
  });
});

app.get(
  "/api/get-arduino-data",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const { meetingID } = req.query;

    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meetingID,
    });

    const query = `
    SELECT heart_rate, accelerometer_data
    FROM PresentationArduinoDataTable
    WHERE id > (
      SELECT id
      FROM PresentationArduinoDataTable
      WHERE has_started = 1
      ORDER BY id ASC
      LIMIT 1
    );
  `;

    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error("쿼리 실행 오류:", err);
        res.status(500).send("데이터 가져오기 오류");
        return;
      }
      res.json(results);
      dbConnection.end();
    });
  }
);

let currentTimelineSeconds = 0;
app.post("/api/save-feedback", async (req, res) => {
  const { feedback, meetingID } = req.body;

  try {
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meetingID,
      charset: "utf8mb4",
    });

    const minutes = String(Math.floor(currentTimelineSeconds / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(currentTimelineSeconds % 60).padStart(2, "0");
    const videoTimeline = `${minutes}:${seconds}`;

    const query = `
    INSERT INTO AiEvaluationTable (meeting_id, video_timeline, ai_feedback)
    VALUES (?, ?, ?)
  `;

    dbConnection.query(
      query,
      [meetingID, videoTimeline, feedback],
      (err, results) => {
        if (err) {
          console.error("쿼리 실행 오류:", err);
          res.status(500).send("피드백 저장 오류");
        } else {
          console.log(
            `Saved feedback for meeting ${meetingID} at ${videoTimeline}`
          );
          res.json({ success: true, feedback });
        }
      }
    );

    dbConnection.end();
    currentTimelineSeconds += 10;
  } catch (error) {
    console.error("Error requesting feedback from Gemini:", error);
    res.status(500).json({ error: "Failed to get feedback from Gemini" });
  }
});

app.get(
  "/api/get-feedback-record",
  FirebaseAuthMiddleware.decodeToken,
  (req, res) => {
    const { meetingID } = req.query;

    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: meetingID,
    });

    // 첫 번째 쿼리: group_concat_max_len 설정
    dbConnection.query("SET SESSION group_concat_max_len = 100000", (err) => {
      if (err) {
        console.error("Error setting group_concat_max_len:", err);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
        dbConnection.end();
        return;
      }

      // 두 번째 쿼리: 데이터 가져오기
      const query = `
      SELECT 
        COUNT(*) AS count, 
        GROUP_CONCAT(video_timeline ORDER BY id SEPARATOR ',') AS video_timelines, 
        GROUP_CONCAT(ai_feedback ORDER BY id SEPARATOR ',') AS ai_feedbacks
      FROM 
        AiEvaluationTable 
      WHERE 
        meeting_id = ?
    `;

      dbConnection.query(query, [meetingID], (err, results) => {
        if (err) {
          console.error("레코드 수 조회 오류:", err);
          res.status(500).json({ error: "서버 오류가 발생했습니다." });
        } else {
          const recordCount = results[0].count;
          const videoTimelines = results[0].video_timelines
            ? results[0].video_timelines.split(",")
            : [];
          const aiFeedbacks = results[0].ai_feedbacks
            ? results[0].ai_feedbacks.split(",")
            : [];

          res.json({ count: recordCount, videoTimelines, aiFeedbacks });
        }
        dbConnection.end();
      });
    });
  }
);

const clients = new Map();
const clientInfo = new Map();

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const maxClients = 3;

let duration = null;
let db = null;
let isDbConnected = false;
let presentationStartUpdated = false;

let globalCountdown = null;
let globalInterval = null;

function connectToDatabase(apiKey) {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: apiKey,
  });

  db.connect((err) => {
    if (err) {
      console.error("MySQL 연결 오류:", err);
      isDbConnected = false;
    } else {
      console.log("MySQL에 연결되었습니다.");
      isDbConnected = true;
    }
  });
}

function saveArduinoMessageToDB(message) {
  if (!isDbConnected) {
    console.error("DB 연결이 설정되지 않았습니다.");
    return;
  }

  const timeMatch = message.match(/Time: (\d{2}:\d{2}:\d{2})/);
  const accelMatch = message.match(
    /Accel X: (.*?), Y: (.*?), Z: (.*?)(?:\s|\||$)/
  );
  const heartRateMatch = message.match(/Heart Rate \(BPM\): (\d+)/);

  const currentDate = new Date().toISOString().split("T")[0];
  const rtc_time = timeMatch ? `${currentDate} ${timeMatch[1]}` : null;

  const heart_rate = heartRateMatch ? parseInt(heartRateMatch[1], 10) : null;

  const accelerometer_data = accelMatch
    ? `X: ${accelMatch[1]}, Y: ${accelMatch[2]}, Z: ${accelMatch[3]}`
    : null;

  const query = `
  INSERT INTO PresentationArduinoDataTable (rtc_time, heart_rate, accelerometer_data)
  VALUES (?, ?, ?);`;

  db.query(
    query,
    [rtc_time, heart_rate, accelerometer_data],
    (err, results) => {
      if (err) {
        console.error("MySQL 저장 오류:", err);
      } else {
        console.log("Arduino 데이터가 MySQL에 저장되었습니다.");
      }
    }
  );
}

function updatePresentationStart(actual_start_time) {
  if (!isDbConnected) {
    console.error("DB 연결이 설정되지 않았습니다.");
    return;
  }

  const query1 = `
    UPDATE PresentationsTable
    SET actual_start_time = ?, has_started = ?
    WHERE meeting_id = ?;
  `;

  db.query(query1, [actual_start_time, 1, apiKey], (err, results) => {
    if (err) {
      console.error("MySQL 업데이트 오류:", err);
      return;
    } else {
      console.log("Presentation 시작 정보가 업데이트되었습니다.");

      const query2 = `
        UPDATE PresentationArduinoDataTable
        SET has_started = true
        WHERE created_at >= ? AND created_at <= NOW();
      `;

      db.query(query2, [actual_start_time], (err, results) => {
        if (err) {
          console.error("PresentationArduinoDataTable 업데이트 오류:", err);
        } else {
          console.log(
            "PresentationArduinoDataTable에서 has_started가 true로 업데이트되었습니다."
          );
        }
      });
    }
  });
}
function updatePresentationInterrupt() {
  if (!isDbConnected) {
    console.error("DB 연결이 설정되지 않았습니다.");
    return;
  }

  const now = new Date();
  now.setHours(now.getHours() + 9);
  const currentDateTimeKST = now.toISOString().slice(0, 19).replace("T", " ");

  const durationQuery = `
    UPDATE PresentationsTable
    SET
      actual_end_time = ?,
      actual_duration = TIMEDIFF(?, actual_start_time),
      interrupted = 1
    WHERE meeting_id = ?;
  `;

  db.query(
    durationQuery,
    [currentDateTimeKST, currentDateTimeKST, apiKey],
    (err, results) => {
      if (err) {
        console.error("MySQL 업데이트 오류:", err);
      } else {
        console.log("프레젠테이션이 업데이트되었습니다.");
      }
    }
  );
}

function startCountdown(duration) {
  if (globalInterval) {
    console.log("이미 실행 중인 카운트다운이 있습니다.");
    return;
  }

  globalCountdown = duration;
  globalInterval = setInterval(() => {
    if (globalCountdown <= 0) {
      clearInterval(globalInterval);
      globalInterval = null;
      globalCountdown = null;

      console.log("카운트다운 종료, interrupt 실행");
      broadcast(
        JSON.stringify({ message: "interrupt", clientCount: clients.size })
      );
      updatePresentationInterrupt();
    } else {
      const minutes = Math.floor(globalCountdown / 60);
      const seconds = globalCountdown % 60;
      broadcast(
        JSON.stringify({
          message: "countdown",
          remainingTime: `${minutes}분 ${seconds}초`,
        })
      );

      globalCountdown--;
    }
  }, 1000);
}

function endMeetingCountdown() {
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
    globalCountdown = null;
    console.log("발표가 조기에 종료되었습니다.");
  } else {
    console.log("종료할 카운트다운이 없습니다.");
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      const deviceType = parsedMessage.deviceType;

      if (parsedMessage.message === "get_start") {
        console.log("Received get_start from client");

        apiKey = parsedMessage.apiKey;
        duration = parsedMessage.duration;

        if (!isDbConnected) {
          connectToDatabase(apiKey);
        }

        const message = {
          message: "get_start",
          clientCount: clients.size,
        };

        broadcast(JSON.stringify(message));
      }

      if (
        deviceType === "arduino" &&
        parsedMessage.message &&
        parsedMessage.message.startsWith("Time:")
      ) {
        saveArduinoMessageToDB(parsedMessage.message);
        return;
      }

      if (
        deviceType === "notebook" &&
        parsedMessage.message &&
        parsedMessage.message.startsWith("발표 음성, 영상 녹화중...")
      ) {
        console.log(
          `Notebook Message: ${parsedMessage.message}, Time: ${parsedMessage.current_time}`
        );

        if (!presentationStartUpdated) {
          broadcast(
            JSON.stringify({
              message: "current_time",
              current_time: parsedMessage.current_time,
            })
          );

          updatePresentationStart(parsedMessage.current_time);
          presentationStartUpdated = true;

          startCountdown(duration * 60);
        }

        return;
      }

      if (parsedMessage.message === "interrupt") {
        console.log("Received interrupt from client");
        broadcast(
          JSON.stringify({ message: "interrupt", clientCount: clients.size })
        );

        endMeetingCountdown();
        updatePresentationInterrupt();
        return;
      }

      if (parsedMessage.message === "notebook_work") {
        console.log("노트북 작업 중...");
        return;
      }

      if (parsedMessage.message === "notebook_quit") {
        console.log("노트북 작업이 종료되었습니다.");
        return;
      }

      if (parsedMessage.message === "arduino_quit") {
        console.log("아두이노 작업이 종료되었습니다.");
        return;
      }

      if (clients.size >= maxClients) {
        ws.send(
          JSON.stringify({
            error: "최대 접속 수를 초과했습니다.",
            clientCount: clients.size,
          })
        );
        return;
      }

      if (Array.from(clientInfo.values()).includes(deviceType)) {
        ws.send(
          JSON.stringify({
            error: `${deviceType}는 이미 접속 중입니다.`,
            clientCount: clients.size,
          })
        );
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        const id = deviceType;
        clients.set(id, ws);
        clientInfo.set(id, deviceType);

        console.log(`${deviceType} connected.`);
        console.log("현재 클라이언트 수:", clients.size);

        broadcast(
          JSON.stringify({
            status: `${deviceType}_connected`,
            clientCount: clients.size,
          })
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    const deviceType = Array.from(clients.entries()).find(
      ([key, value]) => value === ws
    )?.[0];

    if (deviceType) {
      clients.delete(deviceType);
      clientInfo.delete(deviceType);

      broadcast(
        JSON.stringify({
          status: `${deviceType}_disconnected`,
          clientCount: clients.size,
        })
      );
    } else {
      console.log(
        "Disconnected client was not identified, no deletion occurred."
      );
    }

    if (clients.size === 0 && db && isDbConnected) {
      db.end((err) => {
        if (err) {
          console.error("MySQL 연결 해제 오류:", err);
        } else {
          console.log("MySQL 연결이 종료되었습니다.");
          isDbConnected = false;
        }
      });
    }
  });
});

function broadcast(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
