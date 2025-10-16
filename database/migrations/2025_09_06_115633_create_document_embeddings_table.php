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
        Schema::create('document_embeddings', function (Blueprint $table) {
            $table->id('embedding_id');
            
            // Foreign key to documents
            $table->unsignedBigInteger('doc_id');
            $table->foreign('doc_id')
                  ->references('doc_id')
                  ->on('documents')
                  ->onDelete('cascade');
            
            $table->integer('chunk_index');
            $table->longText('chunk_text');
            $table->longText('embedding_vector');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_embeddings');
    }
};
