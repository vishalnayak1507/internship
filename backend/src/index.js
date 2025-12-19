import dotenv from 'dotenv'
import path from 'path';
import connectDB from "./db/index.js";
import express from "express"
import { watchNewAnalysts } from './scripts/autoAssignRebalancing.js';
import './scripts/autoAssignWorker.js'
import './scripts/autoAssignRequeue.js'
import { Server } from 'socket.io';
import http from 'http';
import { app } from './app.js'
import { fileURLToPath } from 'url';
import authRoutes from "./routes/auth/authRoutes.js"
import makerRoute from "./routes/maker/makerRoute.js"
import uploadRoute from "./routes/admin/upload.js";
import manualEntryRoutes from "./routes/maker/manualEntryRoutes.js";
import adminRoute from "./routes/admin/adminRoute.js"
import analystRoute from "./routes/analyst/analystRoute.js"
import departmentRoutes from "./routes/admin/departmentRoutes.js";
import adminTicketRoutes from "./routes/admin/adminTicketRoutes.js";
import canUploadRoutes from './routes/admin/canuploadRoutes.js';
import "./scripts/autoClosureTicket.js";
import "./scripts/slaBreachCron.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";
import customerRoute from "./routes/maker/customerRoute.js";

dotenv.config({
    path: './.env'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

app.set('io', io); //set io instance in express app for later use

// Set up socket connection handlers
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join analyst room
    socket.on("joinAnalystRoom", (analystId, callback) => {
        socket.join(`analyst-${analystId}`);
        if (callback) {
            callback({ success: true, message: "Joined analyst room" });
        }
    });

    // Ping for testing
    socket.on('ping', (message) => {
        console.log(`Received ping with message: ${message}`);
        socket.emit('pong', 'Connection working');
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use("/api/auth", authRoutes);
app.use("/api/auth/", makerRoute);
app.use("/api/auth/analyst", analystRoute);
app.use("/api/auth/", adminRoute);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/users', canUploadRoutes);
app.use('/api/upload', uploadRoute);
app.use("/api/auth", manualEntryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin/tickets", adminTicketRoutes);
app.use("/api", customerRoute);
app.use("/api/customer", customerRoute);

export { io };

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server is runnning on : ${process.env.PORT}`);
            watchNewAnalysts();
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed...!!!", err);
    })