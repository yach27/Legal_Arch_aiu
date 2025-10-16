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
        Schema::table('document_embeddings', function (Blueprint $table) {
            // Add metadata field to store embedding information
            $table->json('metadata')->nullable()->after('embedding_vector');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_embeddings', function (Blueprint $table) {
            // Remove metadata field
            $table->dropColumn('metadata');
        });
    }
};