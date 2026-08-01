<?php

namespace App\Http\Controllers;

use App\Models\CustomerFeedback;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'work_order_id' => 'required|exists:work_orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $feedback = CustomerFeedback::create([
            'work_order_id' => $request->input('work_order_id'),
            'rating' => $request->input('rating'),
            'comment' => $request->input('comment'),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Geri bildiriminiz için teşekkür ederiz!',
            'data' => $feedback
        ], 201);
    }
}
