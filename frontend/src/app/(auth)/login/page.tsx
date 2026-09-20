'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import './login.css';

export default function LoginPage() {
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="login-container">
      <form onSubmit={handleStart} className="login-form">
        {/* 1. クラスID */}
        <input
          type="text"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          placeholder="クラスID"
          className="login-input"
          required
        />

        {/* 2. 児童ID / 教員ID */}
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="出席番号 / ID"
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

        {/* 4. スタートボタン（共通コンポーネント） */}
        <Button type="submit">
          スタート
        </Button>
      </form>
    </div>
  );
}