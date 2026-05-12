<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'notification_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'array',
        ];
    }

    public function mutedNotificationTypes(?string $channel = null): array
    {
        $preferences = is_array($this->notification_preferences) ? $this->notification_preferences : [];
        $legacyMutedTypes = $preferences['muted_types'] ?? [];
        $channelMutedTypes = match ($channel) {
            'bell' => $preferences['channels']['bell']['muted_types'] ?? $legacyMutedTypes,
            'history' => $preferences['channels']['history']['muted_types'] ?? $legacyMutedTypes,
            default => array_merge(
                is_array($preferences['channels']['bell']['muted_types'] ?? null) ? $preferences['channels']['bell']['muted_types'] : [],
                is_array($preferences['channels']['history']['muted_types'] ?? null) ? $preferences['channels']['history']['muted_types'] : [],
                is_array($legacyMutedTypes) ? $legacyMutedTypes : [],
            ),
        };

        if (! is_array($channelMutedTypes)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(
            static fn ($type) => is_string($type) ? trim($type) : null,
            $channelMutedTypes,
        ))));
    }
}
