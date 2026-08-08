import express from "express";
import chatHandler from "../api/chat";
import runHandler from "../api/run";
import auditHandler from "../api/audit";
import autocompleteHandler from "../api/autocomplete";

export const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/api/chat", chatHandler);
app.post("/api/run", runHandler);
app.post("/api/audit", auditHandler);
app.post("/api/autocomplete", autocompleteHandler);
