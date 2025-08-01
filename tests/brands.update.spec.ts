import { test, expect } from '@playwright/test';

// Models and Interfaces
interface Brand {
    id?: number;
    name: string;
    slug: string;
}

interface UpdateBrandResponse {
    id: number;
    name: string;
    slug: string;
}

// Brand Service Class following MCP pattern
class BrandService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getAuthToken(request: any): Promise<string> {
        const response = await request.post(`${this.baseUrl}/users/login`, {
            data: {
                email: 'admin@practicesoftwaretesting.com',
                password: 'welcome01'
            }
        });
        const body = await response.json();
        return body.access_token;
    }

    async createBrand(request: any, token: string, brandData: Brand): Promise<Brand> {
        const response = await request.post(`${this.baseUrl}/brands`, {
            data: brandData,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    }

    async updateBrand(request: any, token: string | null, brandId: number | string, brandData: Partial<Brand>) {
        const response = await request.put(`${this.baseUrl}/brands/${brandId}`, {
            data: brandData,
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
                'Content-Type': 'application/json'
            }
        });
        
        const status = response.status();
        console.log('Update Response Status:', status);
        
        try {
            const responseData = await response.json();
            console.log('Update Response Data:', responseData);
            return { response, data: responseData };
        } catch (error) {
            console.log('Error parsing response:', error);
            return { response, data: null };
        }
    }

    async getBrand(request: any, brandId: number): Promise<Brand> {
        const response = await request.get(`${this.baseUrl}/brands/${brandId}`);
        return await response.json();
    }
}

const BASE_URL = 'https://api.practicesoftwaretesting.com';

test.describe('Brands UPDATE API Tests', () => {
    let brandService: BrandService;
    let authToken: string;
    let testBrand: Brand;

    test.beforeEach(async ({ request }) => {
        brandService = new BrandService(BASE_URL);
        authToken = await brandService.getAuthToken(request);
        
        // Create a test brand to update
        const timestamp = Date.now();
        testBrand = await brandService.createBrand(request, authToken, {
            name: `Test Brand ${timestamp}`,
            slug: `test-brand-${timestamp}`
        });
    });

    // Positive Test Cases
    test('should successfully update brand with valid data', async ({ request }) => {
        const updateData = {
            name: `Updated Brand ${Date.now()}`,
            slug: `updated-brand-${Date.now()}`
        };

        const { response, data } = await brandService.updateBrand(request, authToken, testBrand.id!, updateData);

        expect(response.status()).toBe(200);
        expect(data.name).toBe(updateData.name);
        expect(data.slug).toBe(updateData.slug);
        expect(data.id).toBe(testBrand.id);

        // Verify update with GET request
        const updatedBrand = await brandService.getBrand(request, testBrand.id!);
        expect(updatedBrand.name).toBe(updateData.name);
        expect(updatedBrand.slug).toBe(updateData.slug);
    });

    test('should successfully update only name field', async ({ request }) => {
        const updateData = {
            name: `Updated Name Only ${Date.now()}`
        };

        const { response, data } = await brandService.updateBrand(request, authToken, testBrand.id!, updateData);

        expect(response.status()).toBe(200);
        expect(data.name).toBe(updateData.name);
        expect(data.slug).toBe(testBrand.slug); // Slug should remain unchanged
        expect(data.id).toBe(testBrand.id);
    });

    // Negative Test Cases
    test('should handle update attempt without authentication', async ({ request }) => {
        const updateData = {
            name: `Unauthorized Update ${Date.now()}`
        };

        const { response } = await brandService.updateBrand(request, null, testBrand.id!, updateData);
        expect(response.status()).toBe(403);
    });

    test('should handle update with non-existent brand ID', async ({ request }) => {
        const updateData = {
            name: `Non-existent Brand ${Date.now()}`
        };

        const { response } = await brandService.updateBrand(request, authToken, 99999, updateData);
        expect(response.status()).toBe(422);
    });

    test('should handle update with invalid brand ID format', async ({ request }) => {
        const updateData = {
            name: `Invalid ID Update ${Date.now()}`
        };

        const { response } = await brandService.updateBrand(request, authToken, 'invalid-id', updateData);
        expect(response.status()).toBe(422);
    });

    test('should reject update with duplicate slug', async ({ request }) => {
        // Create another brand first
        const timestamp = Date.now();
        const anotherBrand = await brandService.createBrand(request, authToken, {
            name: `Another Brand ${timestamp}`,
            slug: `another-brand-${timestamp}`
        });

        // Try to update test brand with another brand's slug
        const updateData = {
            name: `Updated Brand ${timestamp}`,
            slug: anotherBrand.slug
        };

        const { response } = await brandService.updateBrand(request, authToken, testBrand.id!, updateData);
        expect(response.status()).toBe(422);
    });
});
