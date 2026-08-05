const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const configPath = path.join(dataDir, "guild-configs.json");

let cache = null;

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadConfigs() {
    if (cache) return cache;

    ensureDataDir();

    if (!fs.existsSync(configPath)) {
        cache = {};
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
        cache = {};
    }

    return cache;
}

function saveConfigs(configs) {
    ensureDataDir();
    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
}

function getGuildConfig(guildId) {
    const configs = loadConfigs();
    return configs[guildId] || {};
}

function updateGuildConfig(guildId, updates) {
    const configs = loadConfigs();

    configs[guildId] = {
        ...(configs[guildId] || {}),
        ...updates
    };

    saveConfigs(configs);
    return configs[guildId];
}

module.exports = {
    getGuildConfig,
    updateGuildConfig
};
