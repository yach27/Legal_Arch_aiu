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
        Schema::create('documents', function (Blueprint $table) {
            $table->id('doc_id');
            $table->string('title');
            $table->string('file_path');
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('cascade');
            $table->string('status')->default('active');
            
            // Foreign key to categories
            $table->unsignedBigInteger('category_id');
            $table->foreign('category_id')
                  ->references('category_id')
                  ->on('categories')
                  ->onDelete('cascade');
            
            // Foreign key to folders (nullable)
            $table->unsignedBigInteger('folder_id')->nullable();
            $table->foreign('folder_id')
                  ->references('folder_id')
                  ->on('folders')
                  ->onDelete('set null');
            
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
