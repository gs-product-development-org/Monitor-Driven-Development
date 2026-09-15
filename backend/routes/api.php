<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Supabase DB への接続テスト用 API
Route::get('/ping', function () {
    try {
        // Supabase DB へ「現在のサーバー時刻」を問い合わせるSQLを実行
        $dbStatus = DB::select('SELECT NOW() as current_time');

        return response()->json([
            'status' => 'success',
            'message' => 'Laravel ⇄ Supabase DB の接続に成功しました！',
            'db_time' => $dbStatus[0]->current_time,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'DB接続失敗: ' . $e->getMessage(),
        ], 500);
    }
});