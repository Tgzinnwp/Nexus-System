const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const dataDir = path.join(__dirname, "..", "..", "data");
const productsPath = path.join(dataDir, "products.json");

let cache = null;

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadProducts() {
    if (cache) return cache;

    ensureDataDir();

    if (!fs.existsSync(productsPath)) {
        cache = {};
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(productsPath, "utf8"));
    } catch {
        cache = {};
    }

    return cache;
}

function saveProducts(products) {
    ensureDataDir();
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
}

function listActiveProducts(guildId) {
    const products = loadProducts();

    return (products[guildId] || []).filter(
        (product) => product.active !== false
    );
}

function getProduct(guildId, productId) {
    const products = loadProducts();

    return (products[guildId] || []).find(
        (product) => product.id === productId && product.active !== false
    ) || null;
}

function getProductDiscountPercent(product) {
    const discountPercent = Number(product?.descontoPercentual || 0);

    if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
        return 0;
    }

    return Math.min(99, Math.round(discountPercent));
}

function getProductPrice(product) {
    const price = Number(product?.preco);

    if (!Number.isFinite(price) || price <= 0) return 0;

    const discountPercent = getProductDiscountPercent(product);
    const discountedPrice = price * (1 - discountPercent / 100);

    return Math.max(0.01, Math.round((discountedPrice + Number.EPSILON) * 100) / 100);
}

function addProduct(guildId, productData) {
    const products = loadProducts();

    const product = {
        id: randomUUID(),
        guildId,
        active: true,
        createdAt: new Date().toISOString(),
        ...productData
    };

    products[guildId] = [
        ...(products[guildId] || []),
        product
    ];

    saveProducts(products);

    return product;
}

function removeProduct(guildId, productId) {
    const products = loadProducts();
    const guildProducts = products[guildId] || [];
    const product = guildProducts.find(
        (item) => item.id === productId && item.active !== false
    );

    if (!product) return null;

    product.active = false;
    product.removedAt = new Date().toISOString();

    saveProducts(products);

    return product;
}

function setProductDiscount(guildId, productId, discountPercent) {
    const products = loadProducts();
    const guildProducts = products[guildId] || [];
    const product = guildProducts.find(
        (item) => item.id === productId && item.active !== false
    );

    if (!product) return null;

    product.descontoPercentual = discountPercent;
    product.updatedAt = new Date().toISOString();

    saveProducts(products);

    return product;
}

function decrementStock(guildId, productId, quantity = 1) {
    const products = loadProducts();
    const guildProducts = products[guildId] || [];
    const product = guildProducts.find(
        (item) => item.id === productId && item.active !== false
    );

    if (!product) return null;
    if (product.estoque < 0) return product;
    if (product.estoque < quantity) return null;

    product.estoque -= quantity;
    product.updatedAt = new Date().toISOString();

    saveProducts(products);

    return product;
}

module.exports = {
    addProduct,
    decrementStock,
    getProduct,
    getProductDiscountPercent,
    getProductPrice,
    listActiveProducts,
    removeProduct,
    setProductDiscount
};
