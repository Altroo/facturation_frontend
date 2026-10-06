import { dateAt, dayOffset, initialReview, parseReview, updateSchedule, validDate } from './schedule';

describe('logistics review schedule', () => {
	it('pushes every overlapping successor when a step is extended', () => {
		const tasks = initialReview().tasks;
		const next = updateSchedule(tasks, 2, { duration: 9 });
		expect(next[3].offset).toBe(14);
		expect(next[7].offset).toBe(34);
		expect(tasks[3].offset).toBe(10);
	});
	it('prevents moving before a predecessor and keeps deliberate gaps on shortening', () => {
		const tasks = updateSchedule(initialReview().tasks, 3, { offset: 20 });
		expect(updateSchedule(tasks, 3, { offset: -5 })[3].offset).toBe(10);
		expect(updateSchedule(tasks, 3, { duration: 1 })[4].offset).toBe(30);
	});
	it('bounds resizing and rejects non-finite drag values', () => {
		const tasks = initialReview().tasks;
		expect(updateSchedule(tasks, 0, { duration: -9 })[0].duration).toBe(1);
		expect(updateSchedule(tasks, 0, { duration: 1000 })[0].duration).toBe(90);
		expect(updateSchedule(tasks, 0, { offset: NaN })).toBe(tasks);
	});
	it('handles calendar days and leap dates without timezone shifts', () => {
		expect(dateAt('2028-02-28', 2)).toBe('2028-03-01');
		expect(dayOffset('2028-02-28', '2028-03-01')).toBe(2);
		expect(validDate('2026-02-30')).toBe(false);
	});
	it('rejects corrupt stored schedules and discards unknown decision keys', () => {
		expect(parseReview({ ...initialReview(), tasks: [] })).toBeNull();
		const invalid = initialReview();
		invalid.tasks[2].offset = 0;
		expect(parseReview(invalid)).toBeNull();
		const saved = {
			...initialReview(),
			decisions: {
				'1-0': { choice: 'Modifier', note: 'Ajouter une aide' },
				bogus: { choice: 'Modifier', note: 'Ignore' },
			},
		};
		expect(parseReview(saved)?.decisions).toEqual({ '1-0': { choice: 'Modifier', note: 'Ajouter une aide' } });
	});
});
