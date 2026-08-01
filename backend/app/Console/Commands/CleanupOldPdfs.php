<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\Quotation;

class CleanupOldPdfs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'pdf:cleanup {--days=90 : Days threshold to consider PDFs old}';

    /**
     * The console command description.
     */
    protected $description = 'Clean up PDF quotation files older than specified days for cancelled or obsolete records.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $thresholdDate = now()->subDays($days);

        $this->info("Scanning for PDFs older than {$days} days (created before {$thresholdDate->toDateTimeString()})...");

        // Find cancelled or stale pending quotations older than threshold
        $oldQuotations = Quotation::whereIn('status', ['cancelled', 'rejected'])
            ->where('created_at', '<', $thresholdDate)
            ->whereNotNull('pdf_path')
            ->get();

        $count = 0;
        foreach ($oldQuotations as $quotation) {
            $fullPath = storage_path('app/public/' . str_replace('storage/', '', $quotation->pdf_path));

            if (File::exists($fullPath)) {
                File::delete($fullPath);
                $count++;
            }

            $quotation->update(['pdf_path' => null]);
        }

        $this->info("Successfully cleaned up {$count} old PDF files.");

        return Command::SUCCESS;
    }
}
