import fs from 'fs/promises';
import { CrumbDB } from '../src/index.js';

const TEST_DIR = './testdata';

describe('CrumbDB', () =>
{
    let db;

    beforeEach(async () =>
    {
        db = new CrumbDB();
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

    test('insert and get', async () =>
    {
        const success = await db.insert(TEST_DIR, 'hello', 'world');
        expect(success).toBe(true);

        const value = await db.get(TEST_DIR, 'hello');
        expect(value).toBe('world');
    });

    test('get non-existent key returns empty string', async () =>
    {
        const value = await db.get(TEST_DIR, 'doesNotExist');
        expect(value).toBe('');
    });

    test('remove key', async () =>
    {
        await db.insert(TEST_DIR, 'deleteMe', 'bye');
        const removed = await db.remove(TEST_DIR, 'deleteMe');
        expect(removed).toBe(true);

        const value = await db.get(TEST_DIR, 'deleteMe');
        expect(value).toBe('');
    });

    test('remove non-existent key returns false', async () =>
    {
        const removed = await db.remove(TEST_DIR, 'ghost');
        expect(removed).toBe(false);
    });

    test('getAll returns all key-value pairs', async () =>
    {
        await db.insert(TEST_DIR, 'a', '1');
        await db.insert(TEST_DIR, 'b', '2');
        const all = await db.getAll(TEST_DIR);

        expect(all).toEqual({
            a: '1',
            b: '2'
        });
    });

    test('getMultiple returns a subset based on position and count', async () =>
    {
        await db.insert(TEST_DIR, 'k1', 'v1');
        await db.insert(TEST_DIR, 'k2', 'v2');
        await db.insert(TEST_DIR, 'k3', 'v3');
        await db.insert(TEST_DIR, 'k4', 'v4');

        const subset = await db.getMultiple(TEST_DIR, 1, 2);
        const keys = Object.keys(subset);
        expect(keys.length).toBe(2);
        expect(Object.values(subset)).toContain('v2');
        expect(Object.values(subset)).toContain('v3');
    });

    test('getAll returns empty object when folder doesn’t exist', async () =>
    {
        const result = await db.getAll('./does-not-exist');
        expect(result).toEqual({});
    });

    test('getMultiple returns empty object when folder doesn’t exist', async () =>
    {
        const result = await db.getMultiple('./no-folder', 0, 3);
        expect(result).toEqual({});
    });
});