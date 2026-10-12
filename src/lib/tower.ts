// Procedural floors for the tower. Pure functions, so every floor looks the same
// each time it is redrawn and can be unit tested.

export const FLOOR_HEIGHT = 360;
export const FLOORS = 100;
/** Tile 0 is the roof, tiles 1–100 are floors 100 down to 1 (the ground floor). */
export const TILES = FLOORS + 1;

/** Window x positions in the 400px-wide drawing. The outer ones only show on wide screens. */
export const WINDOW_X = [-468, -340, -212, 44, 172, 428, 556, 684];

export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type Resident = 'none' | 'cat' | 'plant' | 'lamp' | 'curtain';

export interface Window {
	lit: boolean;
	resident: Resident;
	hue: number; // warm light varies a little per window
}

export interface Floor {
	index: number;
	/** Floor number as people count it: 100 at the top, 1 at street level. null for the roof. */
	number: number | null;
	windows: Window[]; // one per entry in WINDOW_X
	sign: boolean; // small neon sign on the wall
	pipe: boolean;
}

const RESIDENTS: Resident[] = ['none', 'none', 'cat', 'plant', 'lamp', 'curtain'];

export function floorNumber(index: number): number | null {
	return index <= 0 ? null : TILES - index;
}

export function floor(index: number): Floor {
	const rnd = mulberry32(index * 2654435761);
	const win = (): Window => {
		const lit = rnd() < 0.62;
		return {
			lit,
			resident: lit ? RESIDENTS[Math.floor(rnd() * RESIDENTS.length)] : 'none',
			hue: 38 + Math.round(rnd() * 14)
		};
	};
	return {
		index,
		number: floorNumber(index),
		windows: WINDOW_X.map(() => win()),
		sign: rnd() < 0.12,
		pipe: rnd() < 0.5
	};
}

/** Floors that should exist in the DOM for a viewport, with one floor of overscan each side. */
export function visibleRange(scrollTop: number, viewport: number, total = TILES) {
	const first = Math.max(0, Math.floor(scrollTop / FLOOR_HEIGHT) - 1);
	const last = Math.min(total - 1, Math.ceil((scrollTop + viewport) / FLOOR_HEIGHT));
	return { first, last };
}

/** Climbing pose: one full hand-over-hand cycle every two ladder rungs (60px). */
export function climbPhase(scrollTop: number) {
	return (scrollTop / 60) * Math.PI * 2;
}
