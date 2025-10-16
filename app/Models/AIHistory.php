<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIHistory extends Model
{
    protected $table = 'ai_histories';
    protected $primaryKey = 'ai_history_id';
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'doc_id',
        'user_id',
        'message_ai',
        'question',
        'answer',
        'status',
        'document_references',
        'created_at',
    ];

    protected $casts = [
        'doc_id' => 'integer',
        'user_id' => 'integer',
        'conversation_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AIConversation::class, 'conversation_id', 'conversation_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'doc_id', 'doc_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}