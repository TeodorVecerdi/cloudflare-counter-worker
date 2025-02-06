/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        try {
            const url = new URL(request.url);
            const counterName = url.pathname.slice(1);

            // Validate counter name
            if (!counterName) {
                return new Response(JSON.stringify({ error: 'Counter name is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Get value
            if (request.method === 'GET') {
                const value = await env.INTEGER_COUNTER_STORE.get(counterName) || '0';
                return new Response(value, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Increment value
            if (request.method === 'POST') {
                let value = parseInt(await env.INTEGER_COUNTER_STORE.get(counterName) || '0');
                value++;
                await env.INTEGER_COUNTER_STORE.put(counterName, value.toString());
                return new Response(value.toString(), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update value
            if (request.method === 'PUT') {
                const data = await request.json() as { value: number };
                await env.INTEGER_COUNTER_STORE.put(counterName, data.value.toString());
                return new Response(data.value.toString(), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Unsupported method
            return new Response(null, { status: 405 });
        } catch (error: unknown) {
            if (error instanceof Error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ error: 'An unknown error occurred' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
} satisfies ExportedHandler<Env>;
