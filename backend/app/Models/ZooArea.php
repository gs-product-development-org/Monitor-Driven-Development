<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZooArea extends Model
{
    protected $primaryKey = 'area_id';
    public $timestamps = false;

    protected $fillable = ['area'];
}