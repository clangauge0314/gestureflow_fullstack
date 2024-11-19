import React, { useEffect, useState } from "react";
import { useTable } from "react-table";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecentPresentations.css";
import { useSelector } from "react-redux";

const RecentPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [rowId, setRowId] = useState(1);
  const navigate = useNavigate();

  const meetingIDs = useSelector((state) => state.user.meetingIDs);
  const userToken = useSelector((state) => state.user.userToken);

  useEffect(() => {
    const fetchPresentations = async () => {
      if (meetingIDs.length > 0) {
        try {
          const response = await axios.post(
            "http://183.107.128.217:3000/api/get-recentpresentations",
            { meetingIDs },
            {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            }
          );          

          const formattedPresentations = response.data.meetings.map((row, index) => {
            const startTime = new Date(row.scheduled_start_time);

            const formattedStartTime = `${startTime.toLocaleDateString(
              "ko-KR"
            )} ${startTime.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`;

            setRowId((prevRowId) => prevRowId + 1);

            return {
              meetingID: row.meetingID,
              name: `발표 #${index + 1}`,
              startTime: formattedStartTime,
              duration: row.scheduled_duration + "분",
              started: row.has_started,
              videoAudioUploaded: row.notebook_data_status === "Exists",
              aiEvaluated: row.ai_evaluation_status === "Exists",
            };
          });

          setPresentations(formattedPresentations);
        } catch (error) {
          console.error("Error fetching presentations:", error);
        }
      }
    };

    fetchPresentations();
  }, [meetingIDs, userToken]);

  const columns = React.useMemo(
    () => [
      {
        Header: "이름",
        accessor: "name",
      },
      {
        Header: "발표 시작 시간",
        accessor: "startTime",
      },
      {
        Header: "발표 시간",
        accessor: "duration",
      },
      {
        Header: "발표 시작 여부",
        accessor: "started",
        Cell: ({ cell: { value } }) => (value ? "시작됨" : "시작되지 않음"),
      },
      {
        Header: "동영상/음성 데이터 업로드 여부",
        accessor: "videoAudioUploaded",
        Cell: ({ cell: { value } }) => (value ? "업로드됨" : "업로드되지 않음"),
      },
      {
        Header: "AI 평가 여부",
        accessor: "aiEvaluated",
        Cell: ({ cell: { value } }) => (value ? "평가됨" : "평가되지 않음"),
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data: presentations });

  const handleRowClick = (meetingID) => {
    navigate(`/p/${meetingID}`);
  };

  return (
    <div className="presentation--list">
      <div className="list--header">
        <h2>Recent Presentations</h2>
      </div>

      <table {...getTableProps()} className="presentation--table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th key={column.id} {...column.getHeaderProps()}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            const { key, ...rowProps } = row.getRowProps();
            return (
              <tr
                key={key}
                {...rowProps}
                onClick={() => handleRowClick(row.original.meetingID)}
                style={{ cursor: "pointer" }}
              >
                {row.cells.map((cell) => (
                  <td key={cell.id} {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecentPresentations;
