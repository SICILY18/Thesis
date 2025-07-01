<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Always encrypt the password when it's being set.
     *
     * @param string $value
     * @return void
     */
    public function setPasswordAttribute($value)
    {
        // Only hash if the password isn't already hashed
        if (strlen($value) < 60) {
            $this->attributes['password'] = Hash::make($value);
        } else {
            $this->attributes['password'] = $value;
        }
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function staff()
    {
        return $this->hasOne(Staff::class);
    }

    public function isStaff()
    {
        $username = explode('@', $this->email)[0];
        return DB::table('staff_tb')
            ->where('username', $username)
            ->exists();
    }

    public function isCustomer()
    {
        return $this->customer !== null;
    }

    public function getRole()
    {
        if ($this->isStaff()) {
            $staff = DB::table('staff_tb')
                ->where('username', explode('@', $this->email)[0])
                ->first();
            return $staff ? $staff->role : null;
        }
        if ($this->isCustomer()) {
            return 'customer';
        }
        return null;
    }
}
