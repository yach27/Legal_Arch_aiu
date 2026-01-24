<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Document;

class FixDocumentRemarks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:fix-remarks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix document remarks that contain technical processing info';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to fix document remarks...');

        // Find all documents with technical processing info in remarks
        $documents = Document::where(function($query) {
            $query->where('remarks', 'like', '%Processed into%')
                  ->orWhere('remarks', 'like', '%chunks%');
        })->get();

        $this->info("Found {$documents->count()} documents with technical remarks");

        $fixed = 0;
        foreach ($documents as $document) {
            $updateData = [];

            // If we have a description, use a summary from it as remarks
            if (!empty($document->description)) {
                // Take first sentence or first 150 chars of description as remarks
                $descriptionSummary = $document->description;
                $firstSentence = preg_split('/(?<=[.!?])\s+/', $descriptionSummary, 2);
                $updateData['remarks'] = strlen($firstSentence[0]) > 150
                    ? substr($firstSentence[0], 0, 147) . '...'
                    : $firstSentence[0];
            } else {
                // Clear remarks if no description available
                $updateData['remarks'] = null;
            }

            if (!empty($updateData)) {
                $document->update($updateData);
                $fixed++;
                $this->line("Fixed document ID {$document->doc_id}: {$document->title}");
            }
        }

        $this->info("Successfully fixed {$fixed} documents!");

        return Command::SUCCESS;
    }
}
