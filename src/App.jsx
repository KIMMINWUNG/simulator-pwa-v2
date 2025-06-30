// App.jsx
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { PRIVATE_OWNERS } from "./privateList";

const LOCAL_GOV_LIST = [
  "경상남도", "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", "제주특별자치도"
];
const GRADE_EXCLUDE = ["", "실시완료", "실시완료(등급미상)", "해당없음"];
const MASTER_KEY = "k.infra";

function LoginComponent({ onSuccess }) {
  const [inputKey, setInputKey] = useState("");
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <div style={{ width: '360px', background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>🔒 인증이 필요합니다</h2>
        <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>기반터 발급 KEY를 입력하세요</p>
        <input
          type="password"
          placeholder="KEY 입력"
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <button
          onClick={() => {
            if (inputKey === MASTER_KEY) onSuccess();
            else alert("KEY가 일치하지 않습니다.");
          }}
          style={{ padding: '10px 0', width: '90%', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          입장하기
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  return authorized ? <FullAutomationApp /> : <LoginComponent onSuccess={() => setAuthorized(true)} />;
}
export function FullAutomationApp() {
  const [selectedGov, setSelectedGov] = useState("");
  const [excludePrivate, setExcludePrivate] = useState(true);
  const [privateList, setPrivateList] = useState([]);

  const [noticeFile, setNoticeFile] = useState(null);
  const [dbFile, setDbFile] = useState(null);
  const [planFile, setPlanFile] = useState(null);
  const [ordinanceFile, setOrdinanceFile] = useState(null);

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

  const [ordinanceScore, setOrdinanceScore] = useState(null);
  const [ordinanceRate, setOrdinanceRate] = useState(null);
  const [ordinanceNumerator, setOrdinanceNumerator] = useState(0);
  const [ordinanceDenominator, setOrdinanceDenominator] = useState(0);

  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isLoadingMaintain, setIsLoadingMaintain] = useState(false);
  const [isLoadingOrdinance, setIsLoadingOrdinance] = useState(false);

  useEffect(() => {
    setPrivateList(PRIVATE_OWNERS);
  }, []);

  useEffect(() => {
    // 지자체 변경 시 점수 상태 초기화
    setPlanScore(null);
    setPlanRate(null);
    setPlanTotal(0);
    setPlanDone(0);
    setPlanMissing([]);

    setScore(null);
    setPercentage(null);
    setGroupIncluded([]);
    setGroupExcluded([]);
    setGradePassed([]);
    setGradeFailed([]);
    setTotalCount(0);
    setTargetCount(0);
    setNumerator(0);
    setDenominator(0);

    setOrdinanceScore(null);
    setOrdinanceRate(null);
    setOrdinanceNumerator(0);
    setOrdinanceDenominator(0);
  }, [selectedGov]);

  const readJson = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const json = {};
        wb.SheetNames.forEach(name => {
          json[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: "A" });
        });
        resolve(json);
      } catch (error) {
        alert("엑셀 파일을 읽는 중 오류가 발생했습니다.");
        reject(error);
      }
    };
    reader.onerror = () => {
      alert("파일을 읽을 수 없습니다. 형식이나 내용이 올바른지 확인해 주세요.");
      reject();
    };
    reader.readAsArrayBuffer(file);
  });

  const readRaw = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        resolve(wb);
      } catch (error) {
        alert("고시문 파일을 읽는 중 오류가 발생했습니다.");
        reject(error);
      }
    };
    reader.onerror = () => {
      alert("파일을 읽을 수 없습니다. 형식이나 내용이 올바른지 확인해 주세요.");
      reject();
    };
    reader.readAsArrayBuffer(file);
  });

  const downloadExcel = (data, filename) => {
    const processed = data.map((r) => {
      const { A, B, ...rest } = r;
      return { "관리번호": A || "", "기반시설물명": B || "", ...rest };
    });
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };
  const handlePlanScore = async () => {
    if (!planFile || !selectedGov) {
      alert("지자체 선택 및 실행계획 파일 업로드가 필요합니다.");
      return;
    }

    setIsLoadingPlan(true);
    try {
      const planWB = await readJson(planFile);
      const sheetName = Object.keys(planWB)[0];
      const sheet = planWB[sheetName];

      if (!sheet || !Array.isArray(sheet)) {
        alert("파일에 유효한 시트 또는 데이터가 없습니다.");
        return;
      }

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
    } catch (err) {
      alert("점수 산출 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleMaintainScore = async () => {
    if (!selectedGov || !noticeFile || !dbFile) {
      alert("지자체 선택, 고시문 파일 및 실적DB 파일 업로드가 필요합니다.");
      return;
    }

    setIsLoadingMaintain(true);
    try {
      const noticeWB = await readRaw(noticeFile);
      const sheet = noticeWB.Sheets[selectedGov];

      if (!sheet) {
        alert(`파일에 "${selectedGov}" 시트가 존재하지 않습니다.`);
        return;
      }

      const db = await readJson(dbFile);
      const dbSheetName = Object.keys(db)[0];
      const dbSheet = db[dbSheetName];

      if (!dbSheet || !Array.isArray(dbSheet)) {
        alert("파일에 유효한 시트 또는 데이터가 없습니다.");
        return;
      }

      let dbBody = dbSheet.slice(1).filter(r => r.H?.trim() === selectedGov);
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
    } catch (err) {
      alert("점수 산출 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoadingMaintain(false);
    }
  };

  const handleOrdinanceScore = async () => {
    if (!ordinanceFile || !selectedGov) {
      alert("지자체 선택 및 파일 업로드가 필요합니다.");
      return;
    }

    setIsLoadingOrdinance(true);
    try {
      const wb = await readJson(ordinanceFile);
      const sheetName = Object.keys(wb)[0];
      const sheet = wb[sheetName];

      if (!sheet || !Array.isArray(sheet)) {
        alert("파일에 유효한 시트 또는 데이터가 없습니다.");
        return;
      }

      const filtered = sheet.filter(r => r.B?.trim() === selectedGov);
      const total = filtered.length;
      const done = filtered.filter(r => r.E?.toString().trim() === "O");

      setOrdinanceDenominator(total);
      setOrdinanceNumerator(done.length);
      const raw = total > 0 ? (done.length / total) * 100 * 0.2 : 0;
      setOrdinanceScore(raw.toFixed(2));
      setOrdinanceRate(((raw / 20) * 100).toFixed(1));
    } catch (err) {
      alert("점수 산출 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoadingOrdinance(false);
    }
  };
  
  return (
    <>
    <div style={{ width: '100vw', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div className="simulator" style={{ padding: '24px', width: '70vw', maxWidth: '2800px', background: '#eceff1', borderRadius: '12px' }}>

        <div style={{ backgroundColor: '#fef3c7', padding: '12px 20px', border: '1px solid #facc15', color: '#78350f', marginBottom: '20px', borderRadius: '6px', fontSize: '14px' }}>
          <strong>🔒 안내 :</strong> 이 시뮬레이터는 사용자의 브라우저 내에서만 엑셀 데이터를 처리하며, 업로드된 파일은 서버에 저장되지 않습니다.
        </div>

        <h1 style={{ fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }}>지자체 합동평가</h1>
        <h2 style={{ textAlign: 'center' }}>
          시설 안전관리 수준 강화 지표(기반시설관리법) <br />
          점수 자동화 프로그램
        </h2>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>지자체 선택:</label>
          <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
            <option value="">선택하세요</option>
            {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ margin: '12px 0' }}>
          <label style={{ marginRight: '12px' }}>
            민간관리자 또는 민자사업자 관리주체의 DB를 제외하시겠습니까?
          </label>
          <select value={excludePrivate ? "네" : "아니오"} onChange={e => setExcludePrivate(e.target.value === "네")}>
            <option>네</option>
            <option>아니오</option>
          </select>
        </div>

        {/* 세 점수 항목 박스 정렬 */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
          {[
            {
              title: "① 기반시설 관리 실행계획 제출여부",
              content: (
                <>
                  <label>실행계획 확정현황 업로드:</label>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={e => setPlanFile(e.target.files[0])}
                    style={{ display: 'block', width: '100%', maxWidth: '250px', marginBottom: '12px' }}
                  />
                  <button className="run-button" onClick={handlePlanScore} disabled={isLoadingPlan}>
                    {isLoadingPlan ? "⏳ 점수 산출 중..." : "점수 산출"}
                  </button>
                  {isLoadingPlan && <p style={{ color: '#999' }}>처리 중입니다. 잠시만 기다려주세요.</p>}
                  <p>제출 대상 기관 수(분모): <strong>{planTotal}</strong></p>
                  <p>기한 내 제출 완료 건수(분자): <strong>{planDone}</strong></p>
                  {planMissing.length > 0 && (
                    <button onClick={() => {
                      const data = planMissing.map((r, i) => ({
                        "순번": i + 1,
                        "관리계획 수립기관": r.B || "",
                        "작성기관": r.C || "",
                        "시설종류": r.D || "",
                        "담당자": r.F || "",
                      }));
                      downloadExcel(data, "미제출_기관_리스트.xlsx");
                    }} style={{
                      backgroundColor: '#cce4f6',
                      border: '1px solid #99c8e0',
                      padding: '6px 12px',
                      borderRadius: '4px'
                    }}>
                      미제출 기관 리스트 다운로드
                    </button>
                  )}
                  <div style={{ marginTop: '30px' }}>
                    <p style={{ color: '#e53935', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {planScore}점</p>
                    <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(10점 만점 기준, {planRate}%)</p>
                  </div>
                </>
              )
            },
            {
              title: "② 최소유지관리기준 만족여부",
              content: (
                <>
                  <label>고시문 업로드:</label>
                  <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
                  <label>실적DB 업로드:</label>
                  <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px', marginBottom: '12px' }} />
                  <button className="run-button" onClick={handleMaintainScore} disabled={isLoadingMaintain}>
                    {isLoadingMaintain ? "⏳ 점수 산출 중..." : "점수 산출"}
                  </button>
                  {isLoadingMaintain && <p style={{ color: '#999' }}>처리 중입니다. 잠시만 기다려주세요.</p>}
                  <p style={{ fontSize: '13px', color: '#e57373', marginTop: '8px' }}>❗DB가 많은 경우 점수 산출에 시간이 걸릴 수 있습니다.</p>
                  <p>총 DB 개수: <strong>{totalCount}</strong></p>
                  <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {groupIncluded.length > 0 && (
                      <button onClick={() => downloadExcel(groupIncluded, "관리그룹_포함DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>
                        관리그룹 포함 DB
                      </button>
                    )}
                    {groupExcluded.length > 0 && (
                      <button onClick={() => downloadExcel(groupExcluded, "관리그룹_제외DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>
                        관리그룹 제외 DB
                      </button>
                    )}
                  </div>
                  <p>등급 확인 대상(분모): <strong>{denominator}</strong></p>
                  <p>목표등급 만족(분자): <strong>{numerator}</strong></p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {gradePassed.length > 0 && (
                      <button onClick={() => downloadExcel(gradePassed, "목표등급_만족DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>
                        목표등급 만족 DB
                      </button>
                    )}
                    {gradeFailed.length > 0 && (
                      <button onClick={() => downloadExcel(gradeFailed, "목표등급_불만족DB.xlsx")} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0' }}>
                        목표등급 불만족 DB
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: '30px' }}>
                    <p style={{ color: '#e53935', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {score}점</p>
                    <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(20점 만점 기준, {percentage}%)</p>
                  </div>
                </>
              )
            },
            {
              title: "③ 성능개선 충당금 조례 제정여부",
              content: (
                <>
                  <label>조례 확인 엑셀 업로드:</label>
                  <input type="file" accept=".xlsx" onChange={e => setOrdinanceFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px', marginBottom: '12px' }} />
                  <button className="run-button" onClick={handleOrdinanceScore} disabled={isLoadingOrdinance}>
                    {isLoadingOrdinance ? "⏳ 점수 산출 중..." : "점수 산출"}
                  </button>
                  {isLoadingOrdinance && <p style={{ color: '#999' }}>처리 중입니다. 잠시만 기다려주세요.</p>}
                  <p>대상 건수(분모): <strong>{ordinanceDenominator}</strong></p>
                  <p>조례 제정 확인 건수(분자): <strong>{ordinanceNumerator}</strong></p>
                  <div style={{ marginTop: '30px' }}>
                    <p style={{ color: '#e53935', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {ordinanceScore}점</p>
                    <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(20점 만점 기준, {ordinanceRate}%)</p>
                  </div>
                </>
              )
            }
          ].map((box, idx) => (
            <div key={idx} style={{ flex: 1, minWidth: 0, maxWidth: '100%', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
              <h3>{box.title}</h3>
              {box.content}
            </div>
          ))}
        </div>

        {/* ✅ 최종 통합 점수 출력 */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
          <h3>최종 통합 점수</h3>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e88e5' }}>
            {Number(planScore || 0) + Number(score || 0) + Number(ordinanceScore || 0)} 점 / 50점 만점
          </p>
        </div>
      </div>
    </div>
    
    {/* Footer */}
    <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
      <footer style={{
        width: '90vw',
        maxWidth: '1200px',
        backgroundColor: '#f0f4f8',
        padding: '16px 20px',
        marginTop: '40px',
        fontSize: '13px',
        color: '#444',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/ci_logo.png" alt="국토안전관리원 CI" style={{ height: '32px' }} />
          <div>
            <strong>국토안전관리원 기반시설관리실</strong><br />
            담당자: 김민웅 &nbsp;|&nbsp; 연락처: 055-771-8497 &nbsp;|&nbsp; 주소: 경상남도 진주시 사들로 123번길 40, 7층 배종프라임 기반시설관리실
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          ⓒ 2025 Kim Min Wung. All rights reserved.
        </div>
      </footer>
    </div>
  </>
);
}