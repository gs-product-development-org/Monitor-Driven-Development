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
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->foreignId('class_id')->constrained('classes', 'class_id')->onUpdate('cascade')->onDelete('cascade');
            $table->integer('user_number');
            $table->string('password');
            $table->boolean('role'); // true: 生徒, false: 先生
            $table->foreignId('title_id')->nullable()->constrained('titles', 'title_id')->onUpdate('cascade')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
