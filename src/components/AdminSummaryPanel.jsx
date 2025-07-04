import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSummaryPanel({ isLoading, onRun, onExport, allResults }) {
  const [showTable, setShowTable] = useState(true);

  const buttonStyle = {
    padding: '10px 20px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  };

  return (
    <div style={{
      marginTop: '40px',
      padding: '24px',
      background: '#eceff1',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      width: '70vw',
      maxWidth: '2800px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative'
    }}>
      <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>🧮 관리자용 전체 점수</h3>

      <button
        onClick={() => setShowTable(prev => !prev)}
        style={{
          marginBottom: '16px',
          backgroundColor: '#78909c',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {showTable ? "▲ 접기" : "▼ 펼치기"}
      </button>

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={onRun}
          disabled={isLoading}
          style={{
            ...buttonStyle,
            backgroundColor: '#0d6efd',
            color: '#fff'
          }}
        >
          {isLoading ? "⏳ 점수 산출 중..." : "점수 일괄 산출"}
        </button>
        <button
          onClick={onExport}
          disabled={allResults.length === 0}
          style={{
            ...buttonStyle,
            backgroundColor: '#43a047',
            color: '#fff'
          }}
        >
          엑셀 다운로드
        </button>
      </div>

      {/* 점수표 (애니메이션 포함) */}
      <AnimatePresence initial={false}>
        {showTable && allResults.length > 0 && (
          <motion.div
            key="tableBox"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", marginTop: "20px" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#cfd8dc", textAlign: "left" }}>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>순위</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>지자체</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>실행계획</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>유지관리기준</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>조례제정</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #b0bec5" }}>총점</th>
                </tr>
              </thead>
              <tbody>
                {[...allResults]
                  .sort((a, b) => Number(b.총점) - Number(a.총점))
                  .map((row, idx) => (
                    <tr key={idx} style={{
                      backgroundColor: idx % 2 === 0 ? "#f5f5f5" : "#ffffff",
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{idx + 1}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{row.지자체}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{row.실행계획}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{row.유지관리기준}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{row.조례제정}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>{row.총점}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
