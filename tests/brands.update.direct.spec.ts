import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.practicesoftwaretesting.com';

test.describe('Brands UPDATE API Tests - Direct Approach', () => {
    let authToken: string;
    let testBrandId: number;

    test.beforeEach(async ({ request }) => {
        // Get auth token
        const loginResponse = await request.post(`${BASE_URL}/users/login`, {
            data: {
                email: 'admin@practicesoftwaretesting.com',
                password: 'welcome01'
            }
        });
        
        expect(loginResponse.status()).toBe(200);
        const { access_token } = await loginResponse.json();
        authToken = access_token;
        
        // Create a test brand
        const timestamp = Date.now();
        const createResponse = await request.post(`${BASE_URL}/brands`, {
            data: {
                name: `Test Brand ${timestamp}`,
                slug: `test-brand-${timestamp}`
            },
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        expect(createResponse.status()).toBe(201);
        const brand = await createResponse.json();
        testBrandId = brand.id;
    });

    // Positive Test Cases
    test('should successfully update brand with valid data', async ({ request }) => {
        const updateData = {
            name: `Updated Brand ${Date.now()}`,
            slug: `updated-brand-${Date.now()}`
        };

        const response = await request.put(`${BASE_URL}/brands/${testBrandId}`, {
            data: updateData,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(200);
        const updatedBrand = await response.json();
        expect(updatedBrand.name).toBe(updateData.name);
        expect(updatedBrand.slug).toBe(updateData.slug);
        expect(updatedBrand.id).toBe(testBrandId);
    });

    test('should successfully update only name field', async ({ request }) => {
        // Get current brand data
        const getBrandResponse = await request.get(`${BASE_URL}/brands/${testBrandId}`);
        const currentBrand = await getBrandResponse.json();

        const updateData = {
            name: `Updated Name Only ${Date.now()}`
        };

        const response = await request.put(`${BASE_URL}/brands/${testBrandId}`, {
            data: updateData,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(200);
        const updatedBrand = await response.json();
        expect(updatedBrand.name).toBe(updateData.name);
        expect(updatedBrand.slug).toBe(currentBrand.slug); // Slug should remain unchanged
    });

    // Negative Test Cases
    test('should return 403 when updating without authentication', async ({ request }) => {
        const updateData = {
            name: `Updated Brand ${Date.now()}`
        };

        const response = await request.put(`${BASE_URL}/brands/${testBrandId}`, {
            data: updateData,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(403);
    });