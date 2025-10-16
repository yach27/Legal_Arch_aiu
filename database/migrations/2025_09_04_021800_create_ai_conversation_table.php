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
        Schema::create('ai_conversation', function (Blueprint $table) {
            $table->id('conversation_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('doc_id')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            
            $table->index('user_id');
            $table->index('doc_id');
            
            // Foreign key for users (assuming users table exists with id column)
            // Adjust the reference column if your users table uses a different primary key
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            
            // Skip document foreign key since table is empty
            // You can add this later when you have document data:
            // $table->foreign('doc_id')->references('doc_id')->on('document')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_conversation');
    }
};