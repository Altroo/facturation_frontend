export type ReviewTask = { offset: number; duration: number };
export type FieldDecision = { choice: string; note: string };
export type ReviewState = { start: string; tasks: ReviewTask[]; decisions: Record<string, FieldDecision> };

export const INITIAL_TASKS: ReviewTask[] = [2, 3, 5, 10, 4, 4, 2, 1].map((duration, index, durations) => ({
	offset: durations.slice(0, index).reduce((sum, days) => sum + days, 0),
	duration,
}));
export const initialReview = (): ReviewState => ({
	start: '2026-10-06',
	tasks: INITIAL_TASKS.map((t) => ({ ...t })),
	decisions: {},
});
export const validDate = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	Number.isFinite(Date.parse(value)) &&
	new Date(value).toISOString().slice(0, 10) === value;
export const dateAt = (start: string, offset: number) =>
	new Date(Date.parse(start) + offset * 86400000).toISOString().slice(0, 10);
export const dayOffset = (start: string, value: string) =>
	Math.round((Date.parse(value) - Date.parse(start)) / 86400000);

// Finish-to-start: moving/resizing a task pushes any overlapping successors forward.
// Existing deliberate gaps are preserved; no business record is changed.
export const updateSchedule = (tasks: ReviewTask[], index: number, change: Partial<ReviewTask>): ReviewTask[] => {
	if (!tasks[index]) return tasks;
	const next = tasks.map((task) => ({ ...task }));
	const previousEnd = index ? next[index - 1].offset + next[index - 1].duration : 0;
	const offset = change.offset ?? next[index].offset;
	const duration = change.duration ?? next[index].duration;
	if (!Number.isFinite(offset) || !Number.isFinite(duration)) return tasks;
	next[index] = {
		offset: Math.max(previousEnd, Math.min(365, Math.round(offset))),
		duration: Math.max(1, Math.min(90, Math.round(duration))),
	};
	for (let i = index + 1; i < next.length; i++)
		next[i].offset = Math.max(next[i].offset, next[i - 1].offset + next[i - 1].duration);
	return next;
};

export const parseReview = (value: unknown): ReviewState | null => {
	if (!value || typeof value !== 'object') return null;
	const state = value as Partial<ReviewState>;
	if (
		typeof state.start !== 'string' ||
		!validDate(state.start) ||
		state.start < '2000-01-01' ||
		state.start > '2100-01-01'
	)
		return null;
	if (!Array.isArray(state.tasks) || state.tasks.length !== 8) return null;
	let end = 0;
	for (const task of state.tasks) {
		if (
			!task ||
			!Number.isInteger(task.offset) ||
			!Number.isInteger(task.duration) ||
			task.offset < end ||
			task.offset > 1100 ||
			task.duration < 1 ||
			task.duration > 90
		)
			return null;
		end = task.offset + task.duration;
	}
	const decisions: ReviewState['decisions'] = {};
	if (state.decisions && typeof state.decisions === 'object') {
		for (const [key, decision] of Object.entries(state.decisions)) {
			if (
				!/^(?:[1-8]|common)-\d{1,2}$/.test(key) ||
				!decision ||
				!['', 'Conserver', 'Modifier', 'Supprimer'].includes(decision.choice) ||
				typeof decision.note !== 'string'
			)
				continue;
			decisions[key] = { choice: decision.choice, note: decision.note.slice(0, 2000) };
		}
	}
	return { start: state.start, tasks: state.tasks.map((t) => ({ offset: t.offset, duration: t.duration })), decisions };
};
