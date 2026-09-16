<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReactionLog extends Model
{
    protected $primaryKey = 'reaction_id';
    public $timestamps = false;

    protected $fillable = ['post_id', 'user_id', 'genre_id', 'reaction_1', 'reaction_2', 'reaction_3', 'reaction_4'];

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id', 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}