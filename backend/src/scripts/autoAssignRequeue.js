import { autoAssignQueue } from "./autoAssignQueue.js";

async function requeueFailedJobs() {
    await autoAssignQueue.pause();
    const failedJobs = await autoAssignQueue.getFailed(0,-1);
    let requeued = 0;
    for (const job of failedJobs){
        if(
            job.failedReason.includes("No active or free analysts found in department") ||
            job.failedReason.includes("No analysts available") ||
            job.failedReason?.includes("NoAnalystAvailableError") ||
            job.failedReason?.includes("No active or free analysts found") ||
            job.failedReason?.includes("Database connection error") ||
            job.failedReason?.includes("MongoNetworkError") ||
            job.failedReason?.includes("MongoServerError") ||
            job.failedReason?.includes("MongooseError") ||
            job.failedReason?.includes("MongoError")
        ) {
            await autoAssignQueue.add('assign', job.data, {
                attempts: 1,
                priority: job.opts.priority || 2,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
            });
            await job.remove();
            requeued++;
        }
        console.log(`Requeued job ${job.id} with data:`, job.data); 
    }
    await autoAssignQueue.resume();
}
setInterval(() => {requeueFailedJobs().catch(console.error)}, 30000);