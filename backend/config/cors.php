<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // '*' に変更することで、どのPC（IPアドレス）からのアクセスも許可します
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // allowed_origins が '*' の場合は supports_credentials を false にする必要があります
    'supports_credentials' => false,

];