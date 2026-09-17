'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import './login.css'; // 👈 普通のCSSファイルとしてインポート

export default function LoginPage() {
  const router = useRouter();
  type UserStoreState = ReturnType<typeof useUserStore.getState>;
  const setUser = useUserStore((state: UserStoreState) => state.setUser);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
      
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          student_id: studentId,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ログインに失敗しました。IDとパスワードを確認してください。');
      }

      setUser({
        role: data.role,
        class_id: data.class_id,
        student_id: data.student_id,
      });

      router.push('/zoo');

    } catch (err: any) {
      setErrorMsg(err.message || '通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          ワークスペースへログイン
        </h1>

        {errorMsg && (
          <div className="login-error-message">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field-group">
            <label className="login-label">
              クラスID
            </label>
            <input
              type="text"
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="例: C-101"
              className="login-input"
            />
          </div>

          <div className="login-field-group">
            <label className="login-label">
              児童ID（出席番号）/ 教員ID
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="例: 12"
              className="login-input"
            />
          </div>

          <div className="login-field-group">
            <label className="login-label">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit-button"
          >
            {loading ? 'ログイン処理中...' : 'ログインする'}
          </button>
        </form>
      </div>
    </div>
  );
}