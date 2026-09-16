<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $primaryKey = 'topic_id';
    public $timestamps = false; // created_atのみDB側でuseCurrent設定のため自動更新はOFF

    protected $fillable = ['class_id', 'genre_id', 'template_topic_id', 'topic_content'];

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id', 'class_id');
    }

    public function genre()
    {
        return $this->belongsTo(Genre::class, 'genre_id', 'genre_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'topic_id', 'topic_id');
    }
}