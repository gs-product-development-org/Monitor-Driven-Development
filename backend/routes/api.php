<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Laravel (Backend) との通信に成功しました！',
        'timestamp' => now()->toDateTimeString(),
    ]);
});