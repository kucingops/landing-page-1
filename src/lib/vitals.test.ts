import { describe, expect, it } from 'vitest';
import { clsFromShifts, formatBytes, formatCls, formatMs, formatSeconds, rate } from './vitals';

describe('rate', () => {
	it('uses web.dev thresholds', () => {
		expect(rate('lcp', 2500)).toBe('good');
		expect(rate('lcp', 2501)).toBe('ok');
		expect(rate('lcp', 4001)).toBe('poor');
		expect(rate('cls', 0)).toBe('good');
		expect(rate('cls', 0.2)).toBe('ok');
	});
});

describe('formatting', () => {
	it('formats milliseconds', () => {
		expect(formatMs(380.4)).toBe('380 ms');
		expect(formatMs(1234)).toBe('1.23 s');
		expect(formatMs(NaN)).toBe('—');
	});
	it('formats the hero seconds', () => {
		expect(formatSeconds(384)).toBe('0.38');
		expect(formatSeconds(12_345)).toBe('12.3');
	});
	it('formats bytes', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(5 * 1024)).toBe('5.0 KB');
		expect(formatBytes(42 * 1024)).toBe('42 KB');
		expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
	});
	it('formats CLS', () => {
		expect(formatCls(0)).toBe('0');
		expect(formatCls(0.01234)).toBe('0.012');
	});
});

describe('clsFromShifts', () => {
	it('takes the worst session window, not the sum', () => {
		const shifts = [
			{ value: 0.05, startTime: 100 },
			{ value: 0.05, startTime: 600 },
			// > 1 s gap starts a new window
			{ value: 0.02, startTime: 3000 }
		];
		expect(clsFromShifts(shifts)).toBeCloseTo(0.1);
	});
	it('is 0 with no shifts', () => {
		expect(clsFromShifts([])).toBe(0);
	});
});
