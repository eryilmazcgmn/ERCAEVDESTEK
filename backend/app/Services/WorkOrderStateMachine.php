<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;

/**
 * Work Order State Machine — enforces valid status transitions.
 * Prevents illogical state changes (e.g., completed → pending).
 */
class WorkOrderStateMachine
{
    /**
     * Valid status transitions map.
     * Key: current status, Value: array of allowed next statuses.
     */
    private const TRANSITIONS = [
        'pending' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'deposit_pending' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'deposit_declared' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'deposit_paid' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'scheduled' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'in_progress' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'completed' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
        'cancelled' => ['pending', 'deposit_pending', 'deposit_declared', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    ];

    /**
     * Human-readable status labels (Turkish).
     */
    private const STATUS_LABELS = [
        'pending' => 'Beklemede',
        'deposit_pending' => 'Kapora Bekleniyor',
        'deposit_declared' => 'Havale Bildirildi',
        'deposit_paid' => 'Kapora Onaylandı',
        'scheduled' => 'Randevu Planlandı',
        'in_progress' => 'İş Devam Ediyor',
        'completed' => 'Tamamlandı',
        'cancelled' => 'İptal Edildi',
    ];

    /**
     * Check if a transition from currentStatus to newStatus is valid.
     */
    public static function canTransition(string $currentStatus, string $newStatus): bool
    {
        $allowed = self::TRANSITIONS[$currentStatus] ?? [];
        return in_array($newStatus, $allowed, true);
    }

    /**
     * Validate and return new status, or throw on invalid transition.
     */
    public static function validateTransition(string $currentStatus, string $newStatus): string
    {
        if (!isset(self::TRANSITIONS[$currentStatus])) {
            throw new InvalidArgumentException(
                "Geçersiz mevcut durum: '{$currentStatus}'."
            );
        }

        if (!isset(self::TRANSITIONS[$newStatus]) && !in_array($newStatus, array_merge(...array_values(self::TRANSITIONS)), true)) {
            throw new InvalidArgumentException(
                "Geçersiz hedef durum: '{$newStatus}'."
            );
        }

        if (!self::canTransition($currentStatus, $newStatus)) {
            $currentLabel = self::STATUS_LABELS[$currentStatus] ?? $currentStatus;
            $newLabel = self::STATUS_LABELS[$newStatus] ?? $newStatus;
            $allowedLabels = array_map(
                fn($s) => self::STATUS_LABELS[$s] ?? $s,
                self::TRANSITIONS[$currentStatus]
            );
            $allowedStr = empty($allowedLabels) ? 'hiçbir durum (son durum)' : implode(', ', $allowedLabels);

            throw new InvalidArgumentException(
                "Geçersiz durum geçişi: '{$currentLabel}' → '{$newLabel}'. " .
                "İzin verilen geçişler: {$allowedStr}."
            );
        }

        return $newStatus;
    }

    /**
     * Get allowed next statuses for a given current status.
     */
    public static function getAllowedTransitions(string $currentStatus): array
    {
        return self::TRANSITIONS[$currentStatus] ?? [];
    }

    /**
     * Get human-readable label for a status.
     */
    public static function getLabel(string $status): string
    {
        return self::STATUS_LABELS[$status] ?? $status;
    }

    /**
     * Check if a status is a final (terminal) state.
     */
    public static function isFinalState(string $status): bool
    {
        return empty(self::TRANSITIONS[$status] ?? ['placeholder']);
    }

    /**
     * Get all valid statuses.
     */
    public static function getAllStatuses(): array
    {
        return array_keys(self::TRANSITIONS);
    }
}
