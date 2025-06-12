// App.jsx with 다운로드 버튼 추가
// (이전 코드 포함)
// 다운로드용 유틸 추가됨: downloadExcel(data, filename)

import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

// ... 생략된 상단 상수 정의 부분 ...

export default function FullAutomationApp() {
  // 기존 useState + 추가된 필터 결과 저장용
  const [filteredData, setFilteredData] = useState([]);
  const [passedData, setPassedData] = useState([]);

  // ... 생략된 handleRun 상단 ...

  const handleRun = async () => {
    // ... 생략된 파일 검사 및 데이터 로딩 코드 ...

    const filtered = dbBody.filter(r => groupKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.C?.trim()}`));
    const validGrades = filtered.filter(r => !GRADE_EXCLUDE.includes(r.M?.trim()));
    const passed = validGrades.filter(r => gradeKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.M?.trim()}`));

    const rawScore = validGrades.length > 0 ? (passed.length / validGrades.length) * 100 * 0.2 : 0;

    setTotalCount(dbBody.length);
    setTargetCount(filtered.length);
    setDenominator(validGrades.length);
    setNumerator(passed.length);
    setScore(rawScore.toFixed(2));
    setPercentage(((rawScore / 20) * 100).toFixed(1));
    setFilteredData(validGrades);
    setPassedData(passed);
  };

  // 엑셀 다운로드 함수
  const downloadExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="simulator">
      {/* 기존 보안 안내 및 입력 UI 생략 */}

      <div className="results">
        <p>
          관리그룹 대상 개수: <strong>{targetCount}</strong>
          {targetCount > 0 && (
            <button onClick={() => downloadExcel(filteredData, "관리그룹대상DB.xlsx")} style={{ marginLeft: '10px' }}>관리그룹 대상 DB 다운로드</button>
          )}
        </p>
        <p>
          분자(목표등급 만족): <strong>{numerator}</strong>
          {numerator > 0 && (
            <button onClick={() => downloadExcel(passedData, "목표등급만족DB.xlsx")} style={{ marginLeft: '10px' }}>목표등급 만족 DB 다운로드</button>
          )}
        </p>
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>
          최종 점수: {score}점 (20점 만점 기준, {percentage}%)
        </p>
      </div>
    </div>
  );
}
