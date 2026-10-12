import { describe, expect, it } from 'vitest';
import { FLOOR_HEIGHT, TILES, climbPhase, floor, floorNumber, visibleRange } from './tower';

describe('floor', () => {
	it('is deterministic, so a recycled floor is redrawn identically', () => {
		expect(floor(42)).toEqual(floor(42));
		expect(floor(1)).not.toEqual(floor(2));
	});

	it('only puts residents in lit windows', () => {
		for (let i = 0; i < TILES; i++) {
			for (const w of floor(i).windows) if (!w.lit) expect(w.resident).toBe('none');
		}
	});
});

describe('floorNumber', () => {
	it('counts 100 floors from the top down to street level', () => {
		expect(floorNumber(0)).toBeNull();
		expect(floorNumber(1)).toBe(100);
		expect(floorNumber(TILES - 1)).toBe(1);
	});
});

describe('visibleRange', () => {
	it('keeps a single screen of floors plus one floor of overscan', () => {
		const { first, last } = visibleRange(FLOOR_HEIGHT * 50, 600);
		expect(first).toBe(49);
		expect(last).toBe(52);
	});

	it('clamps at the roof and the ground', () => {
		expect(visibleRange(0, 600).first).toBe(0);
		expect(visibleRange(FLOOR_HEIGHT * TILES, 600).last).toBe(TILES - 1);
	});
});

describe('climbPhase', () => {
	it('completes one climbing cycle every two rungs', () => {
		expect(climbPhase(0)).toBe(0);
		expect(climbPhase(60)).toBeCloseTo(Math.PI * 2);
	});
});
