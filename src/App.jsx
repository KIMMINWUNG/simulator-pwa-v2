// App.jsx
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { PRIVATE_OWNERS } from "./privateList";

const LOCAL_GOV_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
];

const GRADE_EXCLUDE = ["", "실시완료", "실시완료(등급미상)", "해당없음"];

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const MASTER_KEY = "k.infra";

  return (
    <div>
      {authorized ? (
        <FullAutomationApp />
      ) : (
        <div style={{ marginTop: "100px", textAlign: "center" }}>
          <h2>🔒 인증이 필요합니다</h2>
          <p>기반터 발급 KEY를 입력하세요</p>
          <input
            type="password"
            placeholder="KEY 입력"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            style={{ padding: "8px", width: "200px", marginBottom: "12px" }}
          />
          <br />
          <button onClick={() => {
            if (inputKey === MASTER_KEY) setAuthorized(true);
          }} style={{ padding: "8px 16px" }}>
            입장하기
          </button>
        </div>
      )}
    </div>
  );
}

export function FullAutomationApp() {
  const [selectedGov, setSelectedGov] = useState("");
  const [excludePrivate, setExcludePrivate] = useState(true);
  const [privateList, setPrivateList] = useState([]);
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

  useEffect(() => {
    setPrivateList(PRIVATE_OWNERS);
  }, []);

  const readJson = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
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

  const readRaw = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(XLSX.read(new Uint8Array(e.target.result), { type: "array" }));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const downloadExcel = (data, filename) => {
    const processed = data.map((r) => {
      const { A, B, ...rest } = r;
      return {
        "관리번호": A || "",
        "기반시설물명": B || "",
        ...rest,
      };
    });
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const handlePlanScore = async () => {
    if (!planFile || !selectedGov) return;
    const planWB = await readJson(planFile);
    const sheet = planWB[Object.keys(planWB)[0]];
    const filtered = sheet.filter(r => r.B?.trim() === selectedGov);
    const finalData = excludePrivate ? filtered.filter(r => !privateList.includes(r.C?.trim())) : filtered;
    const done = finalData.filter(r => {
      const date = new Date(r.H);
      return !isNaN(date) && date <= new Date("2025-02-28T23:59:59");
    });
    const missed = finalData.filter(r => !done.includes(r));
    setPlanTotal(finalData.length);
    setPlanDone(done.length);
    setPlanMissing(missed);
    const raw = finalData.length > 0 ? (done.length / finalData.length) * 100 * 0.1 : 0;
    setPlanScore(raw.toFixed(2));
    setPlanRate(((raw / 10) * 100).toFixed(1));
  };

  const handleMaintainScore = async () => {
    if (!selectedGov || !noticeFile || !dbFile) return;
    const noticeWB = await readRaw(noticeFile);
    const sheet = noticeWB.Sheets[selectedGov];
    const db = await readJson(dbFile);
    let dbBody = db[Object.keys(db)[0]].slice(1).filter(r => r.H?.trim() === selectedGov);
    if (excludePrivate) {
      dbBody = dbBody.filter(r => !privateList.includes(r.I?.trim()));
    }

    const groupCols = ["C", "D", "E", "F", "G"];
    const gradeCols = ["H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];
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
    <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
      <div className="simulator" style={{ padding: '24px', width: '1800px', background: '#eceff1', borderRadius: '12px', position: 'relative', paddingTop: '48px' }}>
        <img src="/ci_logo.png" alt="국토안전관리원 CI" style={{ position: 'absolute', top: '8px', left: '8px', height: '36px' }} />
        <h1 style={{ textAlign: "center" }}>지자체 합동평가 시뮬레이터</h1>

        <div className="form-group">
          <label>지자체 선택:</label>
          <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
            <option value="">선택하세요</option>
            {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>민간 관리주체 DB 제외 여부:</label>
          <select value={excludePrivate ? "네" : "아니오"} onChange={e => setExcludePrivate(e.target.value === "네")}>
            <option>네</option>
            <option>아니오</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
          <div style={{ flex: 1, background: '#fff', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>① 실행계획 제출여부</h3>
            <input type="file" accept=".xlsx" onChange={e => setPlanFile(e.target.files[0])} />
            <button onClick={handlePlanScore}>점수 산출</button>
            <p>총 기관: {planTotal} / 제출: {planDone} → {planScore}점</p>
          </div>

          <div style={{ flex: 1, background: '#fff', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>② 최소유지관리기준 만족여부</h3>
            <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
            <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
            <button onClick={handleMaintainScore}>점수 산출</button>
            <p>관리그룹 대상: {targetCount} / 유효등급: {denominator} / 만족: {numerator} → {score}점</p>
          </div>
        </div>
      </div>
    </div>
  );
}