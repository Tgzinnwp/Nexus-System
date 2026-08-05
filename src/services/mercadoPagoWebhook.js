const crypto = require("node:crypto");
const http = require("node:http");

const logger = require("../utils/logger");
const { handlePaymentNotification } = require("./paymentFulfillment");

function parseSignatureHeader(value) {
    return String(value || "")
        .split(",")
        .reduce((acc, part) => {
            const [key, signatureValue] = part.split("=");
            if (key && signatureValue) {
                acc[key.trim()] = signatureValue.trim();
            }
            return acc;
        }, {});
}

function isValidWebhookSignature(request, url) {
    const secret = process.env.MP_WEBHOOK_SECRET?.trim();
    if (!secret) return true;

    const signature = parseSignatureHeader(request.headers["x-signature"]);
    const requestId = request.headers["x-request-id"];
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id");

    if (!signature.ts || !signature.v1 || !requestId || !dataId) return false;

    const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
    const expected = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature.v1);

    if (expectedBuffer.length !== receivedBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        let raw = "";

        request.on("data", (chunk) => {
            raw += chunk;
        });

        request.on("end", () => {
            if (!raw) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(error);
            }
        });

        request.on("error", reject);
    });
}

function startMercadoPagoWebhookServer(client) {
    const port = Number(process.env.MP_WEBHOOK_PORT || 0);
    if (!port) return;

    const path = process.env.MP_WEBHOOK_PATH || "/mercadopago/webhook";

    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, `http://${request.headers.host}`);

        if (request.method !== "POST" || url.pathname !== path) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        if (!isValidWebhookSignature(request, url)) {
            response.writeHead(401);
            response.end("Invalid signature");
            return;
        }

        try {
            const body = await readJsonBody(request);
            const type = body.type || url.searchParams.get("type");
            const paymentId =
                body.data?.id ||
                url.searchParams.get("data.id") ||
                url.searchParams.get("data_id");

            response.writeHead(200);
            response.end("OK");

            if (type === "payment" && paymentId) {
                await handlePaymentNotification(client, paymentId);
            }
        } catch (error) {
            logger.error(`Erro no webhook Mercado Pago: ${error.stack}`);
        }
    });

    server.on("error", (error) => {
        logger.error(`Falha ao iniciar webhook Mercado Pago: ${error.message}`);
    });

    server.listen(port, () => {
        logger.success(`Webhook Mercado Pago ouvindo em ${path} na porta ${port}.`);
    });
}

module.exports = {
    startMercadoPagoWebhookServer
};
