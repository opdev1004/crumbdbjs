import fsp from "fs/promises";
import path from "path";
import { getFileLock } from './getFileLock.js';

export class CrumbDB
{
    constructor ()
    {
        this.fileLocks = new Map();
    }

    async insert (dirname, keyname, value, encoding = 'utf8')
    {
        const filename = path.join(dirname, `${keyname}.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();

        try
        {
            await fsp.mkdir(dirname, { recursive: true });
            const json = JSON.stringify({ [keyname]: value });
            await fsp.writeFile(filename, json, encoding);
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

    async get (dirname, keyname, encoding = 'utf8')
    {
        const filename = path.join(dirname, `${keyname}.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();

        try
        {
            const content = await fsp.readFile(filename, encoding);
            const data = JSON.parse(content);
            return data[keyname] ?? '';
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

    async remove (dirname, keyname)
    {
        const filename = path.join(dirname, `${keyname}.json`);
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

    async getAll (dirname, encoding = 'utf8')
    {
        try
        {
            const result = {};
            const files = await fsp.readdir(dirname);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles)
            {
                const filename = path.join(dirname, file);
                const lock = getFileLock(filename, this.fileLocks);
                await lock.acquire();

                try
                {
                    const content = await fsp.readFile(filename, encoding);
                    const data = JSON.parse(content);

                    if (Object.keys(data).length === 0)
                    {
                        result[path.basename(file, '.json')] = '';
                    }
                    else
                    {
                        Object.assign(result, data);
                    }
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

    async getMultiple (dirname, position, count, encoding = 'utf8')
    {
        try
        {
            const result = {};
            const files = await fsp.readdir(dirname);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
            const selected = jsonFiles.slice(position, position + count);

            for (const file of selected)
            {
                const filename = path.join(dirname, file);
                const lock = getFileLock(filename, this.fileLocks);
                await lock.acquire();

                try
                {
                    const content = await fsp.readFile(filename, encoding);
                    const data = JSON.parse(content);

                    if (Object.keys(data).length === 0)
                    {
                        result[path.basename(file, '.json')] = '';
                    }
                    else
                    {
                        Object.assign(result, data);
                    }
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
