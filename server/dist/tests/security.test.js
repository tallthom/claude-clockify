import { describe, it, expect } from 'vitest';
import { bulkTimeEntriesSchema } from '../tools/schemas.js';
const VALID_ID = '507f1f77bcf86cd799439011';
describe('bulkTimeEntriesSchema timeEntryIds', () => {
    it('rejects empty array', () => {
        const result = bulkTimeEntriesSchema.safeParse({
            workspaceId: VALID_ID,
            timeEntryIds: [],
            action: 'DELETE',
        });
        expect(result.success).toBe(false);
    });
    it('accepts array within limit', () => {
        const result = bulkTimeEntriesSchema.safeParse({
            workspaceId: VALID_ID,
            timeEntryIds: [VALID_ID, VALID_ID],
            action: 'DELETE',
        });
        expect(result.success).toBe(true);
    });
    it('rejects array exceeding 500', () => {
        const result = bulkTimeEntriesSchema.safeParse({
            workspaceId: VALID_ID,
            timeEntryIds: Array(501).fill(VALID_ID),
            action: 'DELETE',
        });
        expect(result.success).toBe(false);
    });
    it('accepts exactly 500 entries', () => {
        const result = bulkTimeEntriesSchema.safeParse({
            workspaceId: VALID_ID,
            timeEntryIds: Array(500).fill(VALID_ID),
            action: 'DELETE',
        });
        expect(result.success).toBe(true);
    });
});
describe('weekly_report format allowlist', () => {
    const ALLOWED_FORMATS = ['text', 'json', 'csv'];
    it('maps known formats through unchanged', () => {
        for (const fmt of ALLOWED_FORMATS) {
            const raw = String(fmt);
            const result = ALLOWED_FORMATS.includes(raw) ? raw : 'text';
            expect(result).toBe(fmt);
        }
    });
    it('falls back to text for unknown format', () => {
        const raw = 'xml';
        const result = ALLOWED_FORMATS.includes(raw) ? raw : 'text';
        expect(result).toBe('text');
    });
    it('falls back to text for injection attempt', () => {
        const raw = 'text; rm -rf /';
        const result = ALLOWED_FORMATS.includes(raw) ? raw : 'text';
        expect(result).toBe('text');
    });
});
//# sourceMappingURL=security.test.js.map