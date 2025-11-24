import { setGlobalOptions } from "firebase-functions";
setGlobalOptions({ maxInstances: 10 });

import * as functions from "firebase-functions";
import * as path from "path";
import * as fs from "fs/promises";
import { Request, Response } from "express";

const CLOUDFLARE_URL = "https://echoesplayer.club";
const PROJECT_ID = "echoes-player-1bb88";
const PUBLIC_DIR = __dirname;

const REDIRECT_DOMAINS = [
    `${PROJECT_ID}.web.app`,
    `${PROJECT_ID}.firebaseapp.com`,
];

export const angularServeOrRedirect = functions.https.onRequest(
    async (req: Request, res: Response) => {
        const host = req.headers.host ?? "";

        console.log("🔥 FUNCTION TRIGGERED");
        console.log("Host:", host);
        console.log("URL:", req.url);
        console.log("cf-client-cert-verified:", req.headers['cf-client-cert-verified'] || "Missing");
        console.log("public dir:", PUBLIC_DIR);

        const shouldRedirect = REDIRECT_DOMAINS.includes(host);

        if (shouldRedirect) {
            // Check if request is verified by Cloudflare's mTLS
            const isFromCloudflare = req.headers['cf-client-cert-verified'] === 'SUCCESS';

            if (isFromCloudflare) {
                console.log("➡ Request from Cloudflare (mTLS verified) - serving content");
                // Continue to serve content below
            } else {
                // Direct user access or unverified request - redirect to custom domain
                const target = `${CLOUDFLARE_URL}${req.url}`;
                console.log("➡ Direct user access - redirecting to:", target);
                res.redirect(301, target);
                return;
            }
        }

        console.log("➡ Serving content");

        try {
            let filePath = path.join(PUBLIC_DIR, req.path);

            try {
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                    filePath = path.join(filePath, "index.html");
                }
            } catch {
                filePath = path.join(PUBLIC_DIR, "index.html");
            }

            const data = await fs.readFile(filePath);
            
            if (filePath.endsWith(".html")) res.set("Content-Type", "text/html");
            else if (filePath.endsWith(".js")) res.set("Content-Type", "application/javascript");
            else if (filePath.endsWith(".css")) res.set("Content-Type", "text/css");
            else if (filePath.endsWith(".json")) res.set("Content-Type", "application/json");
            else if (filePath.endsWith(".ico")) res.set("Content-Type", "image/x-icon");
            else if (filePath.endsWith(".png")) res.set("Content-Type", "image/png");
            else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.set("Content-Type", "image/jpeg");

            res.send(data);
        } catch (err) {
            console.error("Error serving file:", err);
            res.status(500).send("Internal Server Error");
        }
    }
);