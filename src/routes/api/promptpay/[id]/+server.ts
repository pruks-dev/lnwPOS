import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const id = params.id;
	const amount = url.searchParams.get('amount') || '0';

	try {
		const promptpayUrl = `https://promptpay.io/${id}/${amount}`;
		const response = await fetch(promptpayUrl);

		if (!response.ok) {
			return new Response('Failed to fetch QR', { status: response.status });
		}

		const blob = await response.blob();

		return new Response(blob, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=300'
			}
		});
	} catch (error) {
		console.error('Proxy error:', error);
		return new Response('Proxy failed', { status: 500 });
	}
};