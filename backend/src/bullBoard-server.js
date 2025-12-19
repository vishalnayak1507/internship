import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import express from "express";
import { autoAssignQueue } from "./scripts/autoAssignQueue.js";

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [new BullMQAdapter(autoAssignQueue)],
    serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.listen(3001, () => {
    console.log("Bull Board is running on http://localhost:3001/admin/queues");
});