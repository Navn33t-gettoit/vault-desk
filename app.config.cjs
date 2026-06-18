/**
 * Vault Desk local server config.
 *
 * Change APP_PORT if 7423 is taken on your machine.
 * Change APP_HOST to "0.0.0.0" to expose on your local network (LAN access).
 *
 * After editing, rebuild: npm run build
 */
const APP_HOST = "127.0.0.1";
const APP_PORT = 7423;
const APP_URL = `http://${APP_HOST}:${APP_PORT}`;

module.exports = { APP_HOST, APP_PORT, APP_URL };
