import { google } from "googleapis";
import http from "http";
import { URL } from "url";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nError: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env\n" +
    "Copy them from credentials.json:\n" +
    "  GOOGLE_CLIENT_ID=<client_id>\n" +
    "  GOOGLE_CLIENT_SECRET=<client_secret>\n"
  );
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = auth.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("\nOpen this URL in your browser to authorize Google Sheets access:\n");
console.log(authUrl);
console.log("\nWaiting for redirect on http://localhost:3000 ...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("No authorization code found. Close this tab and try again.");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h2>Token generated. You can close this tab.</h2>");
  server.close();

  try {
    const { tokens } = await auth.getToken(code);
    console.log("\n✓ Authorization successful!\n");
    console.log("Your GOOGLE_REFRESH_TOKEN:\n");
    console.log(tokens.refresh_token);
    console.log("\nAdd this to your .env file:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\nAlso add it to Trigger.dev cloud secrets (dashboard → project → secrets).\n");
  } catch (err) {
    console.error("\nFailed to exchange code for token:", err.message);
    process.exit(1);
  }
});

server.listen(3000, () => {
  console.log("Local server listening on http://localhost:3000");
});
