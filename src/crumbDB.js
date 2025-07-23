import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import yazl from "yazl";
import yauzl from 'yauzl';
import { pipeline } from "stream";
import { promisify } from "util";
import { getFileLock } from './getFileLock.js';
import { fileExists } from './fsHelper.js';
import { Semaphore } from './semaphore.js';

const pipelineAsync = promisify(pipeline);

export class CrumbDB
{
    constructor(iomax = 512)
    {
        this.fileLocks = new Map();
        this.ioSemaphore = new Semaphore(iomax);
    }

    async add(dirname, databasename, collectionname, documentname, value, encoding = 'utf8')
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${ documentname }.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();
        await this.ioSemaphore.acquire();

        try
        {
            await fsp.mkdir(collectionDirname, { recursive: true });

            if (await fileExists(filename)) return false;

            await fsp.writeFile(filename, value, encoding);
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            await this.ioSemaphore.release();
            await lock.release();
        }
    }


    async update(dirname, databasename, collectionname, documentname, value, encoding = 'utf8')
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${ documentname }.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();
        await this.ioSemaphore.acquire();

        try
        {
            await fsp.mkdir(collectionDirname, { recursive: true });

            if (await fileExists(filename))
            {
                await fsp.writeFile(filename, value, encoding);
                return true;
            }
            else
            {
                return false;
            }
        }
        catch
        {
            return false;
        }
        finally
        {
            await this.ioSemaphore.release();
            await lock.release();
        }
    }

    async get(dirname, databasename, collectionname, documentname, encoding = 'utf8')
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${ documentname }.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();
        await this.ioSemaphore.acquire();

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
            await this.ioSemaphore.release();
            await lock.release();
        }
    }

    async remove(dirname, databasename, collectionname, documentname)
    {
        const collectionDirname = path.join(dirname, databasename, collectionname);
        const filename = path.join(collectionDirname, `${ documentname }.json`);
        const lock = getFileLock(filename, this.fileLocks);
        await lock.acquire();
        await this.ioSemaphore.acquire();

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
            await this.ioSemaphore.release();
            await lock.release();
        }
    }

    async getAll(dirname, databasename, collectionname, encoding = 'utf8')
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
                await this.ioSemaphore.acquire();

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
                    await this.ioSemaphore.release();
                    await lock.release();
                }
            }

            return result;
        }
        catch
        {
            return {};
        }
    }

    async getMultiple(dirname, databasename, collectionname, position, count, encoding = 'utf8')
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
                await this.ioSemaphore.acquire();

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
                    await this.ioSemaphore.release();
                    await lock.release();
                }
            }

            return result;
        }
        catch
        {
            return {};
        }
    }

    async backup(sourceDir, zipPath)
    {
        try
        {
            await fsp.rm(zipPath, { force: true });

            const zipfile = new yazl.ZipFile();
            const writeStream = fs.createWriteStream(zipPath);
            const zipEnd = new Promise((resolve, reject) =>
            {
                zipfile.outputStream.pipe(writeStream).on('close', resolve).on('error', reject);
            });

            const walkAndAdd = async (dir) =>
            {
                const items = await fsp.readdir(dir, { withFileTypes: true });
                for (const item of items)
                {
                    const fullPath = path.join(dir, item.name);
                    const relPath = path.relative(sourceDir, fullPath);

                    if (item.isDirectory())
                    {
                        await walkAndAdd(fullPath);
                    }
                    else if (item.name.endsWith('.json'))
                    {
                        const lock = getFileLock(fullPath, this.fileLocks);
                        await lock.acquire();
                        await this.ioSemaphore.acquire();

                        try
                        {
                            const content = await fsp.readFile(fullPath);
                            zipfile.addBuffer(content, relPath);
                        }
                        finally
                        {
                            await this.ioSemaphore.release();
                            await lock.release();
                        }
                    }
                }
            }

            await walkAndAdd(sourceDir);
            zipfile.end();

            await zipEnd;
            return true;
        }
        catch (error)
        {
            return false;
        }
    }

    async restore(zipPath, destDir)
    {
        return new Promise((resolve, reject) =>
        {
            yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) =>
            {
                if (err) return reject(err);

                zipfile.readEntry();

                zipfile.on("entry", async (entry) =>
                {
                    if (/\/$/.test(entry.fileName))
                    {
                        const dirPath = path.join(destDir, entry.fileName);
                        await fsp.mkdir(dirPath, { recursive: true });
                        zipfile.readEntry();
                        return;
                    }

                    const destPath = path.join(destDir, entry.fileName);
                    const lock = getFileLock(destPath, this.fileLocks);
                    await lock.acquire();
                    await this.ioSemaphore.acquire();

                    try
                    {
                        await fsp.mkdir(path.dirname(destPath), { recursive: true });

                        zipfile.openReadStream(entry, async (err, readStream) =>
                        {
                            if (err)
                            {
                                await this.ioSemaphore.release();
                                await lock.release();
                                return reject(err);
                            }

                            const writeStream = fs.createWriteStream(destPath);
                            try
                            {
                                await pipelineAsync(readStream, writeStream);
                            }
                            catch (streamErr)
                            {
                                await this.ioSemaphore.release();
                                await lock.release();
                                return reject(streamErr);
                            }

                            await this.ioSemaphore.release();
                            await lock.release();
                            zipfile.readEntry();
                        });
                    }
                    catch (e)
                    {
                        await this.ioSemaphore.release();
                        await lock.release();
                        return reject(e);
                    }
                });

                zipfile.on("end", () => resolve(true));
                zipfile.on("error", reject);
            });
        }).catch(() => false);
    }

}