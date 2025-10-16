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
        Schema::table('ai_histories', function (Blueprint $table) {
            // Add conversation_id column if it doesn't exist
            if (!Schema::hasColumn('ai_histories', 'conversation_id')) {
                $table->unsignedBigInteger('conversation_id')->nullable()->after('ai_history_id');
                $table->foreign('conversation_id')
                      ->references('conversation_id')
                      ->on('ai_conversation')
                      ->onDelete('cascade');
            }

            // Add created_at column if it doesn't exist
            if (!Schema::hasColumn('ai_histories', 'created_at')) {
                $table->timestamp('created_at')->nullable()->after('status');
            }

            // Make doc_id nullable since not all conversations require documents
            if (Schema::hasColumn('ai_histories', 'doc_id')) {
                $table->unsignedBigInteger('doc_id')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_histories', function (Blueprint $table) {
            if (Schema::hasColumn('ai_histories', 'conversation_id')) {
                $table->dropForeign(['conversation_id']);
                $table->dropColumn('conversation_id');
            }

            if (Schema::hasColumn('ai_histories', 'created_at')) {
                $table->dropColumn('created_at');
            }
        });
    }
};
