export class Semaphore
{
    constructor (maxConcurrent)
    {
        this.maxConcurrent = maxConcurrent;
        this.count = 0;
        this.waitingQueue = [];

    }

    async acquire ()
    {
        if (this.count < this.maxConcurrent)
        {
            this.count++;
            return;
        }

        return new Promise((resolve) => this.waitingQueue.push(resolve));
    }


    async release () 
    {
        if (this.waitingQueue.length > 0) 
        {
            const resolve = this.waitingQueue.shift();
            resolve();
        }
        else 
        {
            this.count--;
        }
    }
};