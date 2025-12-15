<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    // Specify the primary key column name
    protected $primaryKey = 'category_id';
    
    // If your primary key is not auto-incrementing, add this:
    // public $incrementing = false;
    
    // If your primary key is not an integer, specify the type:
    // protected $keyType = 'string';

    protected $fillable = [
        'category_name',
        'description',
    ];

    // Relationships
    public function folders()
    {
        return $this->hasMany(Folder::class, 'category_id', 'category_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'category_id', 'category_id');
    }
}