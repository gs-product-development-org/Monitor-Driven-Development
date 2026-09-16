<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $primaryKey = 'user_id';
    public $timestamps = false;

    protected $fillable = ['class_id', 'user_number', 'password', 'role', 'title_id'];

    protected $hidden = ['password'];

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id', 'class_id');
    }

    public function title()
    {
        return $this->belongsTo(Title::class, 'title_id', 'title_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'user_id', 'user_id');
    }
}
