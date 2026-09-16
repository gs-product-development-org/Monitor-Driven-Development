<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $primaryKey = 'post_id';
    public $timestamps = false;

    protected $fillable = ['class_id', 'user_id', 'topic_id', 'post_content', 'is_posted'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id', 'topic_id');
    }

    public function reactionLogs()
    {
        return $this->hasMany(ReactionLog::class, 'post_id', 'post_id');
    }
}