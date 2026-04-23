// LnwPoS - Lightning LNURL Service

import { LightningAddress, Invoice } from '@getalby/lightning-tools';

export interface LightningInvoiceResult {
  invoice: string
  paymentHash: string
  satoshis: number
}

export async function createLightningInvoice(
  lightningAddress: string,
  amountSatoshis: number
): Promise<LightningInvoiceResult> {
  const ln = new LightningAddress(lightningAddress);
  await ln.fetch();

  const invoice = await ln.requestInvoice({ satoshi: amountSatoshis });

  return {
    invoice: invoice.paymentRequest,
    paymentHash: invoice.paymentHash,
    satoshis: amountSatoshis
  };
}

export async function checkLightningInvoicePaid(
  invoice: string
): Promise<boolean> {
  try {
    const inv = new Invoice({ pr: invoice });
    return await inv.isPaid();
  } catch {
    return false;
  }
}

export function calculateSatsFromTHB(thbAmount: number, conversionRate: number): number {
  if (conversionRate <= 0) return 0;
  return Math.floor((thbAmount * 100000000) / conversionRate);
}

export function calculateTHBFromSats(sats: number, btcToThbRate: number): number {
  return sats * btcToThbRate;
}

export function decodeInvoiceAmount(invoiceString: string): number {
  try {
    const invoice = new Invoice({ pr: invoiceString });
    return invoice.satoshi || 0;
  } catch {
    return 0;
  }
}