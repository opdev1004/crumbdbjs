import fsp from "fs/promises";
import path from "path";
import { getFileLock } from './getFileLock.js';

export class CrumbDB
{
    constructor ()
    {
        this.fileLocks = new Map();
    }

    async insert (dirname, databasename, collectionname, documentname, value, encoding = 'utf8')
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${documentname}.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();

        try
        {
            await fsp.mkdir(collectionDirname, { recursive: true });
            await fsp.writeFile(filename, value, encoding);
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            await lock.release();
        }
    }

    async get (dirname, databasename, collectionname, documentname, encoding = 'utf8')
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${documentname}.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();

        try
        {
            return await fsp.readFile(filename, encoding);
        }
        catch
        {
            return '';
        }
        finally
        {
            lock.release();
        }
    }

    async remove (dirname, databasename, collectionname, documentname)
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${documentname}.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();
        try
        {
            await fsp.unlink(filename);
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            lock.release();
        }
    }

    async getAll (dirname, databasename, collectionname, encoding = 'utf8')
    {
        try
        {
            const result = {};
            const collectionDirname = path.join(dirname, databasename, collectionname);
            const files = await fsp.readdir(collectionDirname);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles)
            {
                const filename = path.join(collectionDirname, file);
                const lock = getFileLock(filename, this.fileLocks);
                await lock.acquire();

                try
                {
                    const content = await fsp.readFile(filename, encoding);
                    result[path.basename(file, '.json')] = content;
                }
                catch
                {
                    result[path.basename(file, '.json')] = '';
                }
                finally
                {
                    lock.release();
                }
            }

            return result;
        }
        catch
        {
            return {};
        }
    }

    async getMultiple (dirname, databasename, collectionname, position, count, encoding = 'utf8')
    {
        try
        {
            const result = {};
            const collectionDirname = path.join(dirname, databasename, collectionname);
            const files = await fsp.readdir(collectionDirname);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
            const selected = jsonFiles.slice(position, position + count);

            for (const file of selected)
            {
                const filename = path.join(collectionDirname, file);
                const lock = getFileLock(filename, this.fileLocks);
                await lock.acquire();

                try
                {
                    const content = await fsp.readFile(filename, encoding);
                    result[path.basename(file, '.json')] = content;
                }
                catch
                {
                    result[path.basename(file, '.json')] = '';
                }
                finally
                {
                    lock.release();
                }
            }

            return result;
        }
        catch
        {
            return {};
        }
    }
}
