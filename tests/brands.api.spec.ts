import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.practicesoftwaretesting.com';

test.describe('Brands API Tests', () => {
  // Test cases for GET /brands endpoint
  test.describe('GET /brands', () => {
    test('should return all brands successfully', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands`);
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });

    test('should verify pagination parameters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands?page=1&limit=5`);
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeLessThanOrEqual(5);
    });

    test('should handle invalid pagination parameters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands?page=-1&limit=0`);
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      // API returns all brands when invalid pagination parameters are provided
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });

  // Test cases for GET /brands/{brandId} endpoint
  test.describe('GET /brands/{brandId}', () => {
    test('should return a specific brand successfully', async ({ request }) => {
      // First get a valid brand ID
      const allBrandsResponse = await request.get(`${BASE_URL}/brands`);
      const brands = await allBrandsResponse.json();
      const firstBrand = brands[0];

      const response = await request.get(`${BASE_URL}/brands/${firstBrand.id}`);
      expect(response.status()).toBe(200);
      const brand = await response.json();
      expect(brand.id).toBe(firstBrand.id);
    });

    test('should return 404 for non-existent brand ID', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands/99999`);
      expect(response.status()).toBe(404);
    });

    test('should handle invalid brand ID format', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands/invalid-id`);
      expect(response.status()).toBe(404);
    });
  });

  // Test cases for GET /brands/search endpoint
  test.describe('GET /brands/search', () => {
    test('should find brands by valid search query', async ({ request }) => {
      // First get a brand name to search for
      const allBrandsResponse = await request.get(`${BASE_URL}/brands`);
      const brands = await allBrandsResponse.json();
      const searchTerm = brands[0].name.substring(0, 3);

      const response = await request.get(`${BASE_URL}/brands/search?q=${searchTerm}`);
      expect(response.status()).toBe(200);
      const searchResults = await response.json();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });

    test('should return empty results for non-matching search query', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands/search?q=NonExistentBrandXYZ123`);
      expect(response.status()).toBe(200);
      const searchResults = await response.json();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBe(0);
    });

    test('should handle empty search query', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/brands/search?q=`);
      expect(response.status()).toBe(200);
      const searchResults = await response.json();
      expect(Array.isArray(searchResults)).toBe(true);
      // API returns all brands when search query is empty
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });
});
