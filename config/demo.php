<?php

return [
    'users' => [
        'admin' => [
            'name' => env('DEMO_ADMIN_NAME', 'Administrador'),
            'email' => env('DEMO_ADMIN_EMAIL', 'admin@example.com'),
            'password' => env('DEMO_ADMIN_PASSWORD', 'admin12345'),
            'type' => 'admin',
            'role' => 'admin',
        ],
        'client' => [
            'name' => env('DEMO_CLIENT_NAME', 'Cliente Demo'),
            'email' => env('DEMO_CLIENT_EMAIL', 'cliente@example.com'),
            'password' => env('DEMO_CLIENT_PASSWORD', 'cliente12345'),
            'type' => 'cliente',
            'role' => 'cliente',
            'phone' => env('DEMO_CLIENT_PHONE', '+58 412-1111111'),
            'address' => env('DEMO_CLIENT_ADDRESS', 'Caracas'),
        ],
    ],
];