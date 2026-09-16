<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. クラステーブル (3クラス)
        $classes = [
            ['class_name' => '4年1組'],
            ['class_name' => '4年2組'],
            ['class_name' => '4年3組'],
        ];
        DB::table('classes')->insert($classes);

        // 2. ユーザーテーブル (各クラス30人：先生1人 + 生徒29人 = 計90人)
        // role: 生徒 = true, 先生 = false
        $users = [];
        $passwordHash = Hash::make('password123'); // ダミーパスワード

        for ($classId = 1; $classId <= 3; $classId++) {
            // 先生 (user_number = 0, role = false)
            $users[] = [
                'class_id'    => $classId,
                'user_number' => 0,
                'password'    => $passwordHash,
                'role'        => false,
                'title_id'    => null,
            ];

            // 生徒 (user_number = 1〜29, role = true)
            for ($num = 1; $num <= 29; $num++) {
                $users[] = [
                    'class_id'    => $classId,
                    'user_number' => $num,
                    'password'    => $passwordHash,
                    'role'        => true,
                    'title_id'    => null,
                ];
            }
        }
        DB::table('users')->insert($users);

        // 3. お題ジャンルテーブル (5個)
        $genres = [
            ['genre_name' => '日常'],
            ['genre_name' => 'おもしろ'],
            ['genre_name' => '雑学'],
            ['genre_name' => '趣味'],
            ['genre_name' => '授業'],
        ];
        DB::table('genres')->insert($genres);

        // 4. お題テンプレテーブル (各ジャンル2個 = 計10個)
        $templateTopics = [
            // ジャンル1: 日常
            ['genre_id' => 1, 'template_topic_content' => '最近あった嬉しかったこと'],
            ['genre_id' => 1, 'template_topic_content' => 'きょうのあさごはんはなに？'],
            // ジャンル2: おもしろ
            ['genre_id' => 2, 'template_topic_content' => 'もしも魔法が使えたら？'],
            ['genre_id' => 2, 'template_topic_content' => 'ダジャレをひとつ発表して！'],
            // ジャンル3: 雑学
            ['genre_id' => 3, 'template_topic_content' => 'みんなが知らない豆知識'],
            ['genre_id' => 3, 'template_topic_content' => 'すきな生き物のひみつ'],
            // ジャンル4: 趣味
            ['genre_id' => 4, 'template_topic_content' => 'いま一番ハマっていること'],
            ['genre_id' => 4, 'template_topic_content' => 'お休みの日は何をして遊ぶ？'],
            // ジャンル5: 授業
            ['genre_id' => 5, 'template_topic_content' => '一番好きな教科とその理由'],
            ['genre_id' => 5, 'template_topic_content' => '今日学習したことで印象に残ったこと'],
        ];
        DB::table('template_topics')->insert($templateTopics);

        // 5. お題決定後テーブル (条件通り空のままにしておく)
        // 今回はお題（topic_id = 1）を1つ手動作成して posts から参照できるようにします
        DB::table('topics')->insert([
            'topic_id'          => 1,
            'class_id'          => 1,
            'genre_id'          => 1,
            'template_topic_id' => 1,
            'topic_content'     => '最近あった嬉しかったこと',
            'created_at'        => now(),
        ]);

        // 6. 投稿テーブル (1クラス分=クラス1、生徒20人分、計20個の投稿)
        $posts = [];
        for ($i = 1; $i <= 20; $i++) {
            // クラス1の生徒のuser_idは 2〜30
            $userId = $i + 1; 
            $posts[] = [
                'class_id'     => 1,
                'user_id'      => $userId,
                'topic_id'     => 1,
                'post_content' => "テスト投稿{$i}：今日学校の休み時間にみんなで鬼ごっこをしたのが楽しかったです！",
                'created_at'   => now(),
            ];
        }
        DB::table('posts')->insert($posts);

        // 7. リアクションログテーブル (20投稿 × 3リアクション = 計60個)
        // 1〜4のうちどれか1つだけ1、他は0
        $reactionLogs = [];
        for ($postId = 1; $postId <= 20; $postId++) {
            for ($r = 1; $r <= 3; $r++) {
                // リアクションするユーザー（クラス2の生徒からランダム抽出などで分散）
                $reactUserId = 31 + (($postId * 3 + $r) % 29); 
                
                // 1〜4のうちランダムで1つを1にする
                $activeReaction = rand(1, 4);

                $reactionLogs[] = [
                    'post_id'    => $postId,
                    'user_id'    => $reactUserId,
                    'genre_id'   => 1,
                    'reaction_1' => $activeReaction === 1 ? 1 : 0,
                    'reaction_2' => $activeReaction === 2 ? 1 : 0,
                    'reaction_3' => $activeReaction === 3 ? 1 : 0,
                    'reaction_4' => $activeReaction === 4 ? 1 : 0,
                    'created_at' => now(),
                ];
            }
        }
        DB::table('reaction_logs')->insert($reactionLogs);

        // 8. ガチャアイテムテーブル (26個)
        $itemNames = [
            'Frying pan', 'Cat', 'Dog', 'Crocodile', 'Bear', 'Rabbit', 
            'Camel', 'Giraffe', 'Panda', 'Caterpillar', 'Chick', 'Chicken', 
            'Horse', 'Rhino', 'Fried egg', 'PC', 'Mouse', 'Outlet', 
            'Vacuum cleaner', 'Car', 'Eraser', 'Pencil', 'Tiger', 'Cow', 
            'Snake', 'Sheep'
        ];
        $items = [];
        foreach ($itemNames as $name) {
            $items[] = [
                'item_name'  => $name,
                'item_image' => 'no_image.png',
            ];
        }
        DB::table('items')->insert($items);

        // 9. 動物園の配置場所テーブル (3エリア)
        $zooAreas = [
            ['area' => '草原'],
            ['area' => '岩場'],
            ['area' => '水辺'],
        ];
        DB::table('zoo_areas')->insert($zooAreas);

        // 10. 動物園の配置保存用テーブル (10個のアイテムを配置)
        $zooPlacements = [];
        for ($i = 1; $i <= 10; $i++) {
            $zooPlacements[] = [
                'item_id'  => $i,
                'area_id'  => ($i % 3) + 1, // 1〜3のエリアに割り振る
                'class_id' => 1,
            ];
        }
        DB::table('zoo_placements')->insert($zooPlacements);

        // 11. 称号テーブル (5ジャンル × 4リアクション = 計20個)
        $titles = [
            // ジャンル1（日常）
            ['title_name' => 'ほのぼのマスター'], ['title_name' => 'スマイルキング'], ['title_name' => '共感の達人'], ['title_name' => '日常の発見家'],
            // ジャンル2（おもしろ）
            ['title_name' => '爆笑クリエイター'], ['title_name' => 'お笑いスター'], ['title_name' => 'ユーモア王'], ['title_name' => 'アイデアマン'],
            // ジャンル3（雑学）
            ['title_name' => '物知りハカセ'], ['title_name' => '雑学王'], ['title_name' => 'ナルホド教授'], ['title_name' => 'ひらめき天才'],
            // ジャンル4（趣味）
            ['title_name' => '熱血チャレンジャー'], ['title_name' => '趣味の極め人'], ['title_name me' => 'こだわり職人'], ['title_name' => '夢中マスター'],
            // ジャンル5（授業）
            ['title_name' => 'ガッツ研究員'], ['title_name' => 'ひらめき学習者'], ['title_name' => '発表のプロ'], ['title_name' => '集中リーダー'],
        ];
        DB::table('titles')->insert($titles);

        // 12. NGワードテーブル (5単語)
        $ngWords = [
            ['word' => 'ばか', 'created_at' => now()],
            ['word' => 'あほ', 'created_at' => now()],
            ['word' => 'しね', 'created_at' => now()],
            ['word' => 'きもい', 'created_at' => now()],
            ['word' => 'うるさい', 'created_at' => now()],
        ];
        DB::table('ng_words')->insert($ngWords);
    }
}