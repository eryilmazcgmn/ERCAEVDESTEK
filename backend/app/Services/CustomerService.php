<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;
use App\Models\Conversation;
use App\Models\UploadedFile;
use App\Services\Auth\JwtService;
use Illuminate\Http\UploadedFile as HttpUploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class CustomerService
{
    protected JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * Start a new customer support session.
     */
    public function startSession(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $sessionId = 'SES_' . uniqid() . '_' . rand(100, 999);
            $phone = $data['phone'] ?? null;
            $name = !empty($data['name']) ? $data['name'] : 'Misafir Müşteri';
            $utmSource = $data['utm_source'] ?? null;
            $utmMedium = $data['utm_medium'] ?? null;
            $utmCampaign = $data['utm_campaign'] ?? null;

            $customer = null;
            if ($phone && $phone !== 'anonymous') {
                $customer = Customer::where('phone', $phone)->first();
            }

            if (!$customer) {
                $customer = Customer::create([
                    'name' => $name,
                    'phone' => $phone ?? ('0500' . rand(10007, 99999)),
                    'status' => 'lead',
                    'utm_source' => $utmSource,
                    'utm_medium' => $utmMedium,
                    'utm_campaign' => $utmCampaign,
                ]);
            } else {
                $customer->update([
                    'utm_source' => $utmSource ?? $customer->utm_source,
                    'utm_medium' => $utmMedium ?? $customer->utm_medium,
                    'utm_campaign' => $utmCampaign ?? $customer->utm_campaign,
                ]);
            }

            $conversation = Conversation::create([
                'customer_id' => $customer->id,
                'session_id' => $sessionId,
                'status' => 'active',
                'utm_source' => $utmSource,
                'utm_medium' => $utmMedium,
                'utm_campaign' => $utmCampaign,
            ]);

            $token = $this->jwtService->encode([
                'session_id' => $sessionId,
                'phone' => $customer->phone,
                'role' => 'customer'
            ]);

            return [
                'session_id' => $sessionId,
                'token' => $token,
                'customer' => $customer,
                'conversation' => $conversation
            ];
        });
    }

    /**
     * Update customer contact info for session.
     */
    public function updateContactInfo(string $sessionId, array $data): Customer
    {
        return DB::transaction(function () use ($sessionId, $data) {
            $conversation = Conversation::where('session_id', $sessionId)->firstOrFail();

            $phone = $data['phone'];
            $name = $data['name'];
            $email = $data['email'] ?? null;
            $address = $data['address'];
            $utmSource = $data['utm_source'] ?? null;
            $utmMedium = $data['utm_medium'] ?? null;
            $utmCampaign = $data['utm_campaign'] ?? null;

            if ($conversation->customer_id) {
                $customer = Customer::findOrFail($conversation->customer_id);
                $customer->update([
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'address' => $address,
                    'utm_source' => $utmSource ?? $conversation->utm_source,
                    'utm_medium' => $utmMedium ?? $conversation->utm_medium,
                    'utm_campaign' => $utmCampaign ?? $conversation->utm_campaign,
                ]);
            } else {
                $customer = Customer::create([
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'address' => $address,
                    'status' => 'lead',
                    'utm_source' => $utmSource ?? $conversation->utm_source,
                    'utm_medium' => $utmMedium ?? $conversation->utm_medium,
                    'utm_campaign' => $utmCampaign ?? $conversation->utm_campaign,
                ]);
                $conversation->update(['customer_id' => $customer->id]);
            }

            return $customer;
        });
    }

    /**
     * Handle secure file upload for a conversation session.
     */
    public function uploadSessionFile(string $sessionId, HttpUploadedFile $file): UploadedFile
    {
        return DB::transaction(function () use ($sessionId, $file) {
            $conversation = Conversation::where('session_id', $sessionId)->firstOrFail();

            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize();

            $mimeToExt = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'application/pdf' => 'pdf',
            ];
            $safeExtension = $mimeToExt[$mimeType] ?? 'jpg';

            $fileName = time() . '_' . bin2hex(random_bytes(8)) . '.' . $safeExtension;

            $uploadDir = storage_path('app/public/uploads');
            $htaccessPath = $uploadDir . '/.htaccess';
            if (!file_exists($htaccessPath)) {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                file_put_contents($htaccessPath, "php_flag engine off\nRemoveHandler .php .phtml .php3 .php5\nAddType text/plain .php .phtml .php3 .php5\n");
            }

            $file->storeAs('uploads', $fileName, 'public');
            $storedPath = 'storage/uploads/' . $fileName;

            $fileType = $mimeType === 'application/pdf' ? 'document' : 'image';

            return UploadedFile::create([
                'customer_id' => $conversation->customer_id,
                'conversation_id' => $conversation->id,
                'file_path' => $storedPath,
                'file_type' => $fileType,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
            ]);
        });
    }

    /**
     * Get all customers list for CRM.
     */
    public function getCustomersForAdmin(): array
    {
        return Customer::orderBy('created_at', 'desc')->get()->toArray();
    }
}
