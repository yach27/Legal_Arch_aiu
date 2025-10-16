<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->id('folder_id'); // Primary key
            $table->string('folder_name');
            $table->string('folder_path');

            // Self-referencing FK (parent folder)
            $table->unsignedBigInteger('parent_folder_id')->nullable();
            $table->foreign('parent_folder_id')
                  ->references('folder_id')
                  ->on('folders')
                  ->onDelete('cascade');

            // Reference to User (who created it)
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')
                  ->references('user_id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->string('folder_type');

            // Reference to Category (nullable)
            $table->unsignedBigInteger('category_id')->nullable();
            $table->foreign('category_id')
                  ->references('category_id')
                  ->on('categories')
                  ->onDelete('set null');

            $table->timestamps(); // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
