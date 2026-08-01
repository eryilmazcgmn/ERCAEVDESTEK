<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | NVIDIA Build API (AI Provider)
    |--------------------------------------------------------------------------
    */
    'nvidia' => [
        'api_key' => env('NVIDIA_API_KEY'),
        'api_url' => env('NVIDIA_API_URL', 'https://integrate.api.nvidia.com/v1/chat/completions'),
        'text_model' => env('NVIDIA_TEXT_MODEL', 'meta/llama-3.3-70b-instruct'),
        'vision_model' => env('NVIDIA_VISION_MODEL', 'meta/llama-3.2-11b-vision-instruct'),
        'default_provider' => env('AI_DEFAULT_PROVIDER', 'nvidia'),
    ],

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication
    |--------------------------------------------------------------------------
    */
    'jwt' => [
        'secret' => env('JWT_SECRET'),
        'ttl' => (int) env('JWT_TTL', 86400),
        'algorithm' => env('JWT_ALGORITHM', 'HS256'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend / CORS
    |--------------------------------------------------------------------------
    */
    'frontend' => [
        'url' => env('FRONTEND_URL', 'http://localhost:5173'),
    ],

];
