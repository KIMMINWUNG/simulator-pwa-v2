import React from "react";

export default function Footer() {
  return (
    <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
      <footer style={{
        width: '90vw',
        maxWidth: '1500px',
        backgroundColor: '#f0f4f8',
        padding: '16px 20px',
        marginTop: '40px',
        fontSize: '13px',
        color: '#444',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/ci_logo.png" alt="국토안전관리원 CI" style={{ height: '32px' }} />
          <div>
            <strong>국토안전관리원</strong><br />
            담당자:  &nbsp;|&nbsp; 연락처:  &nbsp;|&nbsp; 주소: 
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          ⓒ 2025 . All rights reserved.
        </div>
      </footer>
    </div>
  );
}
