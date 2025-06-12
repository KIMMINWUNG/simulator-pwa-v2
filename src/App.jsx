// App.jsx with 점수 강조 + 퍼센트 병기 추가
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
  const [totalCount, setTotalCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(0);
  const [score, setScore] = useState(null);
  const [percentage, setPercentage] = useState(null);

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

    const rawScore = validGrades.length > 0 ? (passed.length / validGrades.length) * 100 * 0.2 : 0;

    setTotalCount(dbBody.length);
    setTargetCount(filtered.length);
    setDenominator(validGrades.length);
    setNumerator(passed.length);
    setScore(rawScore.toFixed(2));
    setPercentage(((rawScore / 20) * 100).toFixed(1));
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
    <div className="simulator">
      <div style={{ backgroundColor: '#fef3c7', padding: '12px 20px', border: '1px solid #facc15', color: '#78350f', marginBottom: '20px', borderRadius: '6px', fontSize: '14px' }}>
        <strong>🔒 개인정보 및 보안 안내:</strong> 이 시뮬레이터는 사용자의 브라우저 내에서만 엑셀 데이터를 처리하며, 업로드된 파일은 서버에 저장되지 않습니다. 실적DB에 개인정보(예: 주민번호, 전화번호 등)가 포함되지 않도록 유의해주세요.
      </div>

      <h2>최소유지관리기준 자동화 시뮬레이터</h2>
      <div className="form-group">
        <label>지자체 선택:</label>
        <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
          <option value="">선택하세요</option>
          {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>고시문 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
      </div>
      <div className="form-group">
        <label>실적DB 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
      </div>
      <button className="run-button" onClick={handleRun}>전체 자동화 실행</button>
      <div className="results">
        <p>총 DB 개수: <strong>{totalCount}</strong></p>
        <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
        <p>분모(등급 확인 대상): <strong>{denominator}</strong></p>
        <p>분자(목표등급 만족): <strong>{numerator}</strong></p>
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>
          최종 점수: {score}점 (20점 만점 기준, {percentage}%)
        </p>
      </div>
    </div>
  );
}
