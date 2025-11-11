import fetch from "node-fetch";

setInterval(async () => {
  const routes = ["/home", "/login", "/products", "/checkout", "/about"];
  const route = routes[Math.floor(Math.random() * routes.length)];
  await fetch("http://localhost:8080/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: "e" + Date.now(),
      ts: Date.now(),
      userId: "u" + Math.ceil(Math.random() * 5),
      sessionId: "s" + Math.ceil(Math.random() * 10),
      route,
      action: Math.random() > 0.9 ? "error" : "click",
    }),
  });
  console.log("✅ Sent:", route);
}, 300);
