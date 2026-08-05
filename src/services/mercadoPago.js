const API_BASE_URL = "https://api.mercadopago.com";

function getAccessToken() {
    return process.env.MP_ACCESS_TOKEN?.trim();
}

function assertAccessToken() {
    const accessToken = getAccessToken();

    if (!accessToken) {
        throw new Error("MP_ACCESS_TOKEN nao configurado no .env.");
    }

    return accessToken;
}

async function mercadoPagoRequest(path, options = {}) {
    const accessToken = assertAccessToken();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message = data?.message || data?.error || response.statusText;
        throw new Error(`Mercado Pago API ${response.status}: ${message}`);
    }

    return data;
}

async function createPreference(order, product) {
    const body = {
        items: [
            {
                id: product.id,
                title: product.nome,
                description: product.descricao || undefined,
                quantity: order.quantity,
                currency_id: "BRL",
                unit_price: Number(order.amount) / Number(order.quantity || 1)
            }
        ],
        external_reference: order.id,
        metadata: {
            order_id: order.id,
            guild_id: order.guildId,
            user_id: order.userId,
            product_id: product.id
        },
        payment_methods: {}
    };

    if (process.env.MP_DEFAULT_PAYMENT_METHOD) {
        body.payment_methods.default_payment_method_id =
            process.env.MP_DEFAULT_PAYMENT_METHOD;
    }

    if (process.env.MP_WEBHOOK_URL) {
        body.notification_url = process.env.MP_WEBHOOK_URL;
    }

    if (process.env.MP_SUCCESS_URL || process.env.MP_PENDING_URL || process.env.MP_FAILURE_URL) {
        body.back_urls = {
            success: process.env.MP_SUCCESS_URL || undefined,
            pending: process.env.MP_PENDING_URL || undefined,
            failure: process.env.MP_FAILURE_URL || undefined
        };
    }

    return mercadoPagoRequest("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify(body)
    });
}

function buildGeneratedPayerEmail(order) {
    const domain = process.env.MP_PIX_PAYER_EMAIL_DOMAIN || "example.com";
    return `discord-${order.userId}-${order.guildId}@${domain}`;
}

async function createPixPayment(order, product) {
    const expirationMinutes = Number(process.env.MP_PIX_EXPIRATION_MINUTES || 30);
    const expirationDate = new Date(
        Date.now() + expirationMinutes * 60 * 1000
    ).toISOString();

    const body = {
        transaction_amount: Number(order.amount),
        description: product.nome,
        payment_method_id: "pix",
        external_reference: order.id,
        date_of_expiration: expirationDate,
        payer: {
            email: process.env.MP_PIX_PAYER_EMAIL || buildGeneratedPayerEmail(order)
        },
        metadata: {
            order_id: order.id,
            guild_id: order.guildId,
            user_id: order.userId,
            product_id: product.id
        }
    };

    if (process.env.MP_WEBHOOK_URL) {
        body.notification_url = process.env.MP_WEBHOOK_URL;
    }

    return mercadoPagoRequest("/v1/payments", {
        method: "POST",
        headers: {
            "X-Idempotency-Key": order.id
        },
        body: JSON.stringify(body)
    });
}

async function getPayment(paymentId) {
    return mercadoPagoRequest(`/v1/payments/${paymentId}`);
}

async function searchPaymentsByExternalReference(externalReference) {
    const params = new URLSearchParams({
        sort: "date_created",
        criteria: "desc",
        external_reference: externalReference,
        range: "date_created",
        limit: "10"
    });

    return mercadoPagoRequest(`/v1/payments/search?${params.toString()}`);
}

function getPreferenceCheckoutUrl(preference) {
    if (process.env.MP_USE_SANDBOX === "true") {
        return preference.sandbox_init_point || preference.init_point;
    }

    return preference.init_point || preference.sandbox_init_point;
}

module.exports = {
    createPixPayment,
    createPreference,
    getPayment,
    getPreferenceCheckoutUrl,
    searchPaymentsByExternalReference
};
