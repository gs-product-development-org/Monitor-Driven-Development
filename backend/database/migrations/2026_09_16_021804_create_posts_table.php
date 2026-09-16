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
        Schema::create('posts', function (Blueprint $table) {
            $table->id('post_id');
            $table->foreignId('class_id')->constrained('classes', 'class_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'user_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('topics', 'topic_id')->onUpdate('cascade')->onDelete('cascade');
            $table->text('post_content');
            $table->boolean('is_posted')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
