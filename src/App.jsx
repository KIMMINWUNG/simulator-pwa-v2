// 기본 컴포넌트 기반 시뮬레이터 UI (shadcn 제거)
import React, { useState } from "react";
import * as XLSX from "xlsx";

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
  const [totalCount, setTotalCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(0);
  const [score, setScore] = useState(null);

  const handleRun = async () => {
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

    setTotalCount(dbBody.length);
    setTargetCount(filtered.length);
    setDenominator(validGrades.length);
    setNumerator(passed.length);
    setScore(validGrades.length > 0 ? ((passed.length / validGrades.length) * 100 * 0.2).toFixed(2) : "0.00");
  };

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

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 24 }}>
      <h2>최소유지관리기준 자동화 시뮬레이터</h2>
      <div style={{ marginBottom: 12 }}>
        <label>지자체 선택: </label>
        <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
          <option value="">선택하세요</option>
          {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>고시문 업로드: </label>
        <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>실적DB 업로드: </label>
        <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
      </div>
      <button onClick={handleRun}>전체 자동화 실행</button>
      <div style={{ marginTop: 24 }}>
        <p>총 DB 개수: <strong>{totalCount}</strong></p>
        <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
        <p>분모(등급 확인 대상): <strong>{denominator}</strong></p>
        <p>분자(목표등급 만족): <strong>{numerator}</strong></p>
        <p>최종 점수: <strong>{score}</strong></p>
      </div>
    </div>
  );
}
