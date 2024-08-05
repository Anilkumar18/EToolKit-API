import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, printf } = format;

const logFormat = combine(
    // winston.format.colorize(),
    timestamp(),
    printf(info => `${[info.timestamp]} - ${[info.level]} : ${info.message}`),
);

const transport = new DailyRotateFile({
    filename: 'logs/apiLogs-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    // zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    prepend: true,
});

transport.on("rotate", function (oldFilename, newFilename) {
    // call function like upload to s3 or on cloud
});


export const serverLog = createLogger({
    format: logFormat,
    transports: [
        transport
    ]
})