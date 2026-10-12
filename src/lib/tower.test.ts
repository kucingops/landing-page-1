import { describe, expect, it } from 'vitest';
import { FLOOR_HEIGHT, MAX_FLOORS, floor, grow, visibleRange } from './tower';

describe('floor', () => {
	it('is deterministic, so a recycled floor is redrawn identically', () => {
		expect(floor(1234)).toEqual(floor(1234));
		expect(floor(1)).not.toEqual(floor(2));
	});

	it('only puts residents in lit windows', () => {
		for (let i = 0; i < 500; i++) {
			for (const w of floor(i).windows) if (!w.lit) expect(w.resident).toBe('none');
		}
	});
});

describe('visibleRange', () => {
	it('keeps a single screen of floors plus one floor of overscan', () => {
		const { first, last } = visibleRange(FLOOR_HEIGHT * 100, 600, 10_000);
		expect(first).toBe(99);
		expect(last).toBe(102);
		expect(last - first + 1).toBeLessThanOrEqual(5);
	});

	it('clamps at the top and bottom', () => {
		expect(visibleRange(0, 600, 3)).toEqual({ first: 0, last: 2 });
	});
});

describe('grow', () => {
	it('adds floors only when the end gets close', () => {
		expect(grow(60, 0, 600)).toBe(60);
		expect(grow(60, 60 * FLOOR_HEIGHT - 1200, 600)).toBe(120);
	});

	it('stops at the maximum', () => {
		expect(grow(MAX_FLOORS, MAX_FLOORS * FLOOR_HEIGHT, 600)).toBe(MAX_FLOORS);
	});
});
