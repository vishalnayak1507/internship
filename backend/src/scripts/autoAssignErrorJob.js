import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });
const queue = new Queue('auto-assign', { connection });

async function listFailedJobs() {
    const failedJobs = await queue.getFailed();
    console.log('Failed jobs:', failedJobs);
}

async function retryFailedJobs() {
    const failedJobs = await queue.getFailed();
    for (const job of failedJobs) {
        await job.retry();
        console.log(`Retried job ${job.id}`);
    }
}

async function removeFailedJobs() {
    const failedJobs = await queue.getFailed();
    for (const job of failedJobs) {
        await job.remove();
        console.log(`Removed job ${job.id}`);
    }
}

await listFailedJobs();
await retryFailedJobs();
await removeFailedJobs();