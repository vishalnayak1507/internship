import express from  "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// import helmet from 'helmet';
// import morgan from 'morgan';
import dotenv from 'dotenv';

import dashboardRoutes from './routes/admin/dashboardRoutes.js';
import analystTicketRoutes from './routes/analyst/analystticketdetailsRoutes.js';
import adminticketDiscussionRoutes from './routes/admin/adminticketdiscussionRoute.js';
dotenv.config();

const app = express();

// app.use(helmet());
// app.use(cors());
// app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

// Add logging middleware for auth routes
app.use('/api/auth/logout', (req, res, next) => {
  console.log('Logout request received:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Cookies:', req.cookies);
  next();
});
// app.use(express.urlencoded({ extended: true }));


// Routes
app.use(cors({
    origin : process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials : true
}));

// Add dashboard routes
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/analysttickets', analystTicketRoutes);

app.use('/api/ticketdiscussion', adminticketDiscussionRoutes);
import { errorHandler } from '../src/middlewares/errorMiddleware.js';



// // Global error handler
app.use(errorHandler);

export {app} ;