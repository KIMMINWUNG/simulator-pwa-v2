import React, { useState } from "react";
import "./App.css";
import AdminLoginModal from "./components/AdminLoginModal";
import AdminPage from "./components/AdminPage";
import FullAutomationApp from "./components/FullAutomationApp";

const MASTER_KEY = "k.infra";

function LoginComponent({ onSuccess }) {
  const [inputKey, setInputKey] = useState("");
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <div style={{ width: '360px', background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>🔒 인증이 필요합니다</h2>
        <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>기반터 발급 KEY를 입력하세요</p>
        <input
          type="password"
          placeholder="KEY 입력"
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <button
          onClick={() => {
            if (inputKey === MASTER_KEY) onSuccess();
            else alert("KEY가 일치하지 않습니다.");
          }}
          style={{ padding: '10px 0', width: '90%', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          입장하기
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  if (!authorized) {
    return <LoginComponent onSuccess={() => setAuthorized(true)} />;
  }

  if (isAdminMode) {
    return <AdminPage />;
  }

  return (
    <>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={() => setShowAdminLogin(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            backgroundColor: "#1e88e5",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          🔑 관리자 모드
        </button>
      </div>

      <FullAutomationApp />

      {showAdminLogin && (
        <AdminLoginModal
          onSuccess={() => {
            setAuthorized(true);
            setIsAdminMode(true);
            setShowAdminLogin(false);
          }}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}
    </>
  );
}
