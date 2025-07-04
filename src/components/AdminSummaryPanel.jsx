import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSummaryPanel({
  isLoading,
  onRun,
  onExport,
  allResults,
  onClose,
  onExportPlanMissing,
  onExportGroupIncluded,
  onExportGroupExcluded,
  onExportGradePassed,
  onExportGradeFailed
}) {
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
      background: '#eceff1', // 시뮬레이터 박스 색상과 동일
      borderRadius: '12px',
      border: '1px solid #ccc', // 테두리 추가
      width: '70vw',
      maxWidth: '2800px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative'
    }}>
      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#555'
          }}
          title="닫기"
        >
          ✖
        </button>
      )}

      {/* 제목: 지자체 합동평가 스타일과 동일 */}
      <h3 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1f2937',
        marginBottom: '16px'
      }}>
        🔐관리자 모드(총괄 점수 확인)
      </h3>

      {/* 토글 버튼: 시뮬레이터 버튼과 통일 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setShowTable(prev => !prev)}
          style={{
            backgroundColor: '#0d6efd',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '20px'
          }}
        >
          {showTable ? "▲ 접기" : "▼ 펼치기"}
        </button>
      </div>

      {/* 실행/엑셀 버튼 */}
<div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
  <button
    onClick={onRun}
    disabled={isLoading}
    style={{
      padding: '10px 20px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
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
      padding: '10px 20px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      backgroundColor: '#43a047',
      color: '#fff'
    }}
  >
    엑셀 다운로드
  </button>
</div>

{/* 5개 DB 다운로드 버튼 */}
{allResults.length > 0 && (
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px'
  }}>
    <button onClick={onExportPlanMissing} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>미제출 DB</button>
    <button onClick={onExportGroupIncluded} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>관리그룹 포함 DB</button>
    <button onClick={onExportGroupExcluded} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>관리그룹 제외 DB</button>
    <button onClick={onExportGradePassed} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>목표등급 만족 DB</button>
    <button onClick={onExportGradeFailed} style={{ backgroundColor: '#cce4f6', border: '1px solid #99c8e0', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>목표등급 불만족 DB</button>
  </div>
)}

      {/* 점수표 (슬라이드 애니메이션 포함) */}
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
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              backgroundColor: "#fff"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>순위</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>지자체</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>실행계획</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>유지관리기준</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>조례제정</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #ccc", borderTop: "1px solid #ccc" }}>총점</th>
                </tr>
              </thead>
              <tbody>
                {[...allResults]
                  .sort((a, b) => Number(b.총점) - Number(a.총점))
                  .map((row, idx) => (
                    <tr key={idx} style={{
                      backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                      textAlign: "center"
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
