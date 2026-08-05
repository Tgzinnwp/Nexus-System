const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const dataDir = path.join(__dirname, "..", "..", "data");
const ordersPath = path.join(dataDir, "orders.json");

let cache = null;

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadOrders() {
    if (cache) return cache;

    ensureDataDir();

    if (!fs.existsSync(ordersPath)) {
        cache = {};
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    } catch {
        cache = {};
    }

    return cache;
}

function saveOrders(orders) {
    ensureDataDir();
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

function createOrder(orderData) {
    const orders = loadOrders();
    const id = randomUUID();

    orders[id] = {
        id,
        status: "pending",
        quantity: 1,
        createdAt: new Date().toISOString(),
        ...orderData
    };

    saveOrders(orders);
    return orders[id];
}

function getOrder(orderId) {
    const orders = loadOrders();
    return orders[orderId] || null;
}

function updateOrder(orderId, updates) {
    const orders = loadOrders();

    if (!orders[orderId]) return null;

    orders[orderId] = {
        ...orders[orderId],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveOrders(orders);
    return orders[orderId];
}

function listPendingOrders() {
    const orders = loadOrders();

    return Object.values(orders).filter(
        (order) => order.status === "pending" && (order.paymentId || order.preferenceId)
    );
}

module.exports = {
    createOrder,
    getOrder,
    listPendingOrders,
    updateOrder
};
