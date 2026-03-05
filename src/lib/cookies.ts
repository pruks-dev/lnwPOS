import type { Cookies } from '@sveltejs/kit';
import type { User } from './types';
import { generateToken, decodeToken, isTokenExpired } from './storage';

const COOKIE_KEYS = {
	USER: 'lnwpos_user',
	TOKEN: 'lnwpos_token'
} as const;

const TOKEN_EXPIRY_HOURS = 24;

export { generateToken, decodeToken, isTokenExpired };

export function getTokenFromCookie(cookies: Cookies): string | null {
	return cookies.get(COOKIE_KEYS.TOKEN) || null;
}

export function getUserFromCookie(cookies: Cookies): User | null {
	const userStr = cookies.get(COOKIE_KEYS.USER);
	if (!userStr) return null;
	try {
		return JSON.parse(userStr) as User;
	} catch {
		return null;
	}
}

export function setAuthCookies(cookies: Cookies, user: User, token: string): void {
	const expires = new Date();
	expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS);

	cookies.set(COOKIE_KEYS.USER, JSON.stringify(user), {
		path: '/',
		expires,
		httpOnly: false,
		sameSite: 'lax'
	});

	cookies.set(COOKIE_KEYS.TOKEN, token, {
		path: '/',
		expires,
		httpOnly: false,
		sameSite: 'lax'
	});
}

export function removeAuthCookies(cookies: Cookies): void {
	cookies.delete(COOKIE_KEYS.USER, { path: '/' });
	cookies.delete(COOKIE_KEYS.TOKEN, { path: '/' });
}
