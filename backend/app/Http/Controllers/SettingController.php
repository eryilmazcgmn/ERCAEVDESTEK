<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class SettingController extends Controller
{
    protected SettingService $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    public function index(): JsonResponse
    {
        try {
            $settings = $this->settingService->getAllSettings();
            return response()->json([
                'status' => true,
                'message' => 'Ayarlar getirildi.',
                'data' => $settings,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Ayarlar yüklenemedi.',
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 500);
        }
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            // jwt_user is stored in request attributes (not input), but unset defensively
            unset($data['jwt_user'], $data['logo']);

            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('public/logos');
                $url = str_replace('public/', 'storage/', $path);
                $data['logo_path'] = $url;
            }

            $cleanData = [];
            foreach ($data as $key => $value) {
                if (is_scalar($value) || is_null($value)) {
                    $cleanData[$key] = (string) ($value ?? '');
                }
            }

            $updated = $this->settingService->updateSettings($cleanData);

            return response()->json([
                'status' => true,
                'message' => 'Ayarlar başarıyla güncellendi.',
                'data' => $updated,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Ayarlar güncellenirken hata oluştu.',
                'data' => null,
                'errors' => ['settings' => [$e->getMessage()]]
            ], 500);
        }
    }

    public function getBankInfo(): JsonResponse
    {
        try {
            $info = $this->settingService->getBankInfo();

            return response()->json([
                'status' => true,
                'message' => 'Banka bilgileri getirildi.',
                'data' => [
                    'bank' => [
                        'bankName' => $info['bank_name'] ?? 'Ziraat Bankası',
                        'accountName' => $info['bank_recipient'] ?? 'ERCA Ev Destek Ltd. Şti.',
                        'iban' => $info['bank_iban'] ?? 'TR00 0000 0000 0000 0000 0000 00',
                    ],
                    'deposit_amount' => $info['deposit_amount'] ?? '500',
                    'whatsapp_number' => $info['whatsapp_number'] ?? '905551234567',
                ],
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Banka bilgileri alınırken hata oluştu.',
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 500);
        }
    }
}
