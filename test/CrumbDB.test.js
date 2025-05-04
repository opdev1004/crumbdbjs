import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import yauzl from 'yauzl';
import { CrumbDB } from '../src/index.js';

const TEST_DIR = './testdata/crumbfiles';
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
        const success = await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'doc1', 'value1');
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
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'toRemove', 'bye');
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
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'a', '1');
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'b', '2');
        const result = await db.getAll(TEST_DIR, DB_NAME, COLLECTION);

        expect(result).toEqual({
            a: '1',
            b: '2'
        });
    });

    test('getMultiple returns correct subset', async () =>
    {
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'k1', 'v1');
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'k2', 'v2');
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'k3', 'v3');
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'k4', 'v4');

        const subset = await db.getMultiple(TEST_DIR, DB_NAME, COLLECTION, 1, 2);
        const keys = Object.keys(subset);
        expect(keys.length).toBe(2);
        expect(Object.values(subset)).toContain('v2');
        expect(Object.values(subset)).toContain('v3');
    });

    test('getAll returns empty object when folder does not exist', async () =>
    {
        const result = await db.getAll('./missing', DB_NAME, COLLECTION);
        expect(result).toEqual({});
    });

    test('getMultiple returns empty object when folder does not exist', async () =>
    {
        const result = await db.getMultiple('./nowhere', DB_NAME, COLLECTION, 0, 3);
        expect(result).toEqual({});
    });


    test('backup creates zip with all .json files', async () =>
    {
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'doc1', 'value1');
        await db.insert(TEST_DIR, DB_NAME, COLLECTION, 'doc2', 'value2');

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
});
