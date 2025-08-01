import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.practicesoftwaretesting.com';

test.describe('Brands DELETE API Tests', () => {
  let authToken: string;
  let createdBrandId: number;

  test.beforeEach(async ({ request }) => {
    // Get authentication token before each test
    const loginResponse = await request.post(`${BASE_URL}/users/login`, {
      data: {
        email: 'admin@practicesoftwaretesting.com',
        password: 'welcome01'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    const responseBody = await loginResponse.json();
    authToken = responseBody.access_token;

    // Create a test brand to delete
    const brandData = {
      name: `Test Brand ${Date.now()}`,
      slug: `test-brand-${Date.now()}`
    };

    const createResponse = await request.post(`${BASE_URL}/brands`, {
      data: brandData,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(createResponse.status()).toBe(201);
    const createdBrand = await createResponse.json();
    createdBrandId = createdBrand.id;
  });

  test.describe('DELETE /brands/{id}', () => {
    // Positive Test Cases
    test('should successfully delete an existing brand', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/brands/${createdBrandId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(204);

      // Verify brand no longer exists
      const getResponse = await request.get(`${BASE_URL}/brands/${createdBrandId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(getResponse.status()).toBe(404);
    });

    // Negative Test Cases
    test('should return 422 when deleting non-existent brand', async ({ request }) => {
      const nonExistentId = 99999;
      const response = await request.delete(`${BASE_URL}/brands/${nonExistentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(422);
    });

    test('should return 401 when deleting without authentication', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/brands/${createdBrandId}`);
      expect(response.status()).toBe(401);
    });

    test('should return 422 when using invalid brand ID format', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/brands/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(422);
    });
  });
});
