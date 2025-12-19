import { Queue } from "bullmq";
import IORedis from "ioredis";

// Nodejs app is running on windows while Redis is on WSL,using localhost and port 6379
const connection = new IORedis({
    host : '127.0.0.1', // or 'localhost'
    port: 6379,
    maxRetriesPerRequest: null
})

export const autoAssignQueue = new Queue('auto-assign', {connection});