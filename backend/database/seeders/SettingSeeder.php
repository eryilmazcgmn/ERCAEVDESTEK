<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'company_name', 'value' => 'ERCA EV DESTEK'],
            ['key' => 'contact_email', 'value' => 'info@ercaevdestek.com'],
            ['key' => 'contact_phone', 'value' => '0555 555 5555'],
            ['key' => 'company_address', 'value' => 'Ankara - Çankaya'],
            ['key' => 'primary_color', 'value' => '#9333ea'], // purple-600
            ['key' => 'secondary_color', 'value' => '#3b82f6'], // blue-500
            ['key' => 'border_radius', 'value' => '0.75rem'], // rounded-xl
            ['key' => 'custom_css', 'value' => ''],
            ['key' => 'logo_path', 'value' => null],
        ];

        foreach ($settings as $setting) {
            \App\Models\Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
