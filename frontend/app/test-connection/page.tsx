'use client';

import { useState } from 'react';

export default function TestConnectionPage() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Laravel の API エンドポイントへリクエスト
      const res = await fetch('http://localhost:8000/api/ping');

      if (!res.ok) {
        throw new Error(`HTTP エラー! ステータス: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || '通信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>フロントエンド ⇄ バックエンド 疎通確認</h1>
      <p>下のボタンを押して、Laravel API (`http://localhost:8000/api/ping`) と通信できるか確認します。</p>

      <button
        onClick={testApiConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {loading ? '通信中...' : 'Laravel へ接続テスト'}
      </button>

      {/* 結果表示 */}
      {response && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6fffa', border: '1px solid #319795', borderRadius: '5px' }}>
          <h3 style={{ color: '#234e52', margin: '0 0 10px 0' }}>✅ 接続成功！</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #e53e3e', borderRadius: '5px' }}>
          <h3 style={{ color: '#9b2c2c', margin: '0 0 10px 0' }}>❌ 通信エラー</h3>
          <p style={{ color: '#c53030' }}>{error}</p>
          <small>※ Laravel が `php artisan serve` で起動しているか、CORS 設定（`config/cors.php`）を確認してください。</small>
        </div>
      )}
    </div>
  );
}