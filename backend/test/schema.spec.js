import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const query = vi.fn();
const uuidv4 = vi.fn();

vi.mock('../src/db.js', () => ({
  execute,
  query,
}));

vi.mock('uuid', () => ({
  v4: uuidv4,
}));

const { ensureSchema } = await import('../src/schema.js');

describe('ensureSchema', () => {
  beforeEach(() => {
    execute.mockReset();
    query.mockReset();
    uuidv4.mockReset();
  });

  it('creates tables and seeds the default categories when the database is empty', async () => {
    query.mockResolvedValue([{ count: 0 }]);
    uuidv4
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2')
      .mockReturnValueOnce('id-3')
      .mockReturnValueOnce('id-4');

    await ensureSchema();

    expect(execute).toHaveBeenCalledTimes(6);
    expect(execute.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(execute.mock.calls[1][0]).toContain('CREATE TABLE IF NOT EXISTS transactions');
    expect(execute.mock.calls[2][0]).toContain("VALUES (");
    expect(execute.mock.calls[2][0]).toContain("'id-1'");
    expect(execute.mock.calls[5][0]).toContain("'Lazer'");
  });

  it('skips seeding when categories already exist', async () => {
    query.mockResolvedValue([{ count: 2 }]);

    await ensureSchema();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith('SELECT COUNT(*) AS count FROM categories');
    expect(uuidv4).not.toHaveBeenCalled();
  });
});
