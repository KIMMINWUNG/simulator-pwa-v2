import React, { useState } from "react";
import * as XLSX from "xlsx";
import { LOCAL_GOV_LIST } from "../../utils/constants";
import { readJson, readRaw, downloadExcel } from "../../utils/fileUtils";

export default function AdminAutomationApp({ onBack, planFile, dbFile, noticeFile, ordinanceFile }) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    if (!planFile || !dbFile || !noticeFile || !ordinanceFile) {
      alert("⚠️ 기존 화면에서 모든 파일을 업로드해야 점수 산출이 가능합니다.");
      return;
    }

    setIsLoading(true);
    const output = [];

    try {
      const planJson = await readJson(planFile, "plan");
      const dbJson = await readJson(dbFile, "db");
      const ordinanceJson = await readJson(ordinanceFile, "ordinance");
      const noticeWb = await readRaw(noticeFile);

      for (let gov of LOCAL_GOV_LIST) {
        let planScore = 0, maintainScore = 0, ordinanceScore = 0;

        try {
          const sheetName = Object.keys(planJson)[0];
          const filtered = planJson[sheetName].filter(r => r["관리계획 수립기관"]?.trim() === gov);
          const done = filtered.filter(r => {
            const d = new Date(r["결재이력"]);
            return !isNaN(d) && d <= new Date("2025-02-28T23:59:59");
          });
          planScore = filtered.length > 0 ? (done.length / filtered.length) * 100 * 0.1 : 0;
        } catch (e) { planScore = 0; }

        try {
          const sheet = noticeWb.Sheets[gov];
          if (!sheet) throw new Error("시트 없음");

          const dbSheet = dbJson[Object.keys(dbJson)[0]];
          const dbBody = dbSheet.filter(r => r["관리계획 수립기관"]?.trim() === gov);

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

          const included = dbBody.filter(r =>
            groupKeys.has(`${r["기반시설구분"]}||${r["시설물종류"]}||${r["시설물종별"]}`)
          );
          const validGrades = included.filter(r => !["", "실시완료", "실시완료(등급미상)", "해당없음", "기타"].includes(r["등급"]?.trim()));
          const passed = validGrades.filter(r =>
            gradeKeys.has(`${r["기반시설구분"]}||${r["시설물종류"]}||${r["등급"]}`)
          );
          maintainScore = validGrades.length > 0 ? (passed.length / validGrades.length) * 100 * 0.2 : 0;
        } catch (e) { maintainScore = 0; }

        try {
          const sheetName = Object.keys(ordinanceJson)[0];
          const filtered = ordinanceJson[sheetName].filter(r => r["관리계획 수립기관"]?.trim() === gov);
          const done = filtered.filter(r => r["충당금 조례 제정 여부"]?.toString().trim() === "O");
          ordinanceScore = filtered.length > 0 ? (done.length / filtered.length) * 100 * 0.2 : 0;
        } catch (e) { ordinanceScore = 0; }

        output.push({
          지자체: gov,
          실행계획점수: planScore.toFixed(2),
          유지관리기준점수: maintainScore.toFixed(2),
          조례점수: ordinanceScore.toFixed(2),
          총점: (planScore + maintainScore + ordinanceScore).toFixed(2)
        });
      }

      setResults(output);
    } catch (err) {
      alert("점수 산출 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>👩‍💼 관리자 모드: 전체 지자체 점수 산출</h2>
      <button onClick={onBack} style={{ marginBottom: "12px" }}>◀ 사용자 모드로 돌아가기</button>

      <button onClick={handleCalculate} disabled={isLoading}>
        {isLoading ? "⏳ 계산 중..." : "📊 전체 지자체 점수 산출"}
      </button>

      {results.length > 0 && (
        <>
          <h3 style={{ marginTop: "20px" }}>📋 산출 결과</h3>
          <button onClick={() => downloadExcel(results, "전체지자체_점수현황.xlsx")}>엑셀 다운로드</button>
          <table style={{ marginTop: "10px", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {Object.keys(results[0]).map(k => <th key={k} style={{ border: '1px solid #ccc', padding: '6px' }}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  {Object.values(r).map((v, j) => <td key={j} style={{ border: '1px solid #ccc', padding: '6px' }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
