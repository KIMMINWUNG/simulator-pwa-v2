import * as XLSX from "xlsx";

export const exportExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "결과");
  XLSX.writeFile(wb, filename);
};
