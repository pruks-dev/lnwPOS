import type { OpenPlebOffer, OpenPlebSettings } from './types';

const DEFAULT_OPENPLEB_API = 'https://api.openpleb.com/api/v1';

export class OpenPlebService {
	private apiUrl: string;

	constructor(apiUrl: string = DEFAULT_OPENPLEB_API) {
		this.apiUrl = apiUrl;
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.apiUrl}${endpoint}`;
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...((options.headers as Record<string, string>) || {})
		};

		const response = await fetch(url, {
			...options,
			headers
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('API Error:', response.status, errorText);
			throw new Error(`HTTP ${response.status}: ${errorText}`);
		}

		return response.json();
	}

	async getEnvSettings(): Promise<OpenPlebSettings> {
		const result = await this.request<{ env: OpenPlebSettings }>('/envsettings');
		return result.env;
	}

	async createOffer(params: {
		amount: number;
		fiatProviderId?: number;
		pubkey: string;
		qrCode?: string;
	}): Promise<{ offer: OpenPlebOffer }> {
		const body = {
			amount: params.amount,
			fiatProviderId: params.fiatProviderId,
			pubkey: params.pubkey,
			qrCode: params.qrCode ?? ''
		};
		console.log('Creating offer with:', body);
		return this.request('/offers', {
			method: 'POST',
			body: JSON.stringify(body)
		});
	}

	async createInvoice(offerId: number): Promise<{ offer: OpenPlebOffer }> {
		return this.request(`/offers/${offerId}/createinvoice`);
	}

	async getOfferData(offerId: number): Promise<{ offer: OpenPlebOffer }> {
		return this.request(`/data/for/${offerId}`);
	}

	async checkInvoice(offerId: number): Promise<{ state: 'PENDING' | 'PAID'; offer: OpenPlebOffer }> {
		return this.request(`/offers/${offerId}/checkinvoice`);
	}

	async checkPaidInvoice(offerId: number): Promise<{ paid: boolean; state?: string }> {
		return this.request(`/offers/${offerId}/checkpaidinvoice`);
	}

	async payWithToken(offerId: number, token: string): Promise<{ offer: OpenPlebOffer }> {
		return this.request(`/offers/${offerId}/paywithtoken`, {
			method: 'POST',
			body: JSON.stringify({ token })
		});
	}

	async getOffers(): Promise<{ offers: OpenPlebOffer[] }> {
		return this.request('/offers');
	}

	async getOffer(offerId: number): Promise<{ offer: OpenPlebOffer }> {
		return this.request(`/offers/${offerId}`);
	}

	async getFiatProviders(): Promise<{ providers: Array<{ id: number; name: string; currency: string }> }> {
		return this.request('/fiat-providers');
	}

	async claimOffer(offerId: number, params: {
		pubkey: string;
		bond: string;
	}): Promise<{ offer: OpenPlebOffer }> {
		return this.request(`/offers/${offerId}/claim`, {
			method: 'POST',
			body: JSON.stringify(params)
		});
	}

	async submitReceipt(offerId: number, params: {
		receipt: string;
		pubkey: string;
	}): Promise<{ success: boolean }> {
		return this.request(`/offers/${offerId}/receipt`, {
			method: 'POST',
			body: JSON.stringify(params)
		});
	}

	async submitFeedback(offerId: number, params: {
		payload: { status: 'positive' | 'negative'; feedback?: string };
		nonce: string;
		timestamp: number;
		signature: string;
	}): Promise<{ status: string; reward?: string; refund?: string }> {
		return this.request(`/offers/${offerId}/feedback`, {
			method: 'POST',
			body: JSON.stringify(params)
		});
	}
}

export const openpleb = new OpenPlebService();

export function createOpenPlebService(apiUrl?: string): OpenPlebService {
	return new OpenPlebService(apiUrl);
}

export function calculateSatsFromTHB(thbAmount: number, conversionRate: number): number {
	if (conversionRate <= 0) return 0;
	return Math.floor((thbAmount * 100000000) / conversionRate);
}

export function calculateTHBFromSats(sats: number, btcToThbRate: number): number {
	return sats * btcToThbRate;
}
