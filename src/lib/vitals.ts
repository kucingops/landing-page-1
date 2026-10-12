/**
 * Thresholds from web.dev/vitals: [good, needs-improvement] upper bounds.
 * Anything above the second bound is "poor".
 */
export const THRESHOLDS = {
	ttfb: [800, 1800],
	fcp: [1800, 3000],
	lcp: [2500, 4000],
	cls: [0.1, 0.25],
	inp: [200, 500]
} as const;

export type Metric = keyof typeof THRESHOLDS;
export type Rating = 'good' | 'ok' | 'poor';

export function rate(metric: Metric, value: number): Rating {
	const [good, ok] = THRESHOLDS[metric];
	if (value <= good) return 'good';
	if (value <= ok) return 'ok';
	return 'poor';
}

/** 380 → "380 ms", 1234 → "1.23 s" */
export function formatMs(ms: number): string {
	if (!Number.isFinite(ms) || ms < 0) return '—';
	if (ms < 1000) return `${Math.round(ms)} ms`;
	return `${(ms / 1000).toFixed(2)} s`;
}

/** Hero number: always seconds, so the headline reads the same for every visitor. */
export function formatSeconds(ms: number): string {
	if (!Number.isFinite(ms) || ms < 0) return '—';
	return (ms / 1000).toFixed(ms < 10_000 ? 2 : 1);
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return '—';
	if (bytes < 1024) return `${Math.round(bytes)} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
	return `${(kb / 1024).toFixed(2)} MB`;
}

export function formatCls(value: number): string {
	if (!Number.isFinite(value) || value < 0) return '—';
	return value.toFixed(value === 0 ? 0 : 3);
}

/** Session-window CLS (max 5 s window, 1 s gap), as defined by the CLS spec. */
export function clsFromShifts(shifts: { value: number; startTime: number }[]): number {
	let max = 0;
	let windowValue = 0;
	let windowStart = 0;
	let last = 0;
	for (const s of [...shifts].sort((a, b) => a.startTime - b.startTime)) {
		if (windowValue && (s.startTime - last > 1000 || s.startTime - windowStart > 5000)) {
			windowValue = 0;
		}
		if (!windowValue) windowStart = s.startTime;
		windowValue += s.value;
		last = s.startTime;
		max = Math.max(max, windowValue);
	}
	return max;
}

export interface Readings {
	load?: number;
	ttfb?: number;
	fcp?: number;
	lcp?: number;
	cls?: number;
	inp?: number;
	transferred?: number;
	requests?: number;
	fromCache?: boolean;
}

type Listener = (r: Readings) => void;

/** Observes the current page with the browser's own Performance APIs. Browser only. */
export function observeVitals(onChange: Listener): () => void {
	const r: Readings = {};
	const emit = () => onChange({ ...r });
	const observers: PerformanceObserver[] = [];
	const watch = (type: string, cb: (entries: PerformanceEntryList) => void) => {
		if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
		const o = new PerformanceObserver((list) => cb(list.getEntries()));
		o.observe({ type, buffered: true } as PerformanceObserverInit);
		observers.push(o);
	};

	const nav = performance.getEntriesByType('navigation')[0] as
		PerformanceNavigationTiming | undefined;

	const readNav = () => {
		if (!nav) return;
		r.ttfb = nav.responseStart;
		if (nav.loadEventEnd > 0) r.load = nav.loadEventEnd;
		const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		r.requests = resources.length + 1;
		r.transferred = resources.reduce((sum, e) => sum + e.transferSize, nav.transferSize);
		r.fromCache = nav.transferSize === 0 && nav.decodedBodySize > 0;
		emit();
	};

	watch('paint', (entries) => {
		const fcp = entries.find((e) => e.name === 'first-contentful-paint');
		if (fcp) ((r.fcp = fcp.startTime), emit());
	});
	watch('largest-contentful-paint', (entries) => {
		const last = entries.at(-1);
		if (last) ((r.lcp = last.startTime), emit());
	});
	const shifts: { value: number; startTime: number }[] = [];
	r.cls = 0;
	watch('layout-shift', (entries) => {
		for (const e of entries as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
			if (!e.hadRecentInput) shifts.push({ value: e.value, startTime: e.startTime });
		}
		r.cls = clsFromShifts(shifts);
		emit();
	});
	watch('event', (entries) => {
		for (const e of entries as (PerformanceEntry & { interactionId?: number })[]) {
			if (e.interactionId) r.inp = Math.max(r.inp ?? 0, e.duration);
		}
		emit();
	});

	if (document.readyState === 'complete') queueMicrotask(readNav);
	else addEventListener('load', () => setTimeout(readNav, 0), { once: true });

	return () => observers.forEach((o) => o.disconnect());
}
