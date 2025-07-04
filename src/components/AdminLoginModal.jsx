import React, { useState } from "react";

const MASTER_KEY = "kalis4114@"; // 관리자 비밀번호

export default function AdminLoginModal({ onSuccess, onCancel }) {
  const [inputKey, setInputKey] = useState("");

  const handleLogin = () => {
    if (inputKey === MASTER_KEY) {
      onSuccess();
    } else {
      alert("비밀번호가 일치하지 않습니다.");
      setInputKey("");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '32px', borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textAlign: 'center',
        width: '440px'
      }}>
        <h2 style={{ marginBottom: '12px' }}>🔐 관리자 로그인</h2>
        <p style={{ fontSize: '14px', marginBottom: '20px', color: '#555' }}>
          관리자 비밀번호를 입력하세요
        </p>
        <input
          type="password"
          placeholder="비밀번호"
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          style={{
    padding: '10px',
    width: '100%',           // ✅ 이거 유지
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '16px',
    boxSizing: 'border-box'
  }}
/>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', backgroundColor: '#ccc',
              border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleLogin}
            style={{
              flex: 1, padding: '10px', backgroundColor: '#0d6efd', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}
          >
            입장
          </button>
        </div>
      </div>
    </div>
  );
}
