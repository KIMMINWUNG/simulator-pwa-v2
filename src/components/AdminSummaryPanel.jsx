import React from "react";

export default function AdminSummaryPanel({ isLoading, onRun, onExport, allResults }) {
  return (
    <div style={{
  marginTop: '40px',
  padding: '24px',
  background: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(236, 223, 36, 0.14)',
  width: '70vw', // 시뮬레이터 박스와 동일
  maxWidth: '2800px',
  marginLeft: 'auto',
  marginRight: 'auto',
  position: 'relative'
}}>
  {/* 닫기 버튼 (오른쪽 상단 X) */}
<button
  onClick={onClose}
  style={{
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#888'
  }}
  title="닫기"
>
  ✖
</button>

      <h3>관리자용 전체 점수 산출</h3>
      <button onClick={onRun} disabled={isLoading} style={{ marginRight: "12px", padding: "10px", backgroundColor: "#1e88e5", color: "#fff", border: "none", borderRadius: "6px" }}>
        {isLoading ? "⏳ 점수 산출 중..." : "점수 일괄 산출"}
      </button>
      <button onClick={onExport} disabled={allResults.length === 0} style={{ padding: "10px", backgroundColor: "#43a047", color: "#fff", border: "none", borderRadius: "6px" }}>
        엑셀 다운로드
      </button>

      {allResults.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#e0e0e0" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>지자체</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>실행계획</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>유지관리기준</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>조례제정</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>총점</th>
              </tr>
            </thead>
            <tbody>
              {allResults.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.지자체}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.실행계획}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.유지관리기준}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.조례제정}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>{row.총점}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
