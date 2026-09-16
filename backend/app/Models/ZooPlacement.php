<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZooPlacement extends Model
{
    protected $primaryKey = 'placement_id';
    public $timestamps = false;

    protected $fillable = ['item_id', 'area_id', 'class_id'];

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id', 'item_id');
    }

    public function area()
    {
        return $this->belongsTo(ZooArea::class, 'area_id', 'area_id');
    }

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id', 'class_id');
    }
}