import * as XLSX from "xlsx";

// 항목에 따라 시트 이름 설정
const LABEL_MAP = {
  planMissing: "실행계획 미제출 리스트",
  groupIncluded: "관리그룹 포함 DB",
  groupExcluded: "관리그룹 제외 DB",
  gradePassed: "목표등급 만족 DB",
  gradeFailed: "목표등급 불만족 DB"
};

export function exportDetailedExcel(allDetailedData, type, filename) {
  const wb = XLSX.utils.book_new();

  Object.entries(allDetailedData).forEach(([gov, data]) => {
    const sheetData = data[type];
    if (!sheetData || sheetData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const label = `${gov}`;
    XLSX.utils.book_append_sheet(wb, ws, label);
  });

  XLSX.writeFile(wb, filename);
}
