import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import yauzl from 'yauzl';
import { CrumbDB } from '../src/index.js';

const TEST_DIR = './testdata/crumbdb';
const DB_NAME = 'mydb';
const COLLECTION = 'mycollection';
const ZIP_PATH = './testdata/backup/crumbdb/backup.zip';

describe('CrumbDB (nested)', () =>
{
    let db;

    beforeEach(async () =>
    {
        db = new CrumbDB();
        await fsp.rm(TEST_DIR, { recursive: true, force: true });
        await fsp.rm(ZIP_PATH, { force: true });
        await fsp.mkdir(path.dirname(ZIP_PATH), { recursive: true });
    });

    afterEach(async () =>
    {
        await fsp.rm(ZIP_PATH, { force: true });
    });

    test('insert and get document', async () =>
    {
        const success = await db.add(TEST_DIR, DB_NAME, COLLECTION, 'doc1', 'value1');
        expect(success).toBe(true);

        const value = await db.get(TEST_DIR, DB_NAME, COLLECTION, 'doc1');
        expect(value).toBe('value1');
    });

    test('get non-existent document returns empty string', async () =>
    {
        const value = await db.get(TEST_DIR, DB_NAME, COLLECTION, 'ghost');
        expect(value).toBe('');
    });

    test('remove existing document', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'toRemove', 'bye');
        const removed = await db.remove(TEST_DIR, DB_NAME, COLLECTION, 'toRemove');
        expect(removed).toBe(true);

        const value = await db.get(TEST_DIR, DB_NAME, COLLECTION, 'toRemove');
        expect(value).toBe('');
    });

    test('remove non-existent document returns false', async () =>
    {
        const removed = await db.remove(TEST_DIR, DB_NAME, COLLECTION, 'nope');
        expect(removed).toBe(false);
    });

    test('getAll returns all key-value pairs', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'a', '1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'b', '2');
        const result = await db.getAll(TEST_DIR, DB_NAME, COLLECTION);

        expect(result).toEqual({
            a: '1',
            b: '2'
        });
    });

    test('getMultiple returns correct subset', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k1', 'v1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k2', 'v2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k3', 'v3');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k4', 'v4');

        const result = await db.getMultiple(TEST_DIR, DB_NAME, COLLECTION, 1, 2);
        expect(Object.keys(result.data).length).toBe(2);
        const vals = Object.values(result.data);
        expect(vals).toHaveLength(2);
        expect(['v1', 'v2', 'v3', 'v4']).toEqual(expect.arrayContaining(vals));
        expect(typeof result.meta.DBEnd).toBe('boolean');
    });

    test('getAll returns empty object when folder does not exist', async () =>
    {
        const result = await db.getAll('./missing', DB_NAME, COLLECTION);
        expect(result).toEqual({});
    });

    test('getMultiple returns empty object when folder does not exist', async () =>
    {
        const result = await db.getMultiple('./nowhere', DB_NAME, COLLECTION, 0, 3);
        expect(result).toEqual({ data: {}, meta: { DBNextPosition: 0, DBEnd: true } });
    });

    test('getMultiple returns a subset and meta advances', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k1', 'v1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k2', 'v2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k3', 'v3');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'k4', 'v4');

        const result = await db.getMultiple(TEST_DIR, DB_NAME, COLLECTION, 1, 2);
        expect(Object.keys(result.data).length).toBe(2);

        // Returned values should be from the set {v1..v4}
        const vals = new Set(Object.values(result.data));
        expect(['v1', 'v2', 'v3', 'v4'].some(v => vals.has(v))).toBe(true);

        expect(result.meta.DBNextPosition).toBeGreaterThan(1);
        expect(typeof result.meta.DBEnd).toBe('boolean');
    });


    test('getMultiple end-of-dir signals DBEnd=true', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'a', '1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'b', '2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'c', '3');

        const result = await db.getMultiple(TEST_DIR, DB_NAME, COLLECTION, 0, 999);
        expect(result.meta.DBEnd).toBe(true);

        const files = await fsp.readdir(path.join(TEST_DIR, DB_NAME, COLLECTION));
        const eligible = files.filter(f => f.endsWith('.json')).length;
        expect(result.meta.DBNextPosition).toBe(eligible);
        expect(Object.keys(result.data).length).toBe(eligible);
    });


    test('getMultipleByKeyword finds basename matches', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'apple', 'x1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'banana', 'x2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'appetite', 'x3');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'grape', 'x4');

        const result = await db.getMultipleByKeyword(TEST_DIR, DB_NAME, COLLECTION, 'app', 0, 10);
        const keys = Object.keys(result.data);
        expect(keys).toEqual(expect.arrayContaining(['apple', 'appetite']));
        expect(keys).not.toEqual(expect.arrayContaining(['banana', 'grape']));
        expect(result.meta.DBEnd).toBe(true);
    });

    test('getMultipleByKeywords matches ANY keyword', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'red-apple', 'v1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'yellow-banana', 'v2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'green-pear', 'v3');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'blueberry', 'v4');

        const result = await db.getMultipleByKeywords(TEST_DIR, DB_NAME, COLLECTION, ['apple', 'banana'], 0, 10);
        const keys = Object.keys(result.data);
        expect(keys).toEqual(expect.arrayContaining(['red-apple', 'yellow-banana']));
        expect(keys).not.toEqual(expect.arrayContaining(['green-pear', 'blueberry']));
    });

    test('getMultipleByKeywords paginates with DBNextPosition', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'alpha', '1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'alphabet', '2');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'beta', '3');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'betamax', '4');

        const res1 = await db.getMultipleByKeywords(TEST_DIR, DB_NAME, COLLECTION, ['alpha', 'beta'], 0, 2);
        expect(Object.keys(res1.data).length).toBe(2);
        expect(res1.meta.DBEnd).toBe(false);

        const res2 = await db.getMultipleByKeywords(
            TEST_DIR, DB_NAME, COLLECTION, ['alpha', 'beta'], res1.meta.DBNextPosition, 10
        );

        const union = [...new Set([...Object.keys(res1.data), ...Object.keys(res2.data)])];
        expect(union).toEqual(expect.arrayContaining(['alpha', 'alphabet', 'beta', 'betamax']));
        expect(res2.meta.DBEnd).toBe(true);
    });

    test('getMultipleByKeywords handles empty keyword list', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'foo', '1');
        const result = await db.getMultipleByKeywords(TEST_DIR, DB_NAME, COLLECTION, [], 0, 5);
        expect(result).toEqual({ data: {}, meta: { DBNextPosition: 0, DBEnd: true } });
    });

    test('backup creates zip with all .json files', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'doc1', 'value1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'doc2', 'value2');

        const success = await db.backup(TEST_DIR, ZIP_PATH);
        expect(success).toBe(true);

        const exists = fs.existsSync(ZIP_PATH);
        expect(exists).toBe(true);

        const entryNames = [];

        await new Promise((resolve, reject) =>
        {
            yauzl.open(ZIP_PATH, { lazyEntries: true }, (err, zipfile) =>
            {
                if (err) return reject(err);

                zipfile.readEntry();

                zipfile.on('entry', (entry) =>
                {
                    entryNames.push(entry.fileName);
                    zipfile.readEntry();
                });

                zipfile.on('end', () =>
                {
                    resolve();
                });

                zipfile.on('error', reject);
            });
        });

        const normalize = p => p.replace(/\\/g, '/');

        expect(entryNames).toContain(normalize(path.join(DB_NAME, COLLECTION, 'doc1.json')));
        expect(entryNames).toContain(normalize(path.join(DB_NAME, COLLECTION, 'doc2.json')));
    });


    test('restore restoresultall files from zip', async () =>
    {
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'doc1', 'value1');
        await db.add(TEST_DIR, DB_NAME, COLLECTION, 'doc2', 'value2');

        const backupSuccess = await db.backup(TEST_DIR, ZIP_PATH);
        expect(backupSuccess).toBe(true);

        await fsp.rm(TEST_DIR, { recursive: true, force: true });
        expect(fs.existsSync(TEST_DIR)).toBe(false);

        const restoreSuccess = await db.restore(ZIP_PATH, TEST_DIR);
        expect(restoreSuccess).toBe(true);

        const doc1 = await db.get(TEST_DIR, DB_NAME, COLLECTION, 'doc1');
        const doc2 = await db.get(TEST_DIR, DB_NAME, COLLECTION, 'doc2');

        expect(doc1).toBe('value1');
        expect(doc2).toBe('value2');
    });


});
