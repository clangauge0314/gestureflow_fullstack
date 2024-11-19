import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const GEMINI_API_KEY = "AIzaSyDmAZUp0PpkhXXDXNub479tjwLfd30fdJk";

// 데이터 요약 함수
const summarizeDataBySecond = (movementData, audioData, arduinoData) => {
  const summarizedData = [];

  const totalDuration = Math.max(
    getLastTimestampInSeconds(movementData),
    getLastTimestampInSeconds(audioData),
    getLastTimestampInSeconds(arduinoData)
  );

  for (let second = 0; second <= totalDuration; second += 10) {
    const movementAvg = calculateAveragesForColumns(movementData, second, [
      "Cumulative Movement %",
    ]);
    const audioAvg = calculateAveragesForColumns(audioData, second, [
      "RMS Energy",
      "Spectral Centroid",
      "Spectral Bandwidth",
      "Zero-Crossing Rate",
      "Tempo",
      "MFCC1",
      "MFCC2",
      "MFCC3",
      "MFCC4",
      "MFCC5",
      "MFCC6",
      "MFCC7",
      "MFCC8",
      "MFCC9",
      "MFCC10",
      "MFCC11",
      "MFCC12",
      "MFCC13",
    ]);
    const heartRateAvg = calculateAveragesForColumns(arduinoData, second, [
      "heart_rate",
    ]);

    summarizedData.push({
      Timestamp: second,
      ...movementAvg,
      ...audioAvg,
      ...heartRateAvg,
    });
  }

  return summarizedData;
};

const calculateAveragesForColumns = (data, second, columns) => {
  const rowsInSecond = data.filter(
    (row) => convertTimestampToSeconds(row.Timestamp) === second
  );
  if (rowsInSecond.length === 0) return {};

  const averages = {};
  columns.forEach((column) => {
    const sum = rowsInSecond.reduce(
      (acc, row) => acc + parseFloat(row[column] || 0),
      0
    );
    averages[column] = sum / rowsInSecond.length;
  });

  return averages;
};

const convertTimestampToSeconds = (timestamp) => {
  const [minutes, seconds] = timestamp.split(":").map(Number);
  return minutes * 60 + seconds;
};

const getLastTimestampInSeconds = (data) => {
  const lastTimestamp = data[data.length - 1]?.Timestamp || "00:00";
  return convertTimestampToSeconds(lastTimestamp);
};

const requestFeedbackFromGemini = async (dataSegment, meetingID) => {
  const prompt = `
    Please analyze the following data from a presentation segment. Identify any weaknesses and provide feedback to help improve the speaker's performance. Additionally, if there are any strengths, offer praise to reinforce positive behaviors. Ensure feedback is constructive, concise, and conversational, referencing prior feedback when relevant, to make it feel more like a supportive, ongoing dialogue. Avoid generic comments about the beginning of the presentation. Respond in Korean, keeping the feedback to a single, natural-sounding line under 50 characters, using varied expressions to highlight both strengths and weaknesses.

  Current Segment Data:
  - Elapsed Time: ${dataSegment["Timestamp"]} (minutes:seconds)
  - Cumulative Movement: ${dataSegment["Cumulative Movement %"]}%
  - Audio Features (MFCC1 to MFCC13): [${dataSegment["MFCC1"]}, ${dataSegment["MFCC2"]}, ${dataSegment["MFCC3"]}, ${dataSegment["MFCC4"]}, ${dataSegment["MFCC5"]}, ${dataSegment["MFCC6"]}, ${dataSegment["MFCC7"]}, ${dataSegment["MFCC8"]}, ${dataSegment["MFCC9"]}, ${dataSegment["MFCC10"]}, ${dataSegment["MFCC11"]}, ${dataSegment["MFCC12"]}, ${dataSegment["MFCC13"]}]
  - RMS Energy: ${dataSegment["RMS Energy"]}
  - Spectral Bandwidth: ${dataSegment["Spectral Bandwidth"]}
  - Spectral Centroid: ${dataSegment["Spectral Centroid"]}
  - Tempo: ${dataSegment["Tempo"]}
  - Zero-Crossing Rate: ${dataSegment["Zero-Crossing Rate"]}
  - Heart Rate: ${dataSegment["heart_rate"]}

  Scenarios to consider:
  1. **Low Movement**: If the cumulative movement is consistently low (e.g., less than 10%) across multiple segments, encourage incorporating more gestures or dynamic movements to enhance engagement. 

  2. **Quiet Voice**: If RMS energy is low across recent segments, suggest projecting the voice more to captivate the audience. 

  3. **Repetitive Speech Patterns**: If MFCC values (MFCC1 to MFCC13) lack variation, recommend varying vocal tones and expressions to keep the audience interested.

  4. **High Anxiety Levels**: If the heart rate is elevated compared to earlier segments, advise on techniques to calm nerves, such as deep breathing. 

  Focus on providing varied expressions for strengths and weaknesses without generic comments about the presentation start. If no feedback is necessary, respond with '피드백 필요 없음.'
`;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);

  const feedback = result.response.text();
  try {
    const response = await axios.post(
      "http://183.107.128.217:3000/api/save-feedback",
      {
        feedback,
        meetingID,
      }
    );
    if (response.data.success) {
      console.log("Feedback saved successfully:", response.data.feedback);
    }
  } catch (error) {
    console.error("Error saving feedback:", error);
  }
};

// 메인 분석 함수
const analyzeData = async (combinedData, meetingID) => {
  const { movementData, audioData, arduinoData } = combinedData;
  const summarizedData = summarizeDataBySecond(
    movementData,
    audioData,
    arduinoData
  );

  console.log(summarizedData);

  // 각 summarizedData 항목에 대해 피드백 요청
  for (const dataSegment of summarizedData) {
    await requestFeedbackFromGemini(dataSegment, meetingID);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

export default analyzeData;
