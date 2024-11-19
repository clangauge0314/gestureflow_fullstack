import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MixedChart = ({ data, arduinoData }) => {
  const [viewMode, setViewMode] = useState("both"); // "movement", "heartRate", "both"
  const sampleInterval = 30;

  const convertTimestampToSeconds = (timestamp) => {
    const parts = timestamp.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const findClosestTimestamp = (timestamp) => {
    const targetTime = convertTimestampToSeconds(timestamp);
    let closest = arduinoData[0];
    let minDiff = Math.abs(convertTimestampToSeconds(closest.Timestamp) - targetTime);

    arduinoData.forEach((item) => {
      const time = convertTimestampToSeconds(item.Timestamp);
      const diff = Math.abs(time - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    });

    return closest;
  };

  const sampledData = data.reduce((result, row, index) => {
    if (index % sampleInterval === 0) {
      const closestArduinoData = findClosestTimestamp(row.Timestamp);
      result.push({
        "Cumulative Movement %": parseFloat(row["Cumulative Movement %"]),
        Timestamp: row["Timestamp"],
        heart_rate: closestArduinoData ? parseFloat(closestArduinoData.heart_rate) : 0,
      });
    }
    return result;
  }, []);

  return (
    <div>
      {/* 버튼 그룹 */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setViewMode("both")}
          style={{
            padding: "8px 16px",
            margin: "0 5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: viewMode === "both" ? "#007bff" : "#f0f0f0",
            color: viewMode === "both" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          둘 다 보기
        </button>
        <button
          onClick={() => setViewMode("movement")}
          style={{
            padding: "8px 16px",
            margin: "0 5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: viewMode === "movement" ? "#007bff" : "#f0f0f0",
            color: viewMode === "movement" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          움직임만 보기
        </button>
        <button
          onClick={() => setViewMode("heartRate")}
          style={{
            padding: "8px 16px",
            margin: "0 5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: viewMode === "heartRate" ? "#007bff" : "#f0f0f0",
            color: viewMode === "heartRate" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          심박수만 보기
        </button>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={800}
            height={300}
            data={sampledData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="category" dataKey="Timestamp" />
            <YAxis type="number" yAxisId="left" domain={[0, 120]} />
            <YAxis type="number" yAxisId="right" orientation="right" domain={[0, 120]} />
            <Tooltip />
            {viewMode !== "heartRate" && (
              <Bar
                yAxisId="left"
                dataKey="Cumulative Movement %"
                fill="rgba(0, 0, 255, 0.6)"
                barSize={20}
              />
            )}
            {viewMode !== "movement" && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heart_rate"
                stroke="#f05650"
                dot={false}
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MixedChart;
