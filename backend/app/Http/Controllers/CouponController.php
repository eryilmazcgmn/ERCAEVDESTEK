<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;
use Log;

class CouponController extends Controller
{
    /**
     * Public Endpoint: Validate coupon code and calculate discount.
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string',
                'total_amount' => 'required|numeric|min:0',
            ]);

            $coupon = Coupon::where('code', strtoupper(trim($validated['code'])))
                ->where('is_active', true)
                ->first();

            if (!$coupon) {
                return response()->json([
                    'status' => false,
                    'message' => 'Geçersiz veya süresi dolmuş indirim kodu.',
                    'data' => null
                ], 404);
            }

            if ($coupon->expires_at && $coupon->expires_at->isPast()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu indirim kodunun süresi dolmuştur.',
                    'data' => null
                ], 400);
            }

            if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu kupon kullanım limitine ulaşmıştır.',
                    'data' => null
                ], 400);
            }

            $totalAmount = (float) $validated['total_amount'];
            if ($totalAmount < $coupon->min_order_amount) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu kupon minimum ₺' . $coupon->min_order_amount . ' tutarındaki siparişlerde geçerlidir.',
                    'data' => null
                ], 400);
            }

            $discount = 0;
            if ($coupon->type === 'percent') {
                $discount = round(($totalAmount * $coupon->value) / 100, 2);
            } else {
                $discount = round((float) $coupon->value, 2);
            }

            if ($discount > $totalAmount) {
                $discount = $totalAmount;
            }

            $newTotal = max(0, $totalAmount - $discount);
            $newDeposit = round($newTotal * 0.20, 2);

            return response()->json([
                'status' => true,
                'message' => 'İndirim kodu başarıyla uygulandı!',
                'data' => [
                    'code' => $coupon->code,
                    'type' => $coupon->type,
                    'value' => $coupon->value,
                    'discount_amount' => $discount,
                    'new_total' => $newTotal,
                    'new_deposit' => $newDeposit
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Validate Coupon Error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Kupon doğrulanırken hata oluştu.',
                'data' => null
            ], 500);
        }
    }

    /**
     * Admin Endpoint: List coupons.
     */
    public function index(): JsonResponse
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => true,
            'data' => $coupons
        ]);
    }

    /**
     * Admin Endpoint: Create a new coupon.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|max:50|unique:coupons,code',
                'type' => 'required|in:percent,fixed',
                'value' => 'required|numeric|min:0.01',
                'min_order_amount' => 'nullable|numeric|min:0',
                'max_uses' => 'nullable|integer|min:1',
                'expires_at' => 'nullable|date',
            ]);

            $validated['code'] = strtoupper(trim($validated['code']));
            $coupon = Coupon::create($validated);

            return response()->json([
                'status' => true,
                'message' => 'İndirim kuponu oluşturuldu.',
                'data' => $coupon
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Kupon oluşturulurken hata: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Admin Endpoint: Delete a coupon.
     */
    public function destroy(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return response()->json([
            'status' => true,
            'message' => 'Kupon silindi.'
        ]);
    }
}
