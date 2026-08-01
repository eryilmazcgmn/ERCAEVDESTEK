<?php

namespace Tests\Feature;

use Tests\TestCase;

class StorageTraversalTest extends TestCase
{
    public function test_storage_path_traversal_is_blocked()
    {
        $resp = $this->getJson('/api/storage/../../.env');
        $resp->assertStatus(404);
    }
}
