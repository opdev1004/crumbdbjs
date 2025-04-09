import fsp from "fs/promises";
import path from "path";
import { Semaphore } from './semaphore.js';

export class CrumbDB
{
    constructor ()
    {
        this.semaphore = new Semaphore(1);
    }

    async insert (dirname, keyname, value, encoding = 'utf8')
    {
        await this.semaphore.acquire();

        try
        {
            await fsp.mkdir(dirname, { recursive: true });
            const filename = path.join(dirname, `${keyname}.json`);
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
            this.semaphore.release();
        }
    }

    async get (dirname, keyname, encoding = 'utf8')
    {
        await this.semaphore.acquire();
        try
        {
            const filename = path.join(dirname, `${keyname}.json`);
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
            this.semaphore.release();
        }
    }

    async remove (dirname, keyname)
    {
        await this.semaphore.acquire();
        try
        {
            const filename = path.join(dirname, `${keyname}.json`);
            await fsp.unlink(filename);
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            this.semaphore.release();
        }
    }

    async getAll (dirname, encoding = 'utf8')
    {
        await this.semaphore.acquire();
        try
        {
            const result = {};
            const files = await fsp.readdir(dirname);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles)
            {
                const filename = path.join(dirname, file);

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
            }

            return result;
        }
        catch
        {
            return {};
        }
        finally
        {
            this.semaphore.release();
        }
    }

    async getMultiple (dirname, position, count, encoding = 'utf8')
    {
        await this.semaphore.acquire();
        try
        {
            const result = {};
            const files = await fsp.readdir(dirname);
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
            const selected = jsonFiles.slice(position, position + count);

            for (const file of selected)
            {
                const filename = path.join(dirname, file);

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
            }

            return result;
        }
        catch
        {
            return {};
        }
        finally
        {
            this.semaphore.release();
        }
    }
}
