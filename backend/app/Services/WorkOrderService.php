<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\WorkOrder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\ServicePrice;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Exception;

class WorkOrderService
{
    /**
     * Get all work orders for CRM admin.
     */
    public function getWorkOrdersForAdmin(): array
    {
        return WorkOrder::with(['customer', 'quotation', 'technician'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Update Work Order status (Admin) — with State Machine validation.
     */
    public function updateWorkOrderStatus(int $id, string $status): WorkOrder
    {
        return DB::transaction(function () use ($id, $status) {
            $workOrder = WorkOrder::findOrFail($id);

            // Validate status transition via State Machine
            WorkOrderStateMachine::validateTransition($workOrder->status, $status);

            $workOrder->update(['status' => $status]);

            if ($workOrder->quotation_id) {
                $quotation = Quotation::find($workOrder->quotation_id);
                if ($quotation) {
                    if ($status === 'completed') {
                        $quotation->update(['status' => 'completed']);
                    } elseif ($status === 'cancelled') {
                        $quotation->update(['status' => 'cancelled']);
                    }
                }
            }

            Log::info('Work order status updated', [
                'work_order_id' => $id,
                'old_status' => $workOrder->getOriginal('status'),
                'new_status' => $status,
            ]);

            return $workOrder;
        });
    }

    /**
     * Get all technicians.
     */
    public function getTechnicians(): array
    {
        return User::where('role', 'technician')
            ->select('id', 'name', 'username', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Create a new technician account.
     */
    public function createTechnician(array $data): User
    {
        return DB::transaction(function () use ($data) {
            if (User::where('username', $data['username'])->exists()) {
                throw new Exception('Bu kullanıcı adı zaten kullanılmaktadır.');
            }

            return User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'password' => Hash::make($data['password']),
                'role' => 'technician',
            ]);
        });
    }

    /**
     * Delete a technician account.
     */
    public function deleteTechnician(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $technician = User::where('role', 'technician')->findOrFail($id);
            WorkOrder::where('technician_id', $technician->id)->update([
                'technician_id' => null,
                'technician_name' => null
            ]);
            return (bool) $technician->delete();
        });
    }

    /**
     * Assign a technician to a work order.
     */
    public function assignTechnician(int $id, int $technicianId, ?string $scheduledAt): WorkOrder
    {
        return DB::transaction(function () use ($id, $technicianId, $scheduledAt) {
            $workOrder = WorkOrder::findOrFail($id);
            $technician = User::where('role', 'technician')->findOrFail($technicianId);

            $workOrder->update([
                'technician_id' => $technician->id,
                'technician_name' => $technician->name,
                'scheduled_at' => $scheduledAt ?: ($workOrder->scheduled_at ?? now()->addHours(2)->toDateTimeString()),
                'status' => 'scheduled',
            ]);

            Log::info('Technician assigned to work order', [
                'work_order_id' => $id,
                'technician_id' => $technicianId,
                'technician_name' => $technician->name,
            ]);

            return $workOrder;
        });
    }

    /**
     * Fetch work orders assigned to a technician.
     */
    public function getTechnicianWorkOrders(int $userId): array
    {
        return WorkOrder::with(['customer', 'quotation'])
            ->where('technician_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Update status of work order from Technician dashboard — with State Machine.
     */
    public function updateTechnicianWorkOrderStatus(int $id, int $userId, string $status, ?string $notes = null, ?string $photo = null): WorkOrder
    {
        return DB::transaction(function () use ($id, $userId, $status, $notes, $photo) {
            $workOrder = WorkOrder::where('id', $id)
                ->where('technician_id', $userId)
                ->firstOrFail();

            // Validate status transition via State Machine
            WorkOrderStateMachine::validateTransition($workOrder->status, $status);

            $updateData = ['status' => $status];
            if ($notes !== null) {
                $updateData['completion_notes'] = $notes;
            }
            if ($photo !== null) {
                $updateData['completion_photo'] = $photo;
            }

            $workOrder->update($updateData);

            if ($workOrder->quotation_id && $status === 'completed') {
                Quotation::where('id', $workOrder->quotation_id)->update(['status' => 'completed']);
            }

            Log::info('Technician updated work order status', [
                'work_order_id' => $id,
                'technician_id' => $userId,
                'new_status' => $status,
            ]);

            return $workOrder;
        });
    }

    /**
     * Get dashboard summary stats for Admin CRM.
     * Uses DB-level aggregation for revenue calculation (not PHP loop).
     */
    public function getDashboardStats(): array
    {
        $totalCustomers = Customer::count();
        $totalQuotations = Quotation::count();
        $totalWorkOrders = WorkOrder::count();
        $completedWorkOrders = WorkOrder::where('status', 'completed')->count();
        $activeWorkOrders = WorkOrder::whereIn('status', ['pending', 'deposit_pending', 'deposit_declared', 'scheduled', 'in_progress'])->count();

        // DB-level revenue calculation using JSON extraction
        $revenue = Quotation::whereIn('status', ['approved', 'completed'])->get()->sum(function ($q) {
            return $q->price_details['total'] ?? 0;
        });

        // Daily revenue for last 30 days (for charts)
        $dailyRevenue = [];
        $quotations = Quotation::whereIn('status', ['approved', 'completed'])
            ->where('created_at', '>=', now()->subDays(30))
            ->select('created_at', 'price_details')
            ->get();

        foreach ($quotations as $q) {
            $date = $q->created_at->format('Y-m-d');
            $amount = $q->price_details['total'] ?? 0;
            $dailyRevenue[$date] = ($dailyRevenue[$date] ?? 0) + $amount;
        }

        // Service type distribution
        $serviceDistribution = Quotation::select('service_type', DB::raw('count(*) as count'))
            ->groupBy('service_type')
            ->pluck('count', 'service_type')
            ->toArray();

        // Work order status distribution
        $statusDistribution = WorkOrder::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'total_customers' => $totalCustomers,
            'total_quotations' => $totalQuotations,
            'total_work_orders' => $totalWorkOrders,
            'completed_work_orders' => $completedWorkOrders,
            'active_work_orders' => $activeWorkOrders,
            'total_revenue' => $revenue,
            'daily_revenue' => $dailyRevenue,
            'service_distribution' => $serviceDistribution,
            'status_distribution' => $statusDistribution,
        ];
    }

    /**
     * Service prices management — cached for 10 minutes.
     */
    public function getServicePrices(): array
    {
        return Cache::remember('service_prices', 600, function () {
            return ServicePrice::orderBy('service_type')->orderBy('question_id')->get()->toArray();
        });
    }

    public function bulkUpdateServicePrices(array $prices): bool
    {
        return DB::transaction(function () use ($prices) {
            foreach ($prices as $item) {
                if (isset($item['id'])) {
                    ServicePrice::where('id', $item['id'])->update([
                        'price' => $item['price'],
                        'label' => $item['label'] ?? null
                    ]);
                }
            }

            // Invalidate cache after update
            Cache::forget('service_prices');

            return true;
        });
    }

    public function createServicePrice(array $data): ServicePrice
    {
        $qType = $data['question_type'] ?? 'radio';

        // If question_type is specified, update all existing items under this question_id as well
        if (!empty($data['question_id']) && !empty($data['service_type'])) {
            ServicePrice::where('service_type', $data['service_type'])
                ->where('question_id', $data['question_id'])
                ->update(['question_type' => $qType]);
        }

        $sp = ServicePrice::create([
            'service_type' => $data['service_type'],
            'question_id' => $data['question_id'],
            'question_type' => $qType,
            'option_value' => $data['option_value'],
            'label' => $data['label'],
            'price' => (int) ($data['price'] ?? 0),
        ]);

        Cache::forget('service_prices');
        return $sp;
    }

    public function deleteServicePrice(int $id): bool
    {
        ServicePrice::where('id', $id)->delete();
        Cache::forget('service_prices');
        return true;
    }
}
