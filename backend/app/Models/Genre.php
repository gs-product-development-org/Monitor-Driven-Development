<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Genre extends Model
{
    protected $primaryKey = 'genre_id';
    public $timestamps = false;

    protected $fillable = ['genre_name'];

    public function templateTopics()
    {
        return $this->hasMany(TemplateTopic::class, 'genre_id', 'genre_id');
    }
}
