<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service for handling Groq API interactions
 */
class GroqService
{
    private string $apiKey;
    private string $model;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
        $this->model = env('GROQ_MODEL', 'llama-3.3-70b-versatile');
        $this->apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }

    /**
     * Send a chat message to Groq
     */
    public function chat(array $messages, array $options = []): array
    {
        // Extract HTTP client options (don't send to API)
        $timeout = $options['timeout'] ?? 30;
        unset($options['timeout']);

        // Build API payload
        $payload = array_merge([
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 32048,
        ], $options);

        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception('Groq API error: ' . $response->status() . ' - ' . $response->body());
            }

            return $response->json();

        } catch (\Exception $e) {
            Log::error('Groq API call failed', [
                'error' => $e->getMessage(),
                'model' => $this->model
            ]);
            throw $e;
        }
    }

    /**
     * Get a simple completion from Groq
     */
    public function completion(string $prompt, string $systemPrompt = null, array $options = []): string
    {
        $messages = [];

        if ($systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $systemPrompt];
        }

        $messages[] = ['role' => 'user', 'content' => $prompt];

        $response = $this->chat($messages, $options);

        return trim($response['choices'][0]['message']['content'] ?? '');
    }

    /**
     * Analyze documents and identify relevant ones based on a query
     */
    public function identifyRelevantDocuments(string $query, string $documentList, array $options = []): array
    {
        $prompt = "You are analyzing a legal document database. Based on the user's query, identify which document IDs contain relevant information.\n\n";
        $prompt .= "{$documentList}\n";
        $prompt .= "User Query: \"{$query}\"\n\n";
        $prompt .= "INSTRUCTIONS:\n";
        $prompt .= "- Analyze the document titles and content previews\n";
        $prompt .= "- Identify which documents match the user's query\n";
        $prompt .= "- Return ONLY the document IDs as a comma-separated list\n";
        $prompt .= "- If no documents match, return 'NONE'\n";
        $prompt .= "- Do NOT include any explanation, just the IDs\n\n";
        $prompt .= "Example response: 45,67,89\n";
        $prompt .= "Example if no match: NONE\n\n";
        $prompt .= "Your response:";

        $systemPrompt = 'You are a document analysis assistant. Return only document IDs.';

        $options = array_merge([
            'temperature' => 0.1,
            'max_tokens' => 100
        ], $options);

        $result = $this->completion($prompt, $systemPrompt, $options);

        Log::info('Groq document identification', [
            'query' => $query,
            'result' => $result
        ]);

        if ($result === 'NONE' || empty($result)) {
            return [];
        }

        // Parse comma-separated IDs
        $ids = array_map('trim', explode(',', $result));
        return array_filter($ids, 'is_numeric');
    }

    /**
     * Generate a chat response with conversation history
     */
    public function chatWithHistory(string $message, array $history = [], string $systemPrompt = null, array $options = []): string
    {
        $messages = [];

        if ($systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $systemPrompt];
        }

        // Add conversation history
        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content']
            ];
        }

        // Add current message
        $messages[] = ['role' => 'user', 'content' => $message];

        $response = $this->chat($messages, $options);

        return trim($response['choices'][0]['message']['content'] ?? '');
    }

    /**
     * Build a system prompt for document-based responses
     */
    public function buildDocumentSystemPrompt(string $documentContext = ''): string
    {
        $prompt = 'You are a helpful AI assistant for a legal document management system. You provide clear, accurate, and professional responses.';

        if (!empty($documentContext)) {
            $prompt .= "\n\nCRITICAL INSTRUCTIONS:\n" .
                      "- Answer based ONLY on the document content provided\n" .
                      "- Quote specific text from the documents\n" .
                      "- State ONLY document titles when discussing documents\n" .
                      "- If asked 'what folder?', respond ONLY with the folder name from 'Folder:' field\n" .
                      "- NEVER create multi-level folder paths\n" .
                      "- NEVER use phrases like 'located in', 'found in'\n" .
                      "- NEVER mention folders unless explicitly asked\n" .
                      "- NEVER invent information not in the provided context";
        }

        return $prompt;
    }

    /**
     * Check if Groq is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Get current model name
     */
    public function getModel(): string
    {
        return $this->model;
    }
    /**
     * Generate a formatted title from document text
     * Format: YYYY-MM-DD-ClientName-DocumentType
     */
    public function generateFormattedTitle(string $text): string
    {
        $prompt = "Analyze the following document text and generate a specific title.\n\n";
        $prompt .= "Text Content (first 3000 chars): \"" . substr($text, 0, 3000) . "...\"\n\n";
        $prompt .= "INSTRUCTIONS:\n";
        $prompt .= "1. Extract the most relevant Date from the document (Contract date, Letter date, etc.). If none, use today's date (" . date('Y-m-d') . "). Output format: YYYY-MM-DD.\n";
        $prompt .= "2. Extract the Client Name (Person or Company). If unclear, use 'Unknown'.\n";
        $prompt .= "3. Extract the Document Type (e.g., Contract, Agreement, Letter, Invoice, Report).\n";
        $prompt .= "4. Combine them into a single string: YYYY-MM-DD-ClientName-DocumentType\n";
        $prompt .= "5. Return ONLY the formatted string. No explanation.\n";

        $systemPrompt = "You are a legal document assistant. Output only the requested filename format.";

        $options = [
            'temperature' => 0.3,
            'max_tokens' => 32048
        ];

        try {
            return $this->completion($prompt, $systemPrompt, $options);
        } catch (\Exception $e) {
            Log::error('Failed to generate formatted title', ['error' => $e->getMessage()]);
            // Fallback
            return date('Y-m-d') . '-Unknown-Document'; 
        }
    }
}
