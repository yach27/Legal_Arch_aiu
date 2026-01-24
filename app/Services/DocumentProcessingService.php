<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEmbedding;
use App\Models\Folder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\GroqService;

/**
 * Service for handling document text extraction, chunking, and embedding generation
 */
class DocumentProcessingService
{
    private string $textExtractionUrl;
    private string $embeddingUrl;
    private string $aiBridgeUrl;
    private string $aiServiceType;
    private int $chunkSize;
    private int $chunkOverlap;
    private GroqService $groqService;

    public function __construct(GroqService $groqService)
    {
        $this->textExtractionUrl = env('TEXT_EXTRACTION_URL', 'http://127.0.0.1:5002');
        $this->embeddingUrl = env('LOCAL_EMBEDDING_URL', 'http://127.0.0.1:5001');
        $this->aiBridgeUrl = env('AI_BRIDGE_URL', 'http://127.0.0.1:5003');
        $this->aiServiceType = env('AI_SERVICE_TYPE', 'groq');
        $this->chunkSize = env('CHUNK_SIZE', 1000);
        $this->chunkOverlap = env('CHUNK_OVERLAP', 200);
        $this->groqService = $groqService;
    }

    /**
     * Process document content and generate embeddings
     */
    public function processDocument(Document $document, string $mimeType): void
    {
        try {
            $fullPath = Storage::disk('documents')->path($document->file_path);

            // Extract text using Python service
            $fullText = $this->extractText($fullPath, $mimeType);

            if (empty($fullText)) {
                $document->update(['status' => 'failed', 'remarks' => 'Could not extract text from document']);
                return;
            }

            // Split text into chunks
            $chunks = $this->chunkText($fullText);

            if (empty($chunks)) {
                $document->update(['status' => 'failed', 'remarks' => 'Document text too short for processing']);
                return;
            }

            // Generate embeddings for chunks
            $embeddings = $this->generateEmbeddings($chunks);

            // Store embeddings in database
            $this->storeEmbeddings($document, $embeddings);

            // --- Generate AI metadata (title, description, remarks) ---
            // Use AI Bridge for local mode, GROQ for online mode
            if ($this->aiServiceType === 'local') {
                // Use local AI Bridge service (Llama)
                $aiResult = $this->callAiBridgeForAnalysis($fullText, $document);
                if ($aiResult) {
                    $document->title = $aiResult['title'] ?? $document->title;
                    $document->description = $aiResult['description'] ?? null;
                    $document->remarks = $aiResult['remarks'] ?? null;
                    $document->ai_suggested_folder = $aiResult['suggested_folder'] ?? null;
                    $document->save();
                    Log::info('Updated document via AI Bridge (local Llama)', [
                        'doc_id' => $document->doc_id,
                        'title' => $document->title,
                        'description' => substr($document->description ?? '', 0, 100),
                        'suggested_folder' => $document->ai_suggested_folder
                    ]);
                }
            } elseif ($this->groqService->isConfigured()) {
                // Use GROQ API (online)
                try {
                    $formattedTitle = $this->groqService->generateFormattedTitle($fullText);
                    $document->title = $formattedTitle;
                    $document->save();
                    Log::info('Updated document title via Groq', ['doc_id' => $document->doc_id, 'new_title' => $formattedTitle]);
                } catch (\Exception $e) {
                    Log::warning('Failed to update title via Groq', ['error' => $e->getMessage()]);
                }
            }

            // Update document status to active after successful processing
            $updateData = ['status' => 'active'];

            // Keep AI-generated remarks if we have them, otherwise clear old processing info
            if (empty($document->remarks) || str_contains($document->remarks, 'Processed into') || str_contains($document->remarks, 'chunks')) {
                if (!empty($document->description)) {
                    $descriptionSummary = $document->description;
                    $firstSentence = preg_split('/(?<=[.!?])\s+/', $descriptionSummary, 2);
                    $updateData['remarks'] = strlen($firstSentence[0]) > 150
                        ? substr($firstSentence[0], 0, 147) . '...'
                        : $firstSentence[0];
                } else {
                    $updateData['remarks'] = null;
                }
            }

            $document->update($updateData);

            Log::info('Document processed successfully', [
                'doc_id' => $document->doc_id,
                'chunks' => count($chunks)
            ]);

        } catch (\Exception $e) {
            Log::error('Document processing failed', [
                'doc_id' => $document->doc_id,
                'error' => $e->getMessage()
            ]);

            $document->update([
                'status' => 'failed',
                'remarks' => 'AI processing failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Extract text from document using Python service (public method)
     */
    public function extractTextFromFile(string $filePath, string $mimeType): string
    {
        return $this->extractText($filePath, $mimeType);
    }

    /**
     * Extract text from document using Python service
     */
    private function extractText(string $filePath, string $mimeType): string
    {
        try {
            // Convert Windows paths to forward slashes for the HTTP request
            $normalizedPath = str_replace('\\', '/', $filePath);

            $response = Http::timeout(120)->post($this->textExtractionUrl . '/extract/path', [
                'file_path' => $normalizedPath,
                'mime_type' => $mimeType
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['text'] ?? '';
            }

            throw new \Exception('Text extraction service error: ' . $response->body());

        } catch (\Exception $e) {
            throw new \Exception('Text extraction failed: ' . $e->getMessage());
        }
    }

    /**
     * Split text into chunks with overlap
     */
    private function chunkText(string $text): array
    {
        if (empty($text)) {
            return [];
        }

        $chunks = [];
        $sentences = $this->splitIntoSentences($text);

        $currentChunk = '';
        $currentLength = 0;

        foreach ($sentences as $sentence) {
            $sentenceLength = strlen($sentence);

            if ($currentLength + $sentenceLength > $this->chunkSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);

                // Add overlap from previous chunk
                $overlapText = $this->getOverlapText($currentChunk, $this->chunkOverlap);
                $currentChunk = $overlapText . ' ' . $sentence;
                $currentLength = strlen($currentChunk);
            } else {
                $currentChunk .= ' ' . $sentence;
                $currentLength += $sentenceLength + 1;
            }
        }

        if (!empty($currentChunk)) {
            $chunks[] = trim($currentChunk);
        }

        // Filter out very short chunks
        return array_filter($chunks, fn($chunk) => strlen(trim($chunk)) > 50);
    }

    /**
     * Split text into sentences
     */
    private function splitIntoSentences(string $text): array
    {
        $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        return array_filter($sentences, fn($sentence) => strlen(trim($sentence)) > 10);
    }

    /**
     * Get overlap text from end of chunk
     */
    private function getOverlapText(string $text, int $overlapLength): string
    {
        if (strlen($text) <= $overlapLength) {
            return $text;
        }

        $overlap = substr($text, -$overlapLength);
        $spacePos = strpos($overlap, ' ');
        if ($spacePos !== false) {
            $overlap = substr($overlap, $spacePos + 1);
        }

        return $overlap;
    }

    /**
     * Generate embeddings for text chunks
     */
    private function generateEmbeddings(array $chunks): array
    {
        $embeddings = [];

        foreach ($chunks as $chunk) {
            try {
                $response = Http::timeout(30)->post($this->embeddingUrl . '/embed/single', [
                    'text' => $chunk
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $embeddings[] = [
                        'chunk_text' => $chunk,
                        'embedding' => $data['embedding'] ?? [],
                        'model_type' => 'all-MiniLM-L6-v2',
                        'dimensions' => $data['dimensions'] ?? 384,
                        'service_response' => true
                    ];
                } else {
                    // Use mock embedding as fallback
                    $embeddings[] = [
                        'chunk_text' => $chunk,
                        'embedding' => $this->generateMockEmbedding($chunk),
                        'model_type' => 'mock-fallback',
                        'dimensions' => 384,
                        'service_response' => false
                    ];
                }
            } catch (\Exception $e) {
                Log::warning('Embedding generation failed for chunk, using mock', [
                    'error' => $e->getMessage()
                ]);

                // Use mock embedding as fallback
                $embeddings[] = [
                    'chunk_text' => $chunk,
                    'embedding' => $this->generateMockEmbedding($chunk),
                    'model_type' => 'mock-fallback',
                    'dimensions' => 384,
                    'service_response' => false,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $embeddings;
    }

    /**
     * Store embeddings in database
     */
    private function storeEmbeddings(Document $document, array $embeddings): void
    {
        foreach ($embeddings as $index => $embeddingData) {
            DocumentEmbedding::create([
                'doc_id' => $document->doc_id,
                'chunk_index' => $index,
                'chunk_text' => $embeddingData['chunk_text'],
                'embedding_vector' => json_encode($embeddingData['embedding']),
                'metadata' => [
                    'model_type' => $embeddingData['model_type'] ?? 'all-MiniLM-L6-v2',
                    'embedding_dimensions' => count($embeddingData['embedding']),
                    'chunk_length' => strlen($embeddingData['chunk_text']),
                    'generated_at' => now()->toISOString(),
                    'service_url' => $this->embeddingUrl,
                    'service_response' => $embeddingData['service_response'] ?? false
                ],
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Generate mock embedding for fallback
     */
    private function generateMockEmbedding(string $text): array
    {
        $hash = md5($text);
        $embedding = [];

        for ($i = 0; $i < 32; $i += 2) {
            $hex = substr($hash, $i, 2);
            $value = (hexdec($hex) / 255.0) * 2.0 - 1.0;
            $embedding[] = round($value, 6);
        }

        while (count($embedding) < 384) {
            $embedding = array_merge($embedding, $embedding);
        }

        return array_slice($embedding, 0, 384);
    }

    /**
     * Get MIME type from file extension
     */
    public function getMimeType(string $fileName): string
    {
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt' => 'text/plain',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }

    /**
     * Call AI Bridge service for document analysis (local Llama model)
     * Returns title, description, remarks, and suggested folder
     */
    private function callAiBridgeForAnalysis(string $text, Document $document): ?array
    {
        try {
            // Get available folders for AI suggestion
            $folders = Folder::select('folder_id', 'folder_name', 'folder_path')
                ->get()
                ->map(function ($folder) {
                    return [
                        'folder_id' => $folder->folder_id,
                        'folder_name' => $folder->folder_name,
                        'folder_path' => $folder->folder_path
                    ];
                })
                ->toArray();

            Log::info('Calling AI Bridge for analysis', [
                'doc_id' => $document->doc_id,
                'text_length' => strlen($text),
                'folders_count' => count($folders),
                'ai_bridge_url' => $this->aiBridgeUrl
            ]);

            // Call AI Bridge /api/documents/analyze endpoint
            $response = Http::timeout(120)->post($this->aiBridgeUrl . '/api/documents/analyze', [
                'docId' => $document->doc_id,
                'documentText' => $text,
                'folders' => $folders
            ]);

            if ($response->successful()) {
                $data = $response->json();

                Log::info('AI Bridge response received', [
                    'doc_id' => $document->doc_id,
                    'title' => $data['title'] ?? 'N/A',
                    'description' => isset($data['description']) ? substr($data['description'], 0, 50) . '...' : 'N/A',
                    'suggested_folder' => $data['suggested_folder'] ?? 'N/A'
                ]);

                return [
                    'title' => $data['title'] ?? null,
                    'description' => $data['description'] ?? null,
                    'remarks' => $data['remarks'] ?? null,
                    'suggested_folder' => $data['suggested_folder'] ?? null
                ];
            }

            Log::warning('AI Bridge returned non-success response', [
                'doc_id' => $document->doc_id,
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500)
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('AI Bridge call failed', [
                'doc_id' => $document->doc_id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
