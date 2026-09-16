<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * クラスID・出席番号・パスワードによるログイン処理
     */
    public function login(Request $request)
    {
        // 入力バリデーション
        $validator = Validator::make($request->all(), [
            'class_id'    => 'required|exists:classes,class_id',  // 空白じゃない、かつclass_idが存在しているか判定する
            'user_number' => 'required|integer',  // 空白じゃない、かつ数字か
            'password'    => 'required|string',  //空白じゃない、かつハッシュ化されたpassword
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に不備があります。',
                'errors'  => $validator->errors()
            ], 422);
        }

        // 該当ユーザーの検索（クラスIDと出席番号で指定）
        $user = User::where('class_id', $request->class_id)
                    ->where('user_number', $request->user_number)
                    ->first();

        // ユーザー存在チェック & パスワード照合（ハッシュ化チェック）
        if (!$user || !Hash::check($request->password, $user->password)) {  // 生のパスワードとuserテーブルのハッシュ化されたパスワードの一致判定
            return response()->json([
                'success' => false,
                'message' => 'クラス、出席番号、またはパスワードが正しくありません。'
            ], 401);
        }

        // リレーションデータ（所属クラス・設定中の称号）を取得
        $user->load(['class', 'title']);

        // ログイン成功レスポンス（フロントエンドに必要な情報を返却）
        return response()->json([
            'success' => true,
            'message' => 'ログインに成功しました。',
            'data'    => [
                'user_id'     => $user->user_id,
                'user_number' => $user->user_number,
                'role'        => $user->role, // true: 生徒, false: 先生
                'class'       => [
                    'class_id'   => $user->class->class_id,
                    'class_name' => $user->class->class_name,
                ],
                'title'       => $user->title ? $user->title->title_name : null,
            ]
        ], 200);
    }
}