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
        Schema::create('reaction_logs', function (Blueprint $table) {
            $table->id('reaction_id');
            $table->foreignId('post_id')->constrained('posts', 'post_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'user_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('genre_id')->constrained('genres', 'genre_id')->onUpdate('cascade')->onDelete('cascade');
            $table->bigInteger('reaction_1')->default(0);
            $table->bigInteger('reaction_2')->default(0);
            $table->bigInteger('reaction_3')->default(0);
            $table->bigInteger('reaction_4')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reaction_logs');
    }
};
