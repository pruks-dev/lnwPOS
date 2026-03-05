import type { RequestHandler } from './$types';
import { removeAuthCookies } from '$lib/cookies';

export const POST: RequestHandler = async ({ cookies }) => {
	removeAuthCookies(cookies);
	return new Response(JSON.stringify({ success: true }), {
		status: 200
	});
};
