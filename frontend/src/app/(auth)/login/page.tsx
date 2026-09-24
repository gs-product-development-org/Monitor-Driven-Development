'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import { Button } from '@/components/ui/Button';
import './login.css';

// Supabase RPC関数からの返却値の型定義
interface AuthUserResponse {
  user_id: number;
  user_number: number;
  role: 'teacher' | 'student';
  class_id: number;
  class_name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  // エラーメッセージとローディング状態の管理
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // 1. 入力値を数値型（INT）に変換
      const parsedClassId = parseInt(classId, 10);
      const parsedUserNumber = parseInt(studentId, 10);

      if (isNaN(parsedClassId) || isNaN(parsedUserNumber)) {
        setErrorMessage('クラス番号と出席番号は半角数字で入力してください。');
        setIsLoading(false);
        return;
      }

      // 2. Supabase の RPC (auth_student) を呼び出し
      const { data, error } = await supabase.rpc('auth_student', {
        p_class_id: parsedClassId,
        p_user_number: parsedUserNumber,
        p_password: password,
      });

      if (error) {
        console.error('認証エラー:', error.message);
        setErrorMessage('ログイン処理中にエラーが発生しました。');
        setIsLoading(false);
        return;
      }

      // 3. 認証結果の判定
      const userList = data as AuthUserResponse[];

      if (!userList || userList.length === 0) {
        setErrorMessage('クラス番号、出席番号、またはパスワードが正しくありません。');
        setIsLoading(false);
        return;
      }

      // 該当箇所の修正（LoginPage.tsx 内の handleStart）

      // 該当するユーザー情報を取得
      const user = userList[0];

      // ★ useUserStore が求める型に変換するオブジェクトを作成
      const formattedUserForStore = {
        user_id: user.user_id,
        user_number: user.user_number, // ★ 追加: useUserStore で必須となっているプロパティ
        class_id: String(user.class_id),
        student_id: String(user.user_number),
        role: user.role,
      };

      setUser(formattedUserForStore);
      sessionStorage.setItem('user_info', JSON.stringify(formattedUserForStore));

      // 5. 教師・児童問わず /home へ遷移
      router.push('/home');

    } catch (err) {
      console.error('予期せぬエラー:', err);
      setErrorMessage('ログインに失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleStart} className="login-form">
        {/* エラーメッセージ表示エリア */}
        {errorMessage && (
          <div className="login-error-message" style={{ color: 'red', marginBottom: '12px', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {/* 1. クラスID */}
        <input
          type="text"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          placeholder="クラス番号"
          className="login-input"
          required
        />

        {/* 2. 児童ID / 教員ID */}
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="出席番号"
          className="login-input"
          required
        />

        {/* 3. パスワード */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="login-input"
          required
        />

        {/* 4. スタートボタン */}
        <Button type="submit" className="start-button" disabled={isLoading}>
          START
        </Button>
      </form>
    </div>
  );
}