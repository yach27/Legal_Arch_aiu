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
        Schema::create('ai_histories', function (Blueprint $table) {
            $table->id('ai_history_id');
            
            // Foreign key to documents
            $table->unsignedBigInteger('doc_id');
            $table->foreign('doc_id')
                  ->references('doc_id')
                  ->on('documents')
                  ->onDelete('cascade');
            
            // Foreign key to users
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')
                  ->references('user_id')
                  ->on('users')
                  ->onDelete('cascade');
            
            $table->longText('message_ai')->nullable();
            $table->longText('question');
            $table->longText('answer');
            $table->string('status')->default('completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_histories');
    }
};
