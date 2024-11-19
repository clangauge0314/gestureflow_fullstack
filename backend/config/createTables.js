const createTables = (dbConnection, res) => {
  const createPresentationsTable = `
    CREATE TABLE IF NOT EXISTS PresentationsTable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      meeting_id VARCHAR(255) NOT NULL UNIQUE,
      presenter_name VARCHAR(255) DEFAULT 'Guest',
      presenter_email VARCHAR(255),
      scheduled_start_time DATETIME,
      actual_start_time DATETIME,
      actual_end_time DATETIME,        
      scheduled_duration INT,
      actual_duration TIME,            
      interrupted BOOLEAN,
      has_started BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPresentationNotebookDataTable = `
    CREATE TABLE IF NOT EXISTS PresentationNotebookDataTable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      meeting_id VARCHAR(255),
      mediapipe_video TEXT,
      movement_csv TEXT,
      audio_recording TEXT,
      audio_csv TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPresentationArduinoDataTable = `
    CREATE TABLE IF NOT EXISTS PresentationArduinoDataTable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rtc_time DATETIME,
      has_started BOOLEAN,
      heart_rate INT,
      accelerometer_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCameraStatusTable = `
  CREATE TABLE IF NOT EXISTS CameraStatusTable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(255),
    camera_status_post_time DATETIME,
    is_camera_operational BOOLEAN,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

  const createArduinoStatusTable = `
  CREATE TABLE IF NOT EXISTS ArduinoStatusTable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(255),
    arduino_status_post_time DATETIME,
    is_operational BOOLEAN,  
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

  const createAiEvaluationTable = `
  CREATE TABLE IF NOT EXISTS AiEvaluationTable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(255) NOT NULL,
    video_timeline TIME,
    ai_score INT CHECK (ai_score BETWEEN 0 AND 100),
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

  dbConnection.query(createPresentationsTable, (err) => {
    if (err) return res.status(500).send("PresentationsTable 생성 오류");
    console.log("PresentationsTable 생성 성공");

    dbConnection.query(createPresentationNotebookDataTable, (err) => {
      if (err)
        return res.status(500).send("PresentationNotebookDataTable 생성 오류");
      console.log("PresentationNotebookDataTable 생성 성공");

      dbConnection.query(createPresentationArduinoDataTable, (err) => {
        if (err)
          return res.status(500).send("PresentationArduinoDataTable 생성 오류");
        console.log("PresentationArduinoDataTable 생성 성공");

        dbConnection.query(createCameraStatusTable, (err) => {
          if (err) return res.status(500).send("CameraStatusTable 생성 오류");
          console.log("CameraStatusTable 생성 성공");

          dbConnection.query(createArduinoStatusTable, (err) => {
            if (err)
              return res.status(500).send("ArduinoStatusTable 생성 오류");
            console.log("ArduinoStatusTable 생성 성공");

            dbConnection.query(createAiEvaluationTable, (err) => {
              if (err)
                return res.status(500).send("AiEvaluationTable 생성 오류");
              console.log("AiEvaluationTable 생성 성공");
              res
                .status(200)
                .send({ message: "모든 테이블이 성공적으로 생성되었습니다." });
            });
          });
        });
      });
    });
  });
};

module.exports = createTables;
