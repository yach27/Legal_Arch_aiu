<?php

namespace App\Services;

use App\Models\Folder;
use Illuminate\Support\Facades\Log;

/**
 * Service for intelligently matching documents to folders based on AI analysis
 */
class FolderMatchingService
{
    /**
     * Intelligently match folder from AI analysis based on database folders
     */
    public function matchFolderFromAI(array $aiAnalysis): ?Folder
    {
        // Get all available folders from database
        $availableFolders = Folder::all();

        if ($availableFolders->isEmpty()) {
            Log::warning('No folders available in database for matching');
            return null;
        }

        Log::info('Starting intelligent folder matching', [
            'available_folders' => $availableFolders->pluck('folder_name')->toArray(),
            'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? null,
            'ai_category' => $aiAnalysis['category'] ?? null,
            'ai_document_type' => $aiAnalysis['document_type'] ?? null
        ]);

        $folder = null;

        // Strategy 1: Exact match on suggested_folder
        if (!empty($aiAnalysis['suggested_folder'])) {
            $suggestedFolder = strtolower(trim($aiAnalysis['suggested_folder']));

            // REJECT generic/redundant folder names
            $rejectedTerms = ['legal document', 'legal documents', 'document', 'documents', 'general', 'misc', 'miscellaneous', 'other'];
            foreach ($rejectedTerms as $term) {
                if (str_contains($suggestedFolder, $term)) {
                    Log::warning('Rejected generic AI folder suggestion', [
                        'suggested_folder' => $aiAnalysis['suggested_folder'],
                        'rejected_term' => $term
                    ]);
                    $suggestedFolder = null;
                    break;
                }
            }

            if (!$suggestedFolder) {
                return null; // Skip matching if folder name is too generic
            }

            foreach ($availableFolders as $dbFolder) {
                $dbFolderName = strtolower(trim($dbFolder->folder_name));

                // Exact match
                if ($dbFolderName === $suggestedFolder) {
                    Log::info('Folder matched: Exact match', ['folder' => $dbFolder->folder_name]);
                    return $dbFolder;
                }

                // Contains match (bidirectional)
                if (strpos($dbFolderName, $suggestedFolder) !== false || strpos($suggestedFolder, $dbFolderName) !== false) {
                    Log::info('Folder matched: Partial match', ['folder' => $dbFolder->folder_name]);
                    $folder = $dbFolder;
                    break;
                }
            }
        }

        // Strategy 2: Match by document_type using keyword mapping
        if (!$folder && !empty($aiAnalysis['document_type'])) {
            $docType = strtolower(trim($aiAnalysis['document_type']));

            // Define keyword to folder mappings based on your database folders
            $keywordMappings = $this->getKeywordMappings();

            foreach ($keywordMappings as $keyword => $targetFolderName) {
                if (strpos($docType, $keyword) !== false) {
                    // Find folder by name
                    $matchedFolder = $availableFolders->first(function($f) use ($targetFolderName) {
                        return strtolower(trim($f->folder_name)) === strtolower(trim($targetFolderName));
                    });

                    if ($matchedFolder) {
                        Log::info('Folder matched: Document type keyword', [
                            'keyword' => $keyword,
                            'folder' => $matchedFolder->folder_name
                        ]);
                        return $matchedFolder;
                    }
                }
            }
        }

        return $folder;
    }

    /**
     * Get keyword to folder mappings
     */
    private function getKeywordMappings(): array
    {
        return [
            // MOA folder keywords
            'memorandum' => 'MOA',
            'agreement' => 'MOA',
            'resolution' => 'MOA',
            'moa' => 'MOA',
            'memorandum of agreement' => 'MOA',

            // Criminal folder keywords
            'criminal' => 'CRIMINAL',
            'felony' => 'CRIMINAL',
            'misdemeanor' => 'CRIMINAL',
            'arrest' => 'CRIMINAL',
            'indictment' => 'CRIMINAL',

            // Civil Cases folder keywords
            'civil' => 'Civil Cases',
            'lawsuit' => 'Civil Cases',
            'complaint' => 'Civil Cases',
            'petition' => 'Civil Cases',
            'litigation' => 'Civil Cases',
        ];
    }

    /**
     * Get all available folders
     */
    public function getAvailableFolders(): array
    {
        return Folder::pluck('folder_name')->toArray();
    }

    /**
     * Validate folder exists
     */
    public function folderExists(int $folderId): bool
    {
        return Folder::where('folder_id', $folderId)->exists();
    }
}
