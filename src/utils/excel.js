import * as XLSX from "xlsx";

// 엑셀을 JSON으로 변환
export const readJson = (file) => new Promise((resolve, reject) => {
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

// 엑셀 Raw Workbook 반환
export const readRaw = (file) => new Promise((resolve, reject) => {
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

// JSON 데이터를 엑셀로 다운로드
export const downloadExcel = (data, filename) => {
  const processed = data.map((r) => {
    const { A, B, ...rest } = r;
    return { "관리번호": A || "", "기반시설물명": B || "", ...rest };
  });
  const ws = XLSX.utils.json_to_sheet(processed);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};
