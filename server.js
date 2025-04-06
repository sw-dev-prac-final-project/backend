const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

dotenv.config({ path: "./config/config.env" });

//security
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const {xss} = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

connectDB();

//mount files
const companies = require("./routes/companies");
const bookings = require('./routes/bookings')
const auth = require("./routes/auth");
const { mongo } = require("mongoose");

const app = express();
app.use(cors());

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).send({ message: 'Invalid JSON input' });
  }
  next();
});
app.use(cookieParser());

// security
// Sanitize data
// app.use(
//     mongoSanitize({
//       onSanitize: ({ req, key }) => {
//         console.warn(`This request's ${key} is sanitized`, req[key]);
//       },
//       replaceWith: '_', // Replace prohibited characters with an underscore
//     })
//   );
app.use(helmet());
app.use(xss());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000,
});
app.use(limiter);
app.use(hpp());

//swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'A simple Express VacQ API',
    },
    servers: [
      {
        url: 'http://localhost:5003/api/v1'
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//mount routes
app.use("/api/v1/companies", companies);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/companies/:companyID/bookings', bookings);
app.use("/api/v1/auth", auth);

const PORT = process.env.PORT || 5003;

const server = app.listen(
  PORT,
  console.log(
    "Server running in ",
    process.env.NODE_ENV,
    " mode on port ",
    PORT
  )
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
}); 