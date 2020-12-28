import express, { Application, Request, Response, NextFunction } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import https, { ServerOptions } from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../.env') });

const isProduction: boolean = process.env.NODE_ENV === 'production';
const app: Application = express();
const httpPort: number = Number(process.env.HTTP_PORT) || 80;

if (!existsSync(join(__dirname, '../../client/build'))) {
    console.error('Client build directory does not exist.');
    process.exit();
}

app.all('*', async (req: Request, res: Response, next: NextFunction) => {
    if (req.secure || !isProduction) return next();
    res.redirect(307, `https://${req.hostname}${req.url}`);
});

app.use(express.static(join(__dirname, '../../client/build')));

app.get('*', async (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '../../client/build/index.html'));
});

console.log(`Initializing server in ${process.env.NODE_ENV} mode.`);

if (isProduction) {
    const httpsPort: number = Number(process.env.HTTPS_PORT) || 443;

    const keyFile: string = process.env.SSL_KEY_FILE || '';
    const certFile: string = process.env.SSL_CERT_FILE || '';
    const caFile: string = process.env.SSL_CA_FILE || '';

    const key: Buffer = readFileSync(join(__dirname, keyFile));
    const cert: Buffer = readFileSync(join(__dirname, certFile));
    const ca: Buffer = readFileSync(join(__dirname, caFile));
    const options: ServerOptions = { key, cert, ca };
    https.createServer(options, app).listen(httpsPort, () => console.log(`HTTPS server created on port ${httpsPort}.`));
}

http.createServer(app).listen(httpPort, () => console.log(`HTTP server created on port ${httpPort}.`));
