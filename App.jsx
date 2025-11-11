import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart, LineElement, BarElement, CategoryScale, LinearScale,
  PointElement, Tooltip, Legend,
} from "chart.js";
Chart.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function App() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const socket = io("http://localhost:8080");

  useEffect(() => {
    socket.on("init", (data) => setStats(data));
    socket.on("update", (data) => {
      setStats(data);
      setHistory((h) => [...h.slice(-60), data]);
    });
    return () => socket.disconnect();
  }, []);

  if (!stats) return <h2 style={{ textAlign: "center", marginTop: 100, color: "#aaa" }}>Loading...</h2>;

  const labels = history.map((d) => new Date(d.ts).toLocaleTimeString().split(" ")[0]);

  const container = { padding: 30, minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff", fontFamily: "Segoe UI, sans-serif" };
  const title = { textAlign: "center", fontSize: "32px", fontWeight: 800, background: "linear-gradient(90deg,#38bdf8,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 };
  const subtitle = { textAlign: "center", color: "#9aa4b2", marginTop: 6, marginBottom: 30 };
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginBottom: 28 };
  const card = { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, textAlign: "center", boxShadow: "0 4px 10px rgba(0,0,0,.3)" };
  const charts = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 28 };
  const box = { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, boxShadow: "0 4px 10px rgba(0,0,0,.3)" };
  const val = (c)=>({ fontSize: 26, fontWeight: 800, color: c, marginTop: 8 });

  return (
    <div style={container}>
      <h1 style={title}>🌐 Real-Time Analytics Dashboard (MongoDB)</h1>
      <p style={subtitle}>Node.js • React • MongoDB • Socket.IO</p>

      <div style={grid}>
        <div style={card}><h3>Events/sec</h3><div style={val("#4ade80")}>{stats.rate_1s}</div></div>
        <div style={card}><h3>Active Users</h3><div style={val("#38bdf8")}>{stats.activeUsers}</div></div>
        <div style={card}><h3>Rate (5s avg)</h3><div style={val("#f97316")}>{stats.rate_5s.toFixed(2)}</div></div>
        <div style={card}><h3>Rate (60s avg)</h3><div style={val("#facc15")}>{stats.rate_60s.toFixed(2)}</div></div>
      </div>

      <div style={charts}>
        <div style={box}>
          <h2 style={{ marginTop: 0, color: "#cbd5e1" }}>📈 Events Over Time</h2>
          <Line data={{ labels, datasets: [{ label: "Events/sec", data: history.map(h=>h.rate_1s), borderColor: "#38bdf8", tension: .3 }] }}
                options={{ responsive: true, plugins:{ legend:{ labels:{ color:"#fff" } } }, scales:{ x:{ ticks:{ color:"#bbb" }}, y:{ ticks:{ color:"#bbb" }}} }} />
        </div>
        <div style={box}>
          <h2 style={{ marginTop: 0, color: "#cbd5e1" }}>📊 Top Routes (60s)</h2>
          <Bar data={{ labels: (stats.topRoutes||[]).map(r=>r[0]), datasets:[{ label:"Top Routes", data:(stats.topRoutes||[]).map(r=>r[1]), backgroundColor: "#facc15" }] }}
               options={{ responsive: true, plugins:{ legend:{ labels:{ color:"#fff" } } }, scales:{ x:{ ticks:{ color:"#bbb" }}, y:{ ticks:{ color:"#bbb" }}} }} />
        </div>
      </div>
    </div>
  );
}
