<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    protected $table = 'classes';
    protected $primaryKey = 'class_id';
    public $timestamps = false;

    protected $fillable = ['class_name', 'gacha_meter'];

    public function users()
    {
        return $this->hasMany(User::class, 'class_id', 'class_id');
    }

    public function topics()
    {
        return $this->hasMany(Topic::class, 'class_id', 'class_id');
    }
}
