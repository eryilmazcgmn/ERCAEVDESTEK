<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    /**
     * Public: Get all active services (for homepage).
     */
    public function index(): JsonResponse
    {
        try {
            $services = Service::active()->ordered()->get([
                'id', 'slug', 'name', 'description', 'icon', 'color', 'sort_order', 'min_price'
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Hizmetler getirildi.',
                'data' => $services,
                'errors' => null
            ], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ServiceController index error', ['exception' => $e]);
            return response()->json([
                'status' => true,
                'message' => 'Hizmetler yüklenirken hata, varsayılan liste kullanılıyor.',
                'data' => [],
                'errors' => null
            ], 200);
        }
    }
}
