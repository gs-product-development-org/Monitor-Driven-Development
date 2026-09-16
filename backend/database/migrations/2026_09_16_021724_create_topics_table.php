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
        Schema::create('topics', function (Blueprint $table) {
            $table->id('topic_id');
            $table->foreignId('class_id')->constrained('classes', 'class_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('genre_id')->constrained('genres', 'genre_id')->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('template_topic_id')->nullable()->constrained('template_topics', 'template_topic_id')->onUpdate('cascade')->onDelete('cascade');
            $table->text('topic_content');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topics');
    }
};
