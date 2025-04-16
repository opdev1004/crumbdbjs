import { Semaphore } from './semaphore.js';

export function getFileLock (filename, fileLocks)
{
    if (!fileLocks.has(filename))
    {
        fileLocks.set(filename, new Semaphore(1));
    }
    return fileLocks.get(filename);
}