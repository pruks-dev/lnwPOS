// LnwPoS - OpenPleb Key Management

import { getPublicKey } from 'noble-secp256k1';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const bech32Polymul = (a: number[], b: number[]): number[] => {
	const o = new Array(a.length + b.length - 1).fill(0);
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b.length; j++) {
			o[i + j] = (o[i + j] + a[i] * b[j]) % 256;
		}
	}
	return o;
};

const bech32Mod = (a: number[], b: number[]): number => {
	let reg = a.slice();
	for (let i = 0; i < reg.length; i++) {
		const top = reg.shift()!;
		if (top === 0) continue;
		for (let j = 0; j < b.length; j++) {
			reg[i + j] = (reg[i + j] ^ (b[j] * top)) % 256;
		}
	}
	return reg[0];
};

const bech32CreateChecksum = (words: number[], data: number[]): number[] => {
	const values = words.concat([0, 0, 0, 0, 0, 0]);
	const poly = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
	for (let i = 0; i < 6; i++) {
		values.push(0);
	}
	for (let i = 0; i < values.length; i++) {
		const b = values[values.length - 1 - i] >>> 3;
		values[values.length - 1 - i] ^= (b << 2) | (values.length - i > 6 ? 0 : 0);
	}
	const mod = bech32Mod(values, poly);
	const result = [0, 0, 0, 0, 0, 0];
	for (let i = 0; i < 6; i++) {
		result[i] = ((mod >>> (5 * (5 - i))) & 31);
	}
	return result;
};

const bech32Encode = (prefix: string, data: Uint8Array): string => {
	const words: number[] = [];
	for (let i = 0; i < data.length; i += 5) {
		let bits = 0;
		let acc = 0;
		const chunk = Math.min(5, data.length - i);
		for (let j = 0; j < chunk; j++) {
			acc = (acc << 8) | data[i + j];
			bits += 8;
		}
		const values: number[] = [];
		while (bits >= 5) {
			values.push((acc >>> (bits - 5)) & 31);
			bits -= 5;
		}
		if (chunk > 0) values.push((acc << (5 - bits)) | (chunk === 5 ? 0 : 0));
		words.push(...values);
	}
	const chk = bech32CreateChecksum(words, [0]);
	const combined = words.concat(chk);
	const prefixLower = prefix.toLowerCase();
	let result = prefixLower + '1';
	for (const w of combined) {
		result += CHARSET[w];
	}
	return result;
};

const bech32Decode = (str: string): { prefix: string; data: Uint8Array } | null => {
	const pos = str.lastIndexOf('1');
	if (pos < 1) return null;
	const prefix = str.slice(0, pos).toLowerCase();
	const data = str.slice(pos + 1);
	if (data.length < 6) return null;
	const words: number[] = [];
	for (const c of data) {
		const idx = CHARSET.indexOf(c);
		if (idx < 0) return null;
		words.push(idx);
	}
	const values = words.slice(0, -6);
	const chk = words.slice(-6);
	const validChk = bech32CreateChecksum(values, [0]);
	let valid = true;
	for (let i = 0; i < 6; i++) {
		if (chk[i] !== validChk[i]) {
			valid = false;
			break;
		}
	}
	if (!valid) return null;
	const bytes: number[] = [];
	let bits = 0;
	let acc = 0;
	for (const w of values) {
		acc = (acc << 5) | w;
		bits += 5;
		if (bits >= 8) {
			bytes.push((acc >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return { prefix, data: new Uint8Array(bytes) };
};

const hexToBytes = (hex: string): Uint8Array => {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
};

const bytesToHex = (bytes: Uint8Array): string => {
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

export function hexToNpub(hexPubkey: string): string {
	return bech32Encode('npub', hexToBytes(hexPubkey));
}

export function npubToHex(npub: string): string | null {
	const result = bech32Decode(npub);
	if (!result || result.prefix !== 'npub') return null;
	return bytesToHex(result.data);
}

function generatePrivateKey(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return bytesToHex(array);
}

export function generateKeypair(): { privkey: string; pubkey: string } {
	const privkey = generatePrivateKey();
	const pubkey = bytesToHex(getPublicKey(hexToBytes(privkey), true));
	return { privkey, pubkey };
}

export function derivePubkey(privkey: string): string {
	return bytesToHex(getPublicKey(hexToBytes(privkey), true));
}

export function encryptPrivkey(privkey: string, password: string): string {
	return btoa(`${privkey}:${password}`);
}

export function decryptPrivkey(encrypted: string, password: string): string | null {
	try {
		const decoded = atob(encrypted);
		const [key, pwd] = decoded.split(':');
		return pwd === password ? key : null;
	} catch {
		return null;
	}
}

export function isValidPrivkey(privkey: string): boolean {
	try {
		const key = privkey.startsWith('0x') ? privkey.slice(2) : privkey;
		return key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
	} catch {
		return false;
	}
}