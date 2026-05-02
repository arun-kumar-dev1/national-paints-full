// const dotenv = require('dotenv');
// dotenv.config(); // ✅ Load .env config

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const morgan = require('morgan');

// const dbConnect = require('./config/dbConnect');
// const { errorHandler, notFound } = require('./middlewares/errorHandler');

// // 🔗 Connect to MongoDB
// dbConnect();

// const app = express();

// // ✅ CORS Configuration
// const corsOptions = {
//   origin: [
//     "https://nationalpaints.co.in",
//     "http://localhost:3000",                     // Local frontend
//     "https://national-paints.vercel.app"         // Deployed frontend
//   ],
//   credentials: true, // Allow cookies/auth headers
// };

// app.use(cors(corsOptions));

// // ✅ Middleware
// app.use(morgan('dev'));
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(cookieParser());

// // ✅ Routes
// const employeeRouter = require('./routes/EmployeeRoutes');
// const AttendanceRouter = require('./routes/AttendanceRoutes');
// const HolidayRouter = require('./routes/HolidayRoutes');
// const ReceptionRouter = require('./routes/ReceptionRoutes');
// const HRRouter = require('./routes/HrRoutes');
// const AccountantRouter = require('./routes/AccountantRoutes');
// const AdminRouter = require('./routes/AdminRoutes');
// const TourRouter = require('./routes/TourRoutes');

// app.use('/api/employee', employeeRouter);
// app.use('/api/attendance', AttendanceRouter);
// app.use('/api/holiday', HolidayRouter);
// app.use('/api/reception', ReceptionRouter);
// app.use('/api/hr', HRRouter);
// app.use('/api/accountant', AccountantRouter);
// app.use('/api/admin', AdminRouter);
// app.use('/api/tour', TourRouter);

// // ✅ Error handlers
// app.use(notFound);
// app.use(errorHandler);

// // ✅ Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });




const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const dbConnect = require("./config/dbConnect");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const app = express();

app.use(cors({
    origin: [
    "http://localhost:3000",
    "https://national-paints-full-1.onrender.com"
  ],
  credentials: true
}));

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://national-paints-full-1.onrender.com",
    "https://national-paints-full.onrender.com",
    "https://nationalpaints.co.in",
    "https://national-paints.vercel.app"
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const employeeRouter = require("./routes/EmployeeRoutes");
const AttendanceRouter = require("./routes/AttendanceRoutes");
const HolidayRouter = require("./routes/HolidayRoutes");
const ReceptionRouter = require("./routes/ReceptionRoutes");
const HRRouter = require("./routes/HrRoutes");
const AccountantRouter = require("./routes/AccountantRoutes");
const AdminRouter = require("./routes/AdminRoutes");
const TourRouter = require("./routes/TourRoutes");

app.use("/api/employee", employeeRouter);
app.use("/api/attendance", AttendanceRouter);
app.use("/api/holiday", HolidayRouter);
app.use("/api/reception", ReceptionRouter);
app.use("/api/hr", HRRouter);
app.use("/api/accountant", AccountantRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/tour", TourRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 2000;

dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});