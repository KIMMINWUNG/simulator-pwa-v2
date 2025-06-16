// App.jsx (전체 시뮬레이터 박스 너비 확대 + 전체 상태 포함)
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

const LOCAL_GOV_LIST = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도", "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"];

const GRADE_EXCLUDE = ["", "실시완료", "실시완료(등급미상)", "해당없음"];

export default function FullAutomationApp() {
  const [selectedGov, setSelectedGov] = useState("");
  const [noticeFile, setNoticeFile] = useState(null);
  const [dbFile, setDbFile] = useState(null);
  const [planFile, setPlanFile] = useState(null);
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

  return (
    <div className="simulator" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }}>정부합동평가</h1>
      <h2 style={{ textAlign: 'center' }}>시설 안전관리 수준 강화 지표<br />자동화 시뮬레이터</h2>

      <div className="form-group">
        <label>지자체 선택:</label>
        <select onChange={e => setSelectedGov(e.target.value)} value={selectedGov}>
          <option value="">선택하세요</option>
          {LOCAL_GOV_LIST.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
        <div style={{ flex: 1.5, minWidth: '380px', border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
          <h3>① 기반시설 관리 실행계획 제출여부</h3>
          <div className="form-group">
            <label>실행계획 확정현황 업로드:</label>
            <input type="file" accept=".xlsx" onChange={e => setPlanFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          </div>
          <button className="run-button">점수 산출</button>
          <p>제출 대상 기관 수: <strong>{planTotal}</strong></p>
          <p>기한 내 제출 완료 건수: <strong>{planDone}</strong></p>
          {planMissing.length > 0 && (
            <button style={{ backgroundColor: '#cce4f6', color: '#000', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '4px' }}>미제출 기관 리스트 다운로드</button>
          )}
          <div style={{ marginTop: '40px' }}>
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {planScore ?? '점'}</p>
            <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(10점 만점 기준, {planRate ?? '%'})</p>
          </div>
        </div>

        <div style={{ flex: 1.5, minWidth: '380px', border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
          <h3>② 최소유지관리기준 만족여부</h3>
          <div className="form-group">
            <label>고시문 업로드:</label>
            <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          </div>
          <div className="form-group">
            <label>실적DB 업로드:</label>
            <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} style={{ display: 'block', width: '100%', maxWidth: '250px' }} />
          </div>
          <button className="run-button">점수 산출</button>
          <p>총 DB 개수: <strong>{totalCount}</strong></p>
          <p>관리그룹 대상 개수: <strong>{targetCount}</strong></p>
          <p>분모(등급 확인 대상): <strong>{denominator}</strong></p>
          <p>분자(목표등급 만족): <strong>{numerator}</strong></p>
          <div style={{ marginTop: '40px' }}>
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '20px' }}>최종 점수: {score ?? '점'}</p>
            <p style={{ fontWeight: 'normal', marginTop: '-10px' }}>(20점 만점 기준, {percentage ?? '%'})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
