<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentEmbedding extends Model
{
    protected $table = 'document_embeddings';
    protected $primaryKey = 'embedding_id';
    public $timestamps = false;

    protected $fillable = [
        'doc_id',
        'chunk_index',
        'chunk_text',
        'embedding_vector',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'doc_id', 'doc_id');
    }
}