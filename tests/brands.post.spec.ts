import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.practicesoftwaretesting.com';

test.describe('Brands POST API Tests', () => {
  let authToken: string;

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
  });

  test.describe('POST /brands', () => {
    // Positive Test Cases
    test('should create a new brand with valid data', async ({ request }) => {
      const brandData = {
        name: `Test Brand ${Date.now()}`,
        slug: `test-brand-${Date.now()}`
      };

      const response = await request.post(`${BASE_URL}/brands`, {
        data: brandData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(201);
      const createdBrand = await response.json();
      expect(createdBrand).toHaveProperty('id');
      expect(createdBrand.name).toBe(brandData.name);
      expect(createdBrand.slug).toBe(brandData.slug);
    });

    test('should create brand with minimum required fields', async ({ request }) => {
      const timestamp = Date.now();
      const brandData = {
        name: `Minimal Brand ${timestamp}`,
        slug: `minimal-brand-${timestamp}`
      };

      const response = await request.post(`${BASE_URL}/brands`, {
        data: brandData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(201);
      const createdBrand = await response.json();
      expect(createdBrand).toHaveProperty('id');
      expect(createdBrand.name).toBe(brandData.name);
      expect(createdBrand.slug).toBe(brandData.slug);
    });

    // Negative Test Cases
    test('should reject duplicate slug', async ({ request }) => {
      const timestamp = Date.now();
      const brandData = {
        name: `Duplicate Brand ${timestamp}`,
        slug: `duplicate-brand-${timestamp}`
      };
      
      // Create first brand
      await request.post(`${BASE_URL}/brands`, {
        data: brandData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Try to create second brand with same slug but different name
      const response = await request.post(`${BASE_URL}/brands`, {
        data: {
          name: `Another Brand ${timestamp}`,
          slug: brandData.slug  // Using same slug
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(422);
      const error = await response.json();
      expect(error).toHaveProperty('slug');
      expect(error.slug[0]).toBe('A brand already exists with this slug.');
    });