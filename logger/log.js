const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

var logger = createLogger({
  format: combine(label({ label: "LOG" }), timestamp(), myFormat),
  transports: [
    new transports.Console({ json: false, timestamp: true }),
    new transports.File({
      filename: "../webapp.log",
      json: false,
      timestamp: true
    })
  ],
  exceptionHandlers: [
    new transports.Console({ json: false, timestamp: true }),
    new transports.File({
      filename: "../webapp.log",
      json: false,
      timestamp: true
    })
  ],
  exitOnError: false
});

module.exports = logger;
