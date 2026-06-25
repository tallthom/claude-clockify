import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { objectIdSchema } from '../tools/schemas.js';

describe('objectIdSchema', () => {
  it('rejects non-hex strings', () => {
    const result = objectIdSchema.safeParse('not-an-id');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/24-character hex/);
    }
  });

  it('accepts a valid 24-char hex objectId', () => {
    const result = objectIdSchema.safeParse('507f1f77bcf86cd799439011');
    expect(result.success).toBe(true);
  });
});

describe('createTimeEntrySchema description transform', () => {
  const schema = z.object({
    workspaceId: objectIdSchema,
    description: z
      .string()
      .transform(desc => desc.replace(/<[^>]*>/g, '').trim()),
    start: z.string(),
  });

  it('strips HTML tags from description, leaving inner text', () => {
    const result = schema.safeParse({
      workspaceId: '507f1f77bcf86cd799439011',
      description: '<b>Hello</b> world',
      start: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Hello world');
    }
  });
});
