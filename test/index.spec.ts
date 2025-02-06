// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src/index';

describe('Counter Worker Tests', () => {
    const testEnv = env as Env;

    beforeEach(async () => {
        // Clear any existing counters
        await testEnv.INTEGER_COUNTER_STORE.delete('test-counter');
    });

    describe('Counter name validation', () => {
        it('should reject requests with empty counter name', async () => {
            const response = await SELF.fetch('https://example.com/');
            expect(response.status).toBe(400);
            const data = await response.json() as { error: string };
            expect(data.error).toBe('Counter name is required');
        });
    });

    describe('GET method', () => {
        it('should return 0 for a new counter', async () => {
            const response = await SELF.fetch('https://example.com/test-counter');
            expect(response.status).toBe(200);
            expect(await response.text()).toBe('0');
        });

        it('should return the current value for an existing counter', async () => {
            await testEnv.INTEGER_COUNTER_STORE.put('test-counter', '42');
            const response = await SELF.fetch('https://example.com/test-counter');
            expect(response.status).toBe(200);
            expect(await response.text()).toBe('42');
        });
    });

    describe('POST method', () => {
        it('should increment a new counter from 0 to 1', async () => {
            const response = await SELF.fetch('https://example.com/test-counter', {
                method: 'POST'
            });
            expect(response.status).toBe(200);
            const data = await response.text();
            expect(data).toBe('1');
        });

        it('should increment an existing counter', async () => {
            await testEnv.INTEGER_COUNTER_STORE.put('test-counter', '41');
            const response = await SELF.fetch('https://example.com/test-counter', {
                method: 'POST'
            });
            expect(response.status).toBe(200);
            const data = await response.text();
            expect(data).toBe('42');
        });
    });

    describe('PUT method', () => {
        it('should set a counter to a specific value', async () => {
            const response = await SELF.fetch('https://example.com/test-counter', {
                method: 'PUT',
                body: JSON.stringify({ value: 100 }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toBe(200);
            const data = await response.text();
            expect(data).toBe('100');

            // Verify the value was actually stored
            const storedValue = await testEnv.INTEGER_COUNTER_STORE.get('test-counter');
            expect(storedValue).toBe('100');
        });

        it('should handle invalid JSON in PUT request', async () => {
            const response = await SELF.fetch('https://example.com/test-counter', {
                method: 'PUT',
                body: 'invalid json',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toBe(400);
            const data = await response.json() as { error: string };
            expect(data.error).toBeTruthy();
        });
    });

    describe('Error handling', () => {
        it('should handle unsupported methods', async () => {
            const response = await SELF.fetch('https://example.com/test-counter', {
                method: 'DELETE'
            });
            expect(response.status).toBe(405);
        });

        it('should reject empty counter names for all methods', async () => {
            // Test POST with empty counter name
            let response = await SELF.fetch('https://example.com/', {
                method: 'POST'
            });
            expect(response.status).toBe(400);
            let data = await response.json() as { error: string };
            expect(data.error).toBe('Counter name is required');

            // Test PUT with empty counter name
            response = await SELF.fetch('https://example.com/', {
                method: 'PUT',
                body: JSON.stringify({ value: 100 }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toBe(400);
            data = await response.json() as { error: string };
            expect(data.error).toBe('Counter name is required');
        });
    });
});
