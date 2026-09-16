<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NgWord extends Model
{
    protected $primaryKey = 'word_id';
    public $timestamps = false;

    protected $fillable = ['word'];
}