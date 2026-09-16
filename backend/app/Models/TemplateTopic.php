<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateTopic extends Model
{
    protected $primaryKey = 'template_topic_id';
    public $timestamps = false;

    protected $fillable = ['genre_id', 'template_topic_content'];

    public function genre()
    {
        return $this->belongsTo(Genre::class, 'genre_id', 'genre_id');
    }
}