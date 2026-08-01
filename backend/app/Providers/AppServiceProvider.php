<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // AIRouter singleton has been removed for V2
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Ensure DomPDF font cache directory exists (Bulgu 4.2 fix)
        $fontDir = storage_path('fonts');
        if (!is_dir($fontDir)) {
            @mkdir($fontDir, 0755, true);
        }
    }
}
