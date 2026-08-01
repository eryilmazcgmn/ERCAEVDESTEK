<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Validates critical application configuration before deployment.
 *
 * Usage: php artisan config:validate
 * Returns exit code 0 on success, 1 on failure.
 */
class ValidateConfig extends Command
{
    protected $signature = 'config:validate';
    protected $description = 'Validate critical configuration values (JWT_SECRET, APP_KEY, DB connection) before deployment.';

    public function handle(): int
    {
        $hasErrors = false;

        $this->info('Validating application configuration...');
        $this->newLine();

        // 1. APP_KEY
        $appKey = config('app.key');
        if (empty($appKey)) {
            $this->error('✗ APP_KEY is not set. Run: php artisan key:generate');
            $hasErrors = true;
        } else {
            $this->line('<fg=green>✓</> APP_KEY is configured.');
        }

        // 2. JWT_SECRET
        $jwtSecret = config('services.jwt.secret', '');
        if (empty($jwtSecret)) {
            $this->error('✗ JWT_SECRET is not set in .env');
            $hasErrors = true;
        } elseif (strlen($jwtSecret) < 32) {
            $this->error('✗ JWT_SECRET is too short (' . strlen($jwtSecret) . ' chars). Minimum 32 characters required.');
            $hasErrors = true;
        } else {
            $this->line('<fg=green>✓</> JWT_SECRET is configured (' . strlen($jwtSecret) . ' chars).');
        }

        // 3. Database connection
        try {
            DB::connection()->getPdo();
            $this->line('<fg=green>✓</> Database connection successful (' . config('database.default') . ').');
        } catch (\Exception $e) {
            $this->error('✗ Database connection failed: ' . $e->getMessage());
            $hasErrors = true;
        }

        // 4. APP_URL
        $appUrl = config('app.url');
        if (empty($appUrl) || $appUrl === 'http://localhost') {
            $this->warn('⚠ APP_URL is set to default (http://localhost). Update for production.');
        } else {
            $this->line('<fg=green>✓</> APP_URL is configured: ' . $appUrl);
        }

        // 5. APP_DEBUG (should be false in production)
        if (config('app.debug') === true) {
            $this->warn('⚠ APP_DEBUG is true. Disable in production (.env APP_DEBUG=false).');
        } else {
            $this->line('<fg=green>✓</> APP_DEBUG is disabled.');
        }

        // 6. Storage symlink
        $symlinkPath = public_path('storage');
        if (!file_exists($symlinkPath) || !is_link($symlinkPath)) {
            $this->warn('⚠ Storage symlink not found. Run: php artisan storage:link');
        } else {
            $this->line('<fg=green>✓</> Storage symlink exists.');
        }

        // 7. ext-fileinfo
        if (!function_exists('finfo_open')) {
            $this->warn('⚠ ext-fileinfo is not loaded. File upload MIME validation will use fallback.');
        } else {
            $this->line('<fg=green>✓</> ext-fileinfo is available.');
        }

        $this->newLine();

        if ($hasErrors) {
            $this->error('Configuration validation FAILED. Fix the errors above before deploying.');
            return Command::FAILURE;
        }

        $this->info('All critical configuration checks passed.');
        return Command::SUCCESS;
    }
}
