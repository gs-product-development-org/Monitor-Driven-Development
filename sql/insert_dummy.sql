-- 1. クラステーブル (3クラス)
INSERT INTO public.classes (class_name, gacha_meter) VALUES
('4年1組', 0),
('4年2組', 0),
('4年3組', 0);

-- 2. お題ジャンルテーブル (5個)
INSERT INTO public.genres (genre_name) VALUES
('日常'),
('おもしろ'),
('雑学'),
('趣味'),
('授業');

-- 3. お題テンプレテーブル (各ジャンル2個 = 計10個)
INSERT INTO public.template_topics (genre_id, template_topic_content) VALUES
(1, '最近あった嬉しかったこと'),
(1, 'きょうのあさごはんはなに？'),
(2, 'もしも魔法が使えたら？'),
(2, 'ダジャレをひとつ発表して！'),
(3, 'みんなが知らない豆知識'),
(4, 'すきな生き物のひみつ'),
(4, 'いま一番ハマっていること'),
(4, 'お休みの日は何をして遊ぶ？'),
(5, '一番好きな教科とその理由'),
(5, '今日学習したことで印象に残ったこと');

-- 4. ガチャアイテムテーブル (26個)
INSERT INTO public.items (item_name, item_image) VALUES
('Frying pan', 'no_image.png'), ('Cat', 'no_image.png'), ('Dog', 'no_image.png'), ('Crocodile', 'no_image.png'),
('Bear', 'no_image.png'), ('Rabbit', 'no_image.png'), ('Camel', 'no_image.png'), ('Giraffe', 'no_image.png'),
('Panda', 'no_image.png'), ('Caterpillar', 'no_image.png'), ('Chick', 'no_image.png'), ('Chicken', 'no_image.png'),
('Horse', 'no_image.png'), ('Rhino', 'no_image.png'), ('Fried egg', 'no_image.png'), ('PC', 'no_image.png'),
('Mouse', 'no_image.png'), ('Outlet', 'no_image.png'), ('Vacuum cleaner', 'no_image.png'), ('Car', 'no_image.png'),
('Eraser', 'no_image.png'), ('Pencil', 'no_image.png'), ('Tiger', 'no_image.png'), ('Cow', 'no_image.png'),
('Snake', 'no_image.png'), ('Sheep', 'no_image.png');

-- 5. 動物園の配置場所テーブル (3エリア)
INSERT INTO public.zoo_areas (area) VALUES
('草原'),
('岩場'),
('水辺');

-- 6. 称号テーブル (計20個)
INSERT INTO public.titles (title_name) VALUES
('ほのぼのマスター'), ('スマイルキング'), ('共感の達人'), ('日常の発見家'),
('爆笑クリエイター'), ('お笑いスター'), ('ユーモア王'), ('アイデアマン'),
('物知りハカセ'), ('雑学王'), ('ナルホド教授'), ('ひらめき天才'),
('熱血チャレンジャー'), ('趣味の極め人'), ('こだわり職人'), ('夢中マスター'),
('ガッツ研究員'), ('ひらめき学習者'), ('発表のプロ'), ('集中リーダー');

-- 7. NGワードテーブル (5単語)
INSERT INTO public.ng_words (word) VALUES
('ばか'), ('あほ'), ('しね'), ('きもい'), ('うるさい');

-- 8. ユーザーテーブル (各クラス30人：先生1人 + 生徒29人 = 計90人)
-- パスワードは 'password123' のダミーハッシュ
INSERT INTO public.users (class_id, user_number, password, role, title_id) VALUES
-- クラス1 (class_id = 1)
(1, 0, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false, null),
(1, 1, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 2, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 3, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 4, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 5, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 6, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 7, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 8, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 9, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 10, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 11, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 12, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 13, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 14, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 15, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 16, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 17, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 18, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 19, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 20, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 21, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 22, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 23, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 24, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 25, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 26, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 27, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 28, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(1, 29, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
-- クラス2 (class_id = 2)
(2, 0, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false, null),
(2, 1, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 2, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 3, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 4, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 5, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 6, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 7, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 8, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 9, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 10, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 11, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 12, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 13, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 14, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 15, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 16, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 17, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 18, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 19, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 20, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 21, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 22, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 23, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 24, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 25, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 26, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 27, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 28, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(2, 29, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
-- クラス3 (class_id = 3)
(3, 0, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', false, null),
(3, 1, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 2, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 3, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 4, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 5, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 6, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 7, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 8, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 9, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 10, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 11, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 12, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 13, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 14, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 15, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 16, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 17, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 18, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 19, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 20, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 21, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 22, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 23, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 24, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 25, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 26, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 27, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 28, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null),
(3, 29, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, null);

-- 9. お題決定後テーブル (手動作成データ)
INSERT INTO public.topics (topic_id, class_id, genre_id, template_topic_id, topic_content) VALUES
(1, 1, 1, 1, '最近あった嬉しかったこと');

-- 10. 投稿テーブル (クラス1、生徒20人分の投稿)
INSERT INTO public.posts (class_id, user_id, topic_id, post_content, is_posted) VALUES
(1, 14, 1, '今日学校の休み時間にみんなで鬼ごっこをしたのが楽しかったです！', true),
(1, 3,  1, '図工の時間に粘土で動物を作りました。上手にできて嬉しいです。', true),
(1, 22, 1, '給食のカレーがとても美味しかったです。おかわりもしました！', true),
(1, 8,  1, '朝の登校のとき、きれいなアジサイの花を見つけました。', true),
(1, 1,  1, '理科の実験でヘチマの観察をしました。芽が出てきてすごいです。', true),
(1, 27, 1, '音楽の合奏の練習で、木琴のパートをがんばっています。', true),
(1, 5,  1, '校庭でドッジボールをして、たくさん走り回って汗をかきました。', true),
(1, 19, 1, '図書室で面白い本を借りました。はやく続きが読みたいです。', true),
(1, 11, 1, 'パソコンの授業でタイピングの練習をしました。少し早くなりました。', true),
(1, 25, 1, '係の仕事で黒板をピカピカにきれいに拭きました。', true),
(1, 2,  1, '今度の遠足がすごく楽しみでお弁当のメニューを考えています。', true),
(1, 17, 1, '漢字のテストで100点が取れて、すごく嬉しかったです！', true),
(1, 9,  1, 'クラスのレクリエーションでみんなで新しい遊びを決めました。', true),
(1, 30, 1, '外で元気にサッカーをして、シュートが決められてよかったです。', true),
(1, 6,  1, '飼育小屋のウサギにエサをあげました。モグモグ食べていて可愛いです。', true),
(1, 21, 1, '今日のそうじの時間、みんなで協力して教室をピカピカにしました。', true),
(1, 13, 1, '体育のマット運動で、前転が上手にできるようになりました。', true),
(1, 28, 1, 'お楽しみ会の出し物の相談を班のメンバーと盛り上がって話しました。', true),
(1, 4,  1, '朝の会で元気に今月の歌を歌いました。声がよく出ていました。', true),
(1, 16, 1, '家庭科の調理実習の計画を立てるのが今からとても楽しみです。', true),
(1, 10, 1, '水泳の授業で、少し長い距離を泳げるようになって自信がつきました。', true),
(1, 24, 1, 'テストの直しをしっかりやって、分からないところがスッキリしました。', true),
(1, 7,  1, 'お昼休みに校庭の木陰で友達とおしゃべりをして過ごしました。', true),
(1, 20, 1, '新しい係のポスターを描いて、みんなに見てもらいました。', true),
(1, 15, 1, 'クラブ活動の時間が待ち遠しいです。今日は何をするのかな。', true),
(1, 12, 1, '今日の給食のデザートがプリンで、みんなで大喜びしました。', false),
(1, 29, 1, '帰りの会のスピーチで、自分の好きなことについて発表しました。', false),
(1, 18, 1, '算数の難しい問題が、自分で考えて解けたのでスッキリしました。', false),
(1, 23, 1, '委員会のポスター作りをみんなで分担してがんばって進めました。', false),
(1, 26, 1, '明日も元気に学校に来て、たくさんお友達と遊びたいです！', false);

-- 11. リアクションログテーブル (サンプルとして一部のログを挿入)
INSERT INTO public.reaction_logs (post_id, user_id, genre_id, reaction_1, reaction_2, reaction_3, reaction_4) VALUES
-- 1人目 (user_id=14): post_id 1, 2, 3
(1, 14, 1, 1, 0, 0, 0),
(2, 14, 1, 0, 1, 0, 0),
(3, 14, 1, 0, 0, 1, 0),

-- 2人目 (user_id=3): post_id 4, 5, 6
(4, 3, 1, 0, 0, 0, 1),
(5, 3, 1, 1, 0, 0, 0),
(6, 3, 1, 0, 1, 0, 0),

-- 3人目 (user_id=22): post_id 7, 8, 9
(7, 22, 1, 0, 0, 1, 0),
(8, 22, 1, 0, 0, 0, 1),
(9, 22, 1, 1, 0, 0, 0),

-- 4人目 (user_id=8): post_id 10, 11, 12
(10, 8, 1, 0, 1, 0, 0),
(11, 8, 1, 0, 0, 1, 0),
(12, 8, 1, 0, 0, 0, 1),

-- 5人目 (user_id=1): post_id 13, 14, 15
(13, 1, 1, 1, 0, 0, 0),
(14, 1, 1, 0, 1, 0, 0),
(15, 1, 1, 0, 0, 1, 0),

-- 6人目 (user_id=27): post_id 16, 17, 18
(16, 27, 1, 0, 0, 0, 1),
(17, 27, 1, 1, 0, 0, 0),
(18, 27, 1, 0, 1, 0, 0),

-- 7人目 (user_id=5): post_id 19, 20, 21
(19, 5, 1, 0, 0, 1, 0),
(20, 5, 1, 0, 0, 0, 1),
(21, 5, 1, 1, 0, 0, 0),

-- 8人目 (user_id=19): post_id 22, 23, 24
(22, 19, 1, 0, 1, 0, 0),
(23, 19, 1, 0, 0, 1, 0),
(24, 19, 1, 0, 0, 0, 1),

-- 9人目 (user_id=11): post_id 25, 1, 2 (25まで達したため1へループ)
(25, 11, 1, 1, 0, 0, 0),
(1,  11, 1, 0, 1, 0, 0),
(2,  11, 1, 0, 0, 1, 0),

-- 10人目 (user_id=25): post_id 3, 4, 5
(3, 25, 1, 0, 0, 0, 1),
(4, 25, 1, 1, 0, 0, 0),
(5, 25, 1, 0, 1, 0, 0),

-- 11人目 (user_id=2): post_id 6, 7, 8
(6, 2, 1, 0, 0, 1, 0),
(7, 2, 1, 0, 0, 0, 1),
(8, 2, 1, 1, 0, 0, 0),

-- 12人目 (user_id=17): post_id 9, 10, 11
(9,  17, 1, 0, 1, 0, 0),
(10, 17, 1, 0, 0, 1, 0),
(11, 17, 1, 0, 0, 0, 1),

-- 13人目 (user_id=9): post_id 12, 13, 14
(12, 9, 1, 1, 0, 0, 0),
(13, 9, 1, 0, 1, 0, 0),
(14, 9, 1, 0, 0, 1, 0),

-- 14人目 (user_id=30): post_id 15, 16, 17
(15, 30, 1, 0, 0, 0, 1),
(16, 30, 1, 1, 0, 0, 0),
(17, 30, 1, 0, 1, 0, 0),

-- 15人目 (user_id=6): post_id 18, 19, 20
(18, 6, 1, 0, 0, 1, 0),
(19, 6, 1, 0, 0, 0, 1),
(20, 6, 1, 1, 0, 0, 0),

-- 16人目 (user_id=21): post_id 21, 22, 23
(21, 21, 1, 0, 1, 0, 0),
(22, 21, 1, 0, 0, 1, 0),
(23, 21, 1, 0, 0, 0, 1),

-- 17人目 (user_id=13): post_id 24, 25, 1 (ループ)
(24, 13, 1, 1, 0, 0, 0),
(25, 13, 1, 0, 1, 0, 0),
(1,  13, 1, 0, 0, 1, 0),

-- 18人目 (user_id=28): post_id 2, 3, 4
(2, 28, 1, 0, 0, 0, 1),
(3, 28, 1, 1, 0, 0, 0),
(4, 28, 1, 0, 1, 0, 0),

-- 19人目 (user_id=4): post_id 5, 6, 7
(5, 4, 1, 0, 0, 1, 0),
(6, 4, 1, 0, 0, 0, 1),
(7, 4, 1, 1, 0, 0, 0),

-- 20人目 (user_id=16): post_id 8, 9, 10
(8,  16, 1, 0, 1, 0, 0),
(9,  16, 1, 0, 0, 1, 0),
(10, 16, 1, 0, 0, 0, 1),

-- 21人目 (user_id=10): post_id 11, 12, 13
(11, 10, 1, 1, 0, 0, 0),
(12, 10, 1, 0, 1, 0, 0),
(13, 10, 1, 0, 0, 1, 0),

-- 22人目 (user_id=24): post_id 14, 15, 16
(14, 24, 1, 0, 0, 0, 1),
(15, 24, 1, 1, 0, 0, 0),
(16, 24, 1, 0, 1, 0, 0),

-- 23人目 (user_id=7): post_id 17, 18, 19
(17, 7, 1, 0, 0, 1, 0),
(18, 7, 1, 0, 0, 0, 1),
(19, 7, 1, 1, 0, 0, 0),

-- 24人目 (user_id=20): post_id 20, 21, 22
(20, 20, 1, 0, 1, 0, 0),
(21, 20, 1, 0, 0, 1, 0),
(22, 20, 1, 0, 0, 0, 1),

-- 25人目 (user_id=15): post_id 23, 24, 25
(23, 15, 1, 1, 0, 0, 0),
(24, 15, 1, 0, 1, 0, 0),
(25, 15, 1, 0, 0, 1, 0),

-- 26人目 (user_id=12 - 未投稿者): post_id 1, 2, 3 (ループ)
(1, 12, 1, 0, 0, 0, 1),
(2, 12, 1, 1, 0, 0, 0),
(3, 12, 1, 0, 1, 0, 0),

-- 27人目 (user_id=29 - 未投稿者): post_id 4, 5, 6
(4, 29, 1, 0, 0, 1, 0),
(5, 29, 1, 0, 0, 0, 1),
(6, 29, 1, 1, 0, 0, 0),

-- 28人目 (user_id=18 - 未投稿者): post_id 7, 8, 9
(7, 18, 1, 0, 1, 0, 0),
(8, 18, 1, 0, 0, 1, 0),
(9, 18, 1, 0, 0, 0, 1),

-- 29人目 (user_id=23 - 未投稿者): post_id 10, 11, 12
(10, 23, 1, 1, 0, 0, 0),
(11, 23, 1, 0, 1, 0, 0),
(12, 23, 1, 0, 0, 1, 0),

-- 30人目 (user_id=26 - 未投稿者): post_id 13, 14, 15
(13, 26, 1, 0, 0, 0, 1),
(14, 26, 1, 1, 0, 0, 0),
(15, 26, 1, 0, 1, 0, 0);

-- 12. 動物園の配置保存用テーブル (アイテム1〜10を配置)
INSERT INTO public.zoo_placements (item_id, area_id, class_id) VALUES
(1, 2, 1),
(2, 3, 1),
(3, 1, 1),
(4, 2, 1),
(5, 3, 1),
(6, 1, 1),
(7, 2, 1),
(8, 3, 1),
(9, 1, 1),
(10, 2, 1);