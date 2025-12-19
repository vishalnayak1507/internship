import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null
});

const queue = new Queue('auto-assign', { connection });

(async () => {
    await queue.obliterate({ force: true }); // This removes ALL jobs, including completed/failed
    console.log("Queue fully obliterated!");
    await connection.quit();
    process.exit(0);
})();