// App.jsx (정부합동평가 시뮬레이터 2단 구성)
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

const LOCAL_GOV_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
];

const GRADE_EXCLUDE = ["", "실시완료", "실시완료(등급미상)", "해당없음"];

export default function FullAutomationApp() {
  const [selectedGov, setSelectedGov] = useState("");
  const [noticeFile, setNoticeFile] = useState(null);
  const [dbFile, setDbFile] = useState(null);
  const [planStatus, setPlanStatus] = useState([]);
  const [planScore, setPlanScore] = useState(null);
  const [planRate, setPlanRate] = useState(null);
  const [planTotal, setPlanTotal] = useState(0);
  const [planDone, setPlanDone] = useState(0);
  const [planMissing, setPlanMissing] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(0);
  const [score, setScore] = useState(null);
  const [percentage, setPercentage] = useState(null);

  const readJson = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const json = {};
      wb.SheetNames.forEach(name => {
        json[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: "A" });
      });
      resolve(json);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const readRaw = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(XLSX.read(new Uint8Array(e.target.result), { type: "array" }));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const handlePlanScore = async () => {
    const planWB = await readJson(await fetch("/실행계획 확정현황.xlsx").then(r => r.blob()));
    const planData = planWB[Object.keys(planWB)[0]].slice(1);
    const filtered = planData.filter(r => r.B?.trim() === selectedGov);
    const done = filtered.filter(r => {
      const date = new Date(r.H);
      return date instanceof Date && !isNaN(date) && date <= new Date("2025-02-28T23:59:59");
    });
    const missed = filtered.filter(r => !done.includes(r));
    setPlanStatus(filtered);
    setPlanTotal(filtered.length);
    setPlanDone(done.length);
    setPlanMissing(missed);
    const rawScore = filtered.length > 0 ? (done.length / filtered.length) * 100 * 0.1 : 0;
    setPlanScore(rawScore.toFixed(2));
    setPlanRate(((rawScore / 10) * 100).toFixed(1));
  };

  const handlePlanDownload = () => {
    const data = planMissing.map((r, i) => ({
      "순번": i + 1,
      "관리계획 수립기관": r.B || "",
      "작성기관": r.C || "",
      "시설종류": r.D || "",
      "담당자": r.F || ""
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "미제출기관");
    XLSX.writeFile(wb, "미제출_기관_리스트.xlsx");
  };

  const handleMaintainScore = async () => {
    if (!selectedGov || !noticeFile || !dbFile) {
      alert("지자체, 고시문, 실적DB를 모두 선택해주세요.");
      return;
    }
    const noticeWB = await readRaw(noticeFile);
    const sheet = noticeWB.Sheets[selectedGov];
    const db = await readJson(dbFile);
    const dbBody = db[Object.keys(db)[0]].slice(1);
    const groupCols = ["C","D","E","F","G"];
    const gradeCols = ["H","I","J","K","L","M","N","O","P","Q"];
    const groupKeys = new Set();
    const gradeKeys = new Set();
    for (let i = 2; i < 200; i++) {
      const infra = sheet[`A${i}`]?.v?.trim();
      const fac = sheet[`B${i}`]?.v?.trim();
      if (!infra || !fac) continue;
      for (let col of groupCols) {
        const v = sheet[`${col}${i}`]?.v?.trim();
        const label = sheet[`${col}1`]?.v?.trim();
        if (v === "O") groupKeys.add(`${infra}||${fac}||${label}`);
      }
      for (let col of gradeCols) {
        const v = sheet[`${col}${i}`]?.v?.trim();
        const label = sheet[`${col}1`]?.v?.trim();
        if (v === "O") gradeKeys.add(`${infra}||${fac}||${label}`);
      }
    }
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
  };

  return (
    <div className="simulator">
      <h1 style={{ fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }}>정부합동평가</h1>
      <h2 style={{ textAlign: 'center' }}>시설 안전관리 수준 강화 지표<br />자동화 시뮬레이터</h2>

      <div className="form-group">
        <label>지자체 선택:</label>
        <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
          <option value="">선택하세요</option>
          {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
          <h3>① 기반시설 관리 실행계획 제출여부</h3>
          <button onClick={handlePlanScore}>점수 산출</button>
          <p>제출 대상 기관 수: <strong>{planTotal}</strong></p>
          <p>기한 내 제출 완료 건수: <strong>{planDone}</strong></p>
          {planMissing.length > 0 && <button onClick={handlePlanDownload}>미제출 기관 리스트 다운로드</button>}
          <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {planScore}점 (10점 만점 기준, {planRate}%)</p>
        </div>

        <div style={{ flex: 1, border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
          <h3>② 최소유지관리기준 만족여부</h3>
          <div className="form-group">
            <label>고시문 업로드:</label>
            <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label>실적DB 업로드:</label>
            <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
          </div>
          <button className="run-button" onClick={handleMaintainScore}>점수 산출</button>
          <p>총 DB 개수: <strong>{totalCount}</strong></p>
          <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
          <p>분모(등급 확인 대상): <strong>{denominator}</strong></p>
          <p>분자(목표등급 만족): <strong>{numerator}</strong></p>
          <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>
            최종 점수: {score}점 (20점 만점 기준, {percentage}%)
          </p>
        </div>
      </div>
    </div>
  );
}
