<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Exception;

class SettingService
{
    private const CACHE_KEY = 'app_settings';
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Get all public/system settings — cached for 5 minutes.
     */
    public function getAllSettings(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $settings = Setting::all()->pluck('value', 'key')->toArray();
            $defaults = [
                'company_name' => 'ERCA EV DESTEK',
                'company_phone' => '0850 123 45 67',
                'company_email' => 'info@ercaevdestek.com',
                'deposit_amount' => '500',
                'bank_iban' => 'TR00 0000 0000 0000 0000 0000 00',
                'bank_name' => 'Ziraat Bankası',
                'bank_recipient' => 'ERCA Ev Destek Ltd. Şti.',
                'whatsapp_number' => '905551234567',
            ];

            return array_merge($defaults, $settings);
        });
    }

    /**
     * Get bank info.
     */
    public function getBankInfo(): array
    {
        $settings = $this->getAllSettings();
        return [
            'bank_iban' => $settings['bank_iban'],
            'bank_name' => $settings['bank_name'],
            'bank_recipient' => $settings['bank_recipient'],
            'deposit_amount' => $settings['deposit_amount'],
        ];
    }

    /**
     * Update settings in bulk — invalidates cache.
     */
    public function updateSettings(array $settings): array
    {
        return DB::transaction(function () use ($settings) {
            foreach ($settings as $key => $value) {
                Setting::set((string) $key, (string) $value);
            }

            // Invalidate cache after update
            Cache::forget(self::CACHE_KEY);

            return $this->getAllSettings();
        });
    }

    /**
     * Utility: Create storage symlink or fallback.
     */
    public function linkStorage(): array
    {
        try {
            Artisan::call('storage:link');
            return [
                'success' => true,
                'message' => 'Storage symlink successfully created.'
            ];
        } catch (Exception $e) {
            $link = public_path('storage');
            if (!file_exists($link)) {
                @mkdir($link, 0755, true);
            }
            $htaccess = "RewriteEngine On\nRewriteRule ^(.*)$ " . storage_path('app/public') . "/$1 [L]";
            @file_put_contents($link . '/.htaccess', $htaccess);

            return [
                'success' => true,
                'message' => 'Symlink failed, .htaccess fallback applied.',
                'fallback' => true,
                'error_detail' => $e->getMessage()
            ];
        }
    }

    /**
     * Utility: Run database migrations.
     */
    public function runMigrations(): array
    {
        Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();
        return [
            'success' => true,
            'message' => 'Database migrations successfully executed.',
            'output' => $output
        ];
    }

    /**
     * Utility: Clear system cache.
     */
    public function clearCache(): array
    {
        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        // Also clear our application caches
        Cache::forget(self::CACHE_KEY);
        Cache::forget('service_prices');

        return [
            'success' => true,
            'message' => 'Sistem önbellekleri başarıyla temizlendi.'
        ];
    }
}
