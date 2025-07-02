// utils/fileUtils.js
import * as XLSX from "xlsx";
import { HEADER_PLAN, HEADER_DB, HEADER_ORDINANCE } from "./constants";

export const readJson = (file, type) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const json = {};
      const expectedHeaders = {
        plan: HEADER_PLAN,
        db: HEADER_DB,
        ordinance: HEADER_ORDINANCE
      };
      const headerType = expectedHeaders[type];

      wb.SheetNames.forEach(name => {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
        const sheetHeader = data[0];
        if (!validateHeader(sheetHeader, headerType)) {
          alert(`❗ ${name} 시트의 헤더 형식이 올바르지 않습니다.\n필수 형식: ${headerType.join(", ")}`);
          throw new Error("Invalid header");
        }
        const rows = data.slice(1).map(row =>
          Object.fromEntries(sheetHeader.map((key, i) => [key, row[i]]))
        );
        json[name] = rows;
      });
      resolve(json);
    } catch (err) {
      reject(err);
    }
  };
  reader.onerror = () => reject("파일을 읽을 수 없습니다.");
  reader.readAsArrayBuffer(file);
});

export const readRaw = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      resolve(wb);
    } catch (error) {
      reject(error);
    }
  };
  reader.onerror = () => reject("파일을 읽을 수 없습니다.");
  reader.readAsArrayBuffer(file);
});

export const downloadExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};

export const validateHeader = (actualHeader, expectedHeader) => {
  if (!actualHeader || !Array.isArray(actualHeader)) return false;
  if (actualHeader.length !== expectedHeader.length) return false;
  return expectedHeader.every((v, i) => v === actualHeader[i]);
};
