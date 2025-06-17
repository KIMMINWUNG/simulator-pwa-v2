// App.jsx (정부합동평가 시뮬레이터 최종 완성본 전체 코드)
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
  const [groupIncluded, setGroupIncluded] = useState([]);
  const [groupExcluded, setGroupExcluded] = useState([]);
  const [gradePassed, setGradePassed] = useState([]);
  const [gradeFailed, setGradeFailed] = useState([]);

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

  const downloadExcel = (data, filename) => {
    const processed = data.map((r, i) => ({
      "관리번호": r.A || "",
      "기반시설물명": r.B || "",
      ...r
    }));
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const handlePlanScore = async () => {
    if (!planFile || !selectedGov) return;
    const planWB = await readJson(planFile);
    const planData = planWB[Object.keys(planWB)[0]].slice(1);
    const filtered = planData.filter(r => r.B?.trim() === selectedGov);
    const done = filtered.filter(r => {
      const date = new Date(r.H);
      return date instanceof Date && !isNaN(date) && date <= new Date("2025-02-28T23:59:59");
    });
    const missed = filtered.filter(r => !done.includes(r));
    setPlanTotal(filtered.length);
    setPlanDone(done.length);
    setPlanMissing(missed);
    const raw = filtered.length > 0 ? (done.length / filtered.length) * 100 * 0.1 : 0;
    setPlanScore(raw.toFixed(2));
    setPlanRate(((raw / 10) * 100).toFixed(1));
  };

  const handlePlanDownload = () => {
    const data = planMissing.map((r, i) => ({
      "순번": i + 1,
      "관리계획 수립기관": r.B || "",
      "작성기관": r.C || "",
      "시설종류": r.D || "",
      "담당자": r.F || ""
    }));
    downloadExcel(data, "미제출_기관_리스트.xlsx");
  };

  const handleMaintainScore = async () => {
    if (!selectedGov || !noticeFile || !dbFile) return;
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

    const included = dbBody.filter(r => groupKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.C?.trim()}`));
    const excluded = dbBody.filter(r => !groupKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.C?.trim()}`));
    const validGrades = included.filter(r => !GRADE_EXCLUDE.includes(r.M?.trim()));
    const passed = validGrades.filter(r => gradeKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.M?.trim()}`));
    const failed = validGrades.filter(r => !gradeKeys.has(`${r.D?.trim()}||${r.F?.trim()}||${r.M?.trim()}`));
    const raw = validGrades.length > 0 ? (passed.length / validGrades.length) * 100 * 0.2 : 0;

    setGroupIncluded(included);
    setGroupExcluded(excluded);
    setGradePassed(passed);
    setGradeFailed(failed);
    setTotalCount(dbBody.length);
    setTargetCount(included.length);
    setDenominator(validGrades.length);
    setNumerator(passed.length);
    setScore(raw.toFixed(2));
    setPercentage(((raw / 20) * 100).toFixed(1));
  };

  return (
  <div style={{ position: 'relative' }}>
  {/* 좌측 상단 CI 로고 */}
  <img src="/ci_logo.png" alt="국토안전관리원 CI" style={{ position: 'absolute', top: 0, left: 0, height: '36px', margin: '8px' }} />

  {/* 보안 문구 */}
  <div style={{ marginLeft: '52px', backgroundColor: '#fef3c7', padding: '12px 20px', border: '1px solid #facc15', color: '#78350f', borderRadius: '6px', fontSize: '14px' }}>
    <strong>🔒 개인정보 및 보안 안내:</strong>
    이 시뮬레이터는 사용자의 브라우저 내에서만 엑셀 데이터를 처리하며,
    업로드된 파일은 서버에 저장되지 않습니다.
  </div>

    {/* 제목 */}
    <h1 style={{ fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }}>정부합동평가</h1>
    <h2 style={{ textAlign: 'center' }}>시설 안전관리 수준 강화 지표<br />자동화 시뮬레이터</h2>

    {/* 지자체 선택 */}
    <div className="form-group">
      <label>지자체 선택:</label>
      <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
        <option value="">선택하세요</option>
        {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
      </select>
    </div>

    <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
      {/* ① 실행계획 */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
          <h3>① 기반시설 관리 실행계획 제출여부</h3>
          <label>실행계획 확정현황 업로드:</label>
          <input type="file" accept=".xlsx" onChange={e => setPlanFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          <button className="run-button" onClick={handlePlanScore}>점수 산출</button>
          <p>제출 대상 기관 수: <strong>{planTotal}</strong></p>
          <p>기한 내 제출 완료 건수: <strong>{planDone}</strong></p>
          {planMissing.length > 0 && <button onClick={handlePlanDownload} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '4px' }}>미제출 기관 리스트 다운로드</button>}
          <div style={{ marginTop: '40px' }}>
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {planScore}점</p>
            <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(10점 만점 기준, {planRate}%)</p>
          </div>
        </div>

        {/* ② 유지관리기준 */}
      <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
        <h3>② 최소유지관리기준 만족여부</h3>
        <label>고시문 업로드:</label>
          <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          <label>실적DB 업로드:</label>
          <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          <button className="run-button" onClick={handleMaintainScore}>점수 산출</button>

        <p>총 DB 개수: <strong>{totalCount}</strong></p>

        <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {groupIncluded.length > 0 && <button onClick={() => downloadExcel(groupIncluded, "관리그룹_포함DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>관리그룹 포함 DB</button>}
          {groupExcluded.length > 0 && <button onClick={() => downloadExcel(groupExcluded, "관리그룹_제외DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>관리그룹 제외 DB</button>}
        </div>

        <p>분모(등급 확인 대상): <strong>{denominator}</strong></p>
        <p>분자(목표등급 만족): <strong>{numerator}</strong></p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
           {gradePassed.length > 0 && <button onClick={() => downloadExcel(gradePassed, "목표등급_만족DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>목표등급 만족 DB</button>}
           {gradeFailed.length > 0 && <button onClick={() => downloadExcel(gradeFailed, "목표등급_불만족DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>목표등급 불만족 DB</button>}
    </div>

        <div style={{ marginTop: '30px' }}>
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {score}점</p>
            <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(20점 만점 기준, {percentage}%)</p>
        </div>
      </div>
    </div>
  </div>
);
}
