import 'dotenv/config';
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";

const PORT = Number(process.env.PORT || 8080);
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/realtime_dashboard";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

await mongoose.connect(MONGO_URL);
console.log("✅ Connected to MongoDB");

const EventSchema = new mongoose.Schema({
  eventId: { type: String, index: true },
  userId: String,
  sessionId: String,
  route: String,
  action: String,
  ts: Number
}, { timestamps: true });
EventSchema.index({ ts: -1 });
const EventModel = mongoose.model("event", EventSchema);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "200kb" }));

let events = [];
const MAX_EVENTS = 5000;

function validateEvent(ev) {
  return ev && ev.eventId && ev.userId && ev.sessionId && ev.route && ev.action && ev.ts;
}

function getStats() {
  const now = Date.now();
  const last60s = events.filter((e) => now - e.ts < 60000);
  const last5s = events.filter((e) => now - e.ts < 5000);
  const routes = {};
  for (let e of last60s) routes[e.route] = (routes[e.route] || 0) + 1;
  return {
    ts: now,
    rate_1s: events.filter((e) => now - e.ts < 1000).length,
    rate_5s: last5s.length / 5,
    rate_60s: last60s.length / 60,
    activeUsers: new Set(last60s.map((e) => e.sessionId)).size,
    topRoutes: Object.entries(routes).sort((a, b) => b[1] - a[1]).slice(0, 5)
  };
}

app.post("/api/ingest", async (req, res) => {
  const ev = req.body;
  if (!validateEvent(ev)) return res.status(400).json({ error: "Invalid event" });
  events.push(ev);
  if (events.length > MAX_EVENTS) events.shift();
  try { await EventModel.create(ev); } catch {}
  io.emit("update", getStats());
  res.json({ ok: true });
});

app.get("/api/events", async (_req, res) => {
  const rows = await EventModel.find().sort({ ts: -1 }).limit(50).lean();
  res.json(rows);
});

app.get("/api/stats", (_req, res) => res.json(getStats()));

io.on("connection", (socket) => {
  socket.emit("init", getStats());
  socket.on("event", async (ev) => {
    if (!validateEvent(ev)) return;
    ev.ts = Date.now();
    events.push(ev);
    if (events.length > MAX_EVENTS) events.shift();
    try { await EventModel.create(ev); } catch {}
    io.emit("update", getStats());
  });
});

server.listen(PORT, () => console.log(🚀 Server on http://localhost:${PORT}));
