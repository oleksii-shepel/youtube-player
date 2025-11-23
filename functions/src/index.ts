/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

import * as functions from "firebase-functions";
import * as path from "path";
import * as fs from "fs/promises";
import { Request, Response } from "express";

const CLOUDFLARE_URL = "https://echoesplayer.club";
// Angular build folder inside functions
const PUBLIC_DIR = __dirname;

export const angularServeOrRedirect = functions.https.onRequest(
  async (req: Request, res: Response) => {
    const host = req.headers.host ?? "";

    console.log("🔥 FUNCTION TRIGGERED");
    console.log("Host:", req.headers.host);
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    
    // If request is NOT coming from your Cloudflare-managed domain → redirect
    if (!host.endsWith("echoesplayer.club")) {
      const target = `${CLOUDFLARE_URL}${req.url}`;
      console.log("➡ Redirecting to:", target);
      res.redirect(301, target);
      return;
    }

    try {
      // Map requested path to file
      console.log("➡ Serving OK");
      let filePath = path.join(PUBLIC_DIR, req.path);

      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }
      } catch {
        // File does not exist → serve index.html for SPA routing
        filePath = path.join(PUBLIC_DIR, "index.html");
      }

      const data = await fs.readFile(filePath);
      // Set correct content type
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
