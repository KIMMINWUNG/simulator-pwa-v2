// src/components/AdminPage.jsx
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { PRIVATE_OWNERS } from "../privateList";
import { calculateScoresForGov } from "../utils/scoreUtils"; // ✅ 이거 추가

const LOCAL_GOV_LIST = [
  "경상남도", "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", "제주특별자치도"
];

export default function AdminPage() {
  const [noticeFile, setNoticeFile] = useState(null);
  const [dbFile, setDbFile] = useState(null);
  const [planFile, setPlanFile] = useState(null);
  const [ordinanceFile, setOrdinanceFile] = useState(null);
  const [excludePrivate, setExcludePrivate] = useState(true);

  const [resultTable, setResultTable] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // 필요한 초기 데이터
  }, []);

  const handleCalculateAll = async () => {
    if (!planFile || !noticeFile || !dbFile || !ordinanceFile) {
      alert("모든 파일을 업로드해야 점수 산출이 가능합니다.");
      return;
    }

    setIsCalculating(true);

    const table = [];

    for (const gov of LOCAL_GOV_LIST) {
      try {
        const result = await calculateScoresForGov(
  gov,
  { planFile, noticeFile, dbFile, ordinanceFile },
  PRIVATE_OWNERS,
  excludePrivate
);
        table.push({ 지자체: gov, ...result });
      } catch (err) {
        table.push({ 지자체: gov, 오류: "계산 실패" });
      }
    }

    table.sort((a, b) => (b.총점 || 0) - (a.총점 || 0));
    setResultTable(table);
    setIsCalculating(false);
  };

  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>📊 관리자용 점수 일괄 산출기</h2>
      <p style={{ marginBottom: '16px' }}>업로드된 파일을 바탕으로 17개 지자체의 점수를 자동 계산합니다.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <label>① 실행계획 확정현황 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setPlanFile(e.target.files[0])} />
        <label>② 고시문 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setNoticeFile(e.target.files[0])} />
        <label>③ 실적DB 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setDbFile(e.target.files[0])} />
        <label>④ 조례 확인 엑셀 업로드:</label>
        <input type="file" accept=".xlsx" onChange={e => setOrdinanceFile(e.target.files[0])} />
        <label>민간 관리주체 제외 여부:</label>
        <select value={excludePrivate ? "네" : "아니오"} onChange={e => setExcludePrivate(e.target.value === "네")}>
          <option>네</option>
          <option>아니오</option>
        </select>

        <button
          onClick={handleCalculateAll}
          disabled={isCalculating}
          style={{ marginTop: '20px', padding: '12px', fontWeight: 'bold', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          {isCalculating ? "🔄 점수 계산 중..." : "✅ 모든 지자체 점수 산출"}
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>📋 점수 산출 결과</h3>
        {resultTable.length > 0 ? (
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th>순위</th>
                <th>지자체</th>
                <th>계획점수</th>
                <th>유지관리</th>
                <th>조례점수</th>
                <th>총점</th>
              </tr>
            </thead>
            <tbody>
              {resultTable.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{row.지자체}</td>
                  <td>{row.계획점수 || "-"}</td>
                  <td>{row.유지관리 || "-"}</td>
                  <td>{row.조례점수 || "-"}</td>
                  <td style={{ fontWeight: 'bold' }}>{row.총점 || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>아직 계산된 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
