<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Title extends Model
{
    protected $primaryKey = 'title_id';
    public $timestamps = false;

    protected $fillable = ['title_name'];

    public function users()
    {
        return $this->hasMany(User::class, 'title_id', 'title_id');
    }
}