// App.jsx 전체 통합본 (정부합동평가 시뮬레이터)
// ① 실행계획 제출여부 + ② 최소유지관리기준 만족여부
// A/B열 포함 다운로드, 점수 산출, UI 정렬, 개인정보 배너 포함

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
  const [planFile, setPlanFile] = useState(null);

  const [planTotal, setPlanTotal] = useState(0);
  const [planDone, setPlanDone] = useState(0);
  const [planMissing, setPlanMissing] = useState([]);
  const [planScore, setPlanScore] = useState(null);
  const [planPercentage, setPlanPercentage] = useState(null);

  const [groupIncluded, setGroupIncluded] = useState([]);
  const [groupExcluded, setGroupExcluded] = useState([]);
  const [gradeIncluded, setGradeIncluded] = useState([]);
  const [gradeExcluded, setGradeExcluded] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
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

  const extractFields = (dataset) => {
    return dataset.map(row => ({
      관리번호: row.A || "",
      시설물명: row.B || "",
      ...row
    }));
  };

  const downloadExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const handlePlanScore = async () => {
    if (!planFile || !selectedGov) return;
    const planWB = await readJson(planFile);
    const plan = planWB[Object.keys(planWB)[0]].slice(1);
    const filtered = plan.filter(r => r.B?.trim() === selectedGov);
    const done = filtered.filter(r => {
      const d = new Date(r.H);
      return d <= new Date("2025-02-28T23:59:59");
    });
    const missed = filtered.filter(r => !done.includes(r));
    const raw = filtered.length > 0 ? (done.length / filtered.length) * 100 * 0.1 : 0;
    setPlanTotal(filtered.length);
    setPlanDone(done.length);
    setPlanMissing(missed);
    setPlanScore(raw.toFixed(2));
    setPlanPercentage(((raw / 10) * 100).toFixed(1));
  };

  const handleMaintainScore = async () => {
    if (!selectedGov || !noticeFile || !dbFile) return;
    const wb = await readRaw(noticeFile);
    const sheet = wb.Sheets[selectedGov];
    const db = await readJson(dbFile);
    const body = db[Object.keys(db)[0]].slice(1);

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

    const included = body.filter(r => groupKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.C?.trim()}`));
    const excluded = body.filter(r => !groupKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.C?.trim()}`));
    const valid = included.filter(r => !GRADE_EXCLUDE.includes(r.M?.trim()));
    const passed = valid.filter(r => gradeKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.M?.trim()}`));
    const failed = valid.filter(r => !gradeKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.M?.trim()}`));

    const rawScore = valid.length > 0 ? (passed.length / valid.length) * 100 * 0.2 : 0;
    setGroupIncluded(extractFields(included));
    setGroupExcluded(extractFields(excluded));
    setGradeIncluded(extractFields(passed));
    setGradeExcluded(extractFields(failed));
    setTotalCount(body.length);
    setDenominator(valid.length);
    setScore(rawScore.toFixed(2));
    setPercentage(((rawScore / 20) * 100).toFixed(1));
  };

  return (
    <div className="simulator">
      <h1>정부합동평가 자동화 시뮬레이터</h1>
      <div className="notice">🔒 본 시뮬레이터는 브라우저 내에서만 작동하며, 개인정보는 저장되지 않습니다.</div>

      <div className="form-group">
        <label>지자체 선택:</label>
        <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
          <option value="">선택하세요</option>
          {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div className="box">
        <h3>① 기반시설 관리 실행계획 제출여부</h3>
        <input type="file" accept=".xlsx" onChange={e => setPlanFile(e.target.files[0])} />
        <button className="run-button" onClick={handlePlanScore}>점수 산출</button>
        <p>제출 대상 기관 수: {planTotal}</p>
        <p>기한 내 제출 완료 건수: {planDone}</p>
        {planMissing.length > 0 && <button className="download-button" onClick={() => downloadExcel(planMissing, "미제출기관리스트.xlsx")}>미제출 기관 리스트 다운로드</button>}
        <p className="score">최종 점수: {planScore}점 (10점 만점, {planPercentage}%)</p>
      </div>

      <div className="box">
        <h3>② 최소유지관리기준 만족여부</h3>
        <label>고시문 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
        <label>실적 DB 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
        <button className="run-button" onClick={handleMaintainScore}>점수 산출</button>
        <p>총 DB 개수: {totalCount}</p>
        <p>
          관리그룹 대상 개수: {groupIncluded.length}
          {groupIncluded.length > 0 && (
            <>
              <button className="download-button" onClick={() => downloadExcel(groupIncluded, "관리그룹포함DB.xlsx")}>관리그룹 포함 DB</button>
              <button className="download-button" onClick={() => downloadExcel(groupExcluded, "관리그룹제외DB.xlsx")}>관리그룹 제외 DB</button>
            </>
          )}
        </p>
        <p>분모(등급 확인 대상): {denominator}</p>
        <p>
          분자(목표등급 만족): {gradeIncluded.length}
          {gradeIncluded.length > 0 && (
            <>
              <button className="download-button" onClick={() => downloadExcel(gradeIncluded, "목표등급만족DB.xlsx")}>목표등급 만족 DB</button>
              <button className="download-button" onClick={() => downloadExcel(gradeExcluded, "목표등급불만족DB.xlsx")}>목표등급 불만족 DB</button>
            </>
          )}
        </p>
        <p className="score">최종 점수: {score}점 (20점 만점, {percentage}%)</p>
      </div>
    </div>
  );
}
