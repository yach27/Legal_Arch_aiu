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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id('log_id');
            
            // Foreign key to users
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')
                  ->references('user_id')
                  ->on('users')
                  ->onDelete('cascade');
            
            // Foreign key to documents (nullable)
            $table->unsignedBigInteger('doc_id')->nullable();
            $table->foreign('doc_id')
                  ->references('doc_id')
                  ->on('documents')
                  ->onDelete('set null');
            
            $table->string('activity_type');
            $table->timestamp('activity_time')->useCurrent();
            $table->text('activity_details')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
