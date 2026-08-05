const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const dataDir = path.join(__dirname, "..", "..", "data");
const giveawaysPath = path.join(dataDir, "giveaways.json");

let cache = null;

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadGiveaways() {
    if (cache) return cache;

    ensureDataDir();

    if (!fs.existsSync(giveawaysPath)) {
        cache = {};
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
    } catch {
        cache = {};
    }

    return cache;
}

function saveGiveaways(giveaways) {
    ensureDataDir();
    fs.writeFileSync(giveawaysPath, JSON.stringify(giveaways, null, 2));
}

function createGiveaway(data) {
    const giveaways = loadGiveaways();
    const id = randomUUID();

    giveaways[id] = {
        id,
        status: "open",
        participants: [],
        createdAt: new Date().toISOString(),
        ...data
    };

    saveGiveaways(giveaways);
    return giveaways[id];
}

function getGiveaway(id) {
    const giveaways = loadGiveaways();
    return giveaways[id] || null;
}

function updateGiveaway(id, updates) {
    const giveaways = loadGiveaways();

    if (!giveaways[id]) return null;

    giveaways[id] = {
        ...giveaways[id],
        ...updates
    };

    saveGiveaways(giveaways);
    return giveaways[id];
}

function addParticipant(id, userId) {
    const giveaways = loadGiveaways();
    const giveaway = giveaways[id];

    if (!giveaway || giveaway.status !== "open") return null;

    if (!giveaway.participants.includes(userId)) {
        giveaway.participants.push(userId);
        saveGiveaways(giveaways);
    }

    return giveaway;
}

function finishGiveaway(id) {
    const giveaways = loadGiveaways();
    const giveaway = giveaways[id];

    if (!giveaway || giveaway.status !== "open") return null;

    giveaway.status = "closed";
    giveaway.endedAt = new Date().toISOString();
    giveaway.winnerId = giveaway.participants.length
        ? giveaway.participants[
            Math.floor(Math.random() * giveaway.participants.length)
        ]
        : null;

    saveGiveaways(giveaways);
    return giveaway;
}

function listOpenGiveaways() {
    const giveaways = loadGiveaways();

    return Object.values(giveaways).filter(
        (giveaway) => giveaway.status === "open"
    );
}

module.exports = {
    addParticipant,
    createGiveaway,
    finishGiveaway,
    getGiveaway,
    listOpenGiveaways,
    updateGiveaway
};
