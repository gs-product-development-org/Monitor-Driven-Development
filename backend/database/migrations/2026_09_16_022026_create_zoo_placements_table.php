<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zoo_placements', function (Blueprint $table) {
            $table->id('placement_id');
            $table->foreignId('item_id')->constrained('items', 'item_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('area_id')->nullable()->constrained('zoo_areas', 'area_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained('classes', 'class_id')->onUpdate('cascade')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zoo_placements');
    }
};
