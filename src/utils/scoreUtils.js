// src/utils/scoreUtils.js
import * as XLSX from "xlsx";

// ✅ 헤더 정의 (값과 순서 고정)
const HEADER_PLAN = [
  '구분', '관리계획 수립기관', '작성기관', '시설종류', '제출일시', '담당자', '결재현황', '결재이력', '결재-담당자'
];
const HEADER_DB = [
  '관리번호', '기반시설물명', '시설물종별', '기반시설구분', '시설물구분', '시설물종류',
  '관리감독기관', '관리계획 수립기관', '관리주체', '관리주체 하위조직', '기관상세', '준공일', '등급'
];
const HEADER_ORDINANCE = [
  '구분', '관리계획 수립기관', '작성기관', '시설종류', '충당금 조례 제정여부'
];
const GRADE_EXCLUDE = ["", "실시완료", "실시완료(등급미상)", "해당없음"];

export async function calculateScoresForGov(gov, files, privateList, excludePrivate) {
  const { planFile, noticeFile, dbFile, ordinanceFile } = files;
  let planScore = 0, maintainScore = 0, ordinanceScore = 0;

  // 👉 엑셀을 JSON으로 변환 (헤더 검증 포함)
  const readJson = (file, type) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          const json = {};
          const expectedHeaders = {
            plan: HEADER_PLAN,
            db: HEADER_DB,
            ordinance: HEADER_ORDINANCE,
          };
          const headerType = expectedHeaders[type];

          wb.SheetNames.forEach((name) => {
            const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
            const sheetHeader = data[0];
            const rows = data.slice(1).map((row) =>
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

  // 👉 고시문처럼 셀 접근이 필요한 경우 사용
  const readRaw = (file) =>
    new Promise((resolve, reject) => {
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

  try {
    // ✅ ① 실행계획 점수 계산
    const planWB = await readJson(planFile, "plan");
    const sheet1 = planWB[Object.keys(planWB)[0]];
    const planFiltered = sheet1.filter((r) => r["관리계획 수립기관"]?.trim() === gov);
    const finalPlan = excludePrivate ? planFiltered.filter(r => !privateList.includes(r["작성기관"]?.trim())) : planFiltered;
    const planDone = finalPlan.filter(r => {
      const date = new Date(r["제출일시"]);
      return !isNaN(date) && date <= new Date("2025-02-28T23:59:59");
    });
    planScore = finalPlan.length > 0 ? (planDone.length / finalPlan.length) * 10 : 0;

    // ✅ ② 최소유지관리기준 만족 점수 계산
    const noticeWB = await readRaw(noticeFile);
    const sheet = noticeWB.Sheets[gov];
    if (!sheet) throw new Error(`${gov} 시트 없음`);

    const dbWB = await readJson(dbFile, "db");
    const dbSheet = dbWB[Object.keys(dbWB)[0]];
    let dbBody = dbSheet.filter(r => r["관리계획 수립기관"]?.trim() === gov);
    if (excludePrivate) dbBody = dbBody.filter(r => !privateList.includes(r["관리주체"]?.trim()));

    const groupCols = ["C", "D", "E", "F", "G"];
    const gradeCols = ["H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];
    const groupKeys = new Set(), gradeKeys = new Set();

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

    const included = dbBody.filter(r => groupKeys.has(`${r["기반시설구분"]}||${r["시설물종류"]}||${r["시설물종별"]}`));
    const validGrades = included.filter(r => !GRADE_EXCLUDE.includes(r["등급"]?.trim()));
    const passed = validGrades.filter(r => gradeKeys.has(`${r["기반시설구분"]}||${r["시설물종류"]}||${r["등급"]}`));
    maintainScore = validGrades.length > 0 ? (passed.length / validGrades.length) * 20 : 0;

    // ✅ ③ 조례 점수 계산
    const ordinanceWB = await readJson(ordinanceFile, "ordinance");
    const ordSheet = ordinanceWB[Object.keys(ordinanceWB)[0]];
    const ordFiltered = ordSheet.filter(r => r["관리계획 수립기관"]?.trim() === gov);
    const ordDone = ordFiltered.filter(r => r["충당금 조례 제정여부"]?.toString().trim() === "O");
    ordinanceScore = ordFiltered.length > 0 ? (ordDone.length / ordFiltered.length) * 20 : 0;

    return {
      계획점수: planScore.toFixed(2),
      유지관리: maintainScore.toFixed(2),
      조례점수: ordinanceScore.toFixed(2),
      총점: (planScore + maintainScore + ordinanceScore).toFixed(2),
    };

  } catch (err) {
    console.error(`[${gov}] 점수 계산 오류:`, err);
    throw err;
  }
}
