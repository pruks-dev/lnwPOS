import type { RequestHandler } from './$types';
import { setAuthCookies } from '$lib/cookies';
import type { User } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { user, token } = await request.json() as { user: User; token: string };
		
		if (!user || !token) {
			return new Response(JSON.stringify({ error: 'Missing user or token' }), {
				status: 400
			});
		}

		setAuthCookies(cookies, user, token);

		return new Response(JSON.stringify({ success: true }), {
			status: 200
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid request' }), {
			status: 400
		});
	}
};
