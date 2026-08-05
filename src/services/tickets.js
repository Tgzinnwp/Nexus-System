const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const ticketsPath = path.join(dataDir, "tickets.json");

let cache = null;

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadTickets() {
    if (cache) return cache;

    ensureDataDir();

    if (!fs.existsSync(ticketsPath)) {
        cache = {};
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(ticketsPath, "utf8"));
    } catch {
        cache = {};
    }

    return cache;
}

function saveTickets(tickets) {
    ensureDataDir();
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
}

function getGuildTickets(guildId) {
    const tickets = loadTickets();
    return tickets[guildId] || {};
}

function findOpenTicketByUser(guildId, userId) {
    const guildTickets = getGuildTickets(guildId);

    return Object.values(guildTickets).find(
        (ticket) => ticket.userId === userId && ticket.status === "open"
    ) || null;
}

function getTicketByChannel(guildId, channelId) {
    const guildTickets = getGuildTickets(guildId);
    return guildTickets[channelId] || null;
}

function createTicket(guildId, channelId, userId) {
    const tickets = loadTickets();

    tickets[guildId] = tickets[guildId] || {};
    tickets[guildId][channelId] = {
        guildId,
        channelId,
        userId,
        status: "open",
        createdAt: new Date().toISOString()
    };

    saveTickets(tickets);

    return tickets[guildId][channelId];
}

function closeTicket(guildId, channelId, closedBy) {
    const tickets = loadTickets();
    const ticket = tickets[guildId]?.[channelId];

    if (!ticket || ticket.status !== "open") return null;

    ticket.status = "closed";
    ticket.closedById = closedBy;
    ticket.closedAt = new Date().toISOString();

    saveTickets(tickets);

    return ticket;
}

module.exports = {
    closeTicket,
    createTicket,
    findOpenTicketByUser,
    getTicketByChannel
};
