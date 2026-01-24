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
        // Add indexes to folders table for faster queries
        Schema::table('folders', function (Blueprint $table) {
            $table->index('parent_folder_id'); // Speed up WHERE parent_folder_id = X queries
            $table->index('folder_name');      // Speed up search and ORDER BY queries
            $table->index('updated_at');       // Speed up sorting by updated_at
        });

        // Add indexes to documents table for faster queries
        Schema::table('documents', function (Blueprint $table) {
            $table->index('folder_id');        // Speed up WHERE folder_id = X queries
            $table->index('status');           // Speed up filtering by status
            $table->index('created_at');       // Speed up sorting by date
            $table->index(['folder_id', 'status']); // Speed up combined queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('folders', function (Blueprint $table) {
            $table->dropIndex(['parent_folder_id']);
            $table->dropIndex(['folder_name']);
            $table->dropIndex(['updated_at']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['folder_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['folder_id', 'status']);
        });
    }
};
