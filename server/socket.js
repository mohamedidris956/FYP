const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const FanMessage = require("./models/FanMessage");
const {
  applyProfanityFilter,
  sanitizeMessage,
  isMuted
} = require("./utils/chatModeration");

const ALLOWED_REACTIONS = ["👍", "❤️", "😂"];

function sanitizeOutgoingMessage(m) {
  return {
    ...m,
    reactions: {
      "👍": Array.isArray(m?.reactions?.["👍"]) ? m.reactions["👍"].length : 0,
      "❤️": Array.isArray(m?.reactions?.["❤️"]) ? m.reactions["❤️"].length : 0,
      "😂": Array.isArray(m?.reactions?.["😂"]) ? m.reactions["😂"].length : 0
    }
  };
}

function parseAllowedOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

module.exports = function initSocket(server) {
  const allowedOrigins = parseAllowedOrigins();

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS not allowed for socket origin"));
      },
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || "").replace("Bearer ", "");

      if (!rawToken) return next(new Error("Not authorized"));

      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role mutedUntil");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
  socket.emit("fanhub:self", {
    id: String(socket.user._id),
    role: socket.user.role,
    mutedUntil: socket.user.mutedUntil
  });

  // Toggle reaction
socket.on("fanhub:react", async ({ messageId, emoji } = {}) => {
  try {
    if (!messageId || !ALLOWED_REACTIONS.includes(emoji)) return;

    const msg = await FanMessage.findById(messageId);
    if (!msg) return;

    const uid = String(socket.user._id);
    const arr = Array.isArray(msg.reactions?.[emoji]) ? msg.reactions[emoji] : [];

    const idx = arr.indexOf(uid);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(uid);

    msg.reactions[emoji] = arr;
    msg.markModified("reactions");
    await msg.save();

    const full = await FanMessage.findById(msg._id)
      .populate("user", "name role")
      .lean();

    io.emit("fanhub:updated", sanitizeOutgoingMessage(full));
  } catch (err) {
    console.error("Reaction error:", err.message);
    socket.emit("fanhub:error", { message: "Could not update reaction" });
  }
});

// Pin/unpin message (admin only)
// Rule: only ONE message can be pinned at a time.
socket.on("fanhub:pin", async ({ messageId, pin } = {}) => {
  try {
    if (socket.user.role !== "admin") {
      return socket.emit("fanhub:error", { message: "Admin only" });
    }
    if (!messageId) return;

    const msg = await FanMessage.findById(messageId);
    if (!msg) return;

    // If pinning this message, unpin all other currently pinned messages first
    if (pin) {
      await FanMessage.updateMany(
        { pinned: true, _id: { $ne: msg._id } },
        { $set: { pinned: false, pinnedAt: null, pinnedBy: null } }
      );
    }

    // Apply pin/unpin to selected message
    msg.pinned = !!pin;
    msg.pinnedAt = pin ? new Date() : null;
    msg.pinnedBy = pin ? socket.user._id : null;
    await msg.save();

    // Broadcast full refreshed history so all clients instantly reflect
    // removed old pins + new pin state.
    const history = await FanMessage.find({})
      .sort({ createdAt: -1 })
      .limit(120)
      .populate("user", "name role")
      .lean();

    const normalized = history
      .map(sanitizeOutgoingMessage)
      .reverse();

    io.emit("fanhub:history", normalized);
  } catch (err) {
    console.error("Pin error:", err.message);
    socket.emit("fanhub:error", { message: "Could not update pin" });
  }
});

  // Typing relay events
  socket.on("fanhub:typing", () => {
    socket.broadcast.emit("fanhub:typing", { name: socket.user.name });
  });

  socket.on("fanhub:stop-typing", () => {
    socket.broadcast.emit("fanhub:stop-typing", { name: socket.user.name });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("fanhub:stop-typing", { name: socket.user.name });
  });

    try {
const history = await FanMessage.find({})
  .sort({ createdAt: -1 })
  .limit(120)
  .populate("user", "name role")
  .lean();

const normalized = history
  .map(sanitizeOutgoingMessage)
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

socket.emit("fanhub:history", normalized);
    } catch (err) {
      console.error("History error:", err.message);
    }

    socket.on("fanhub:send", async (payload = {}) => {
      try {
        // reload user for fresh mute status
        const freshUser = await User.findById(socket.user._id).select("name role mutedUntil");
        if (!freshUser) return socket.emit("fanhub:error", { message: "User no longer exists" });

        if (isMuted(freshUser)) {
          return socket.emit("fanhub:error", {
            message: `You are muted until ${new Date(freshUser.mutedUntil).toLocaleString()}`
          });
        }

        const cleaned = sanitizeMessage(payload.text);
        if (!cleaned) return socket.emit("fanhub:error", { message: "Message cannot be empty" });
        if (cleaned.length > 300) return socket.emit("fanhub:error", { message: "Max 300 chars" });

        const { text, wasFiltered } = applyProfanityFilter(cleaned);

        const created = await FanMessage.create({
          user: freshUser._id,
          text
        });

        const fullMessage = await FanMessage.findById(created._id)
          .populate("user", "name role")
          .lean();

        io.emit("fanhub:new-message", {
  ...sanitizeOutgoingMessage(fullMessage),
  wasFiltered
});
      } catch (err) {
        console.error("Send error:", err.message);
        socket.emit("fanhub:error", { message: "Could not send message" });
      }
    });

    // Delete own message (or admin can delete any)
    socket.on("fanhub:delete", async ({ messageId } = {}) => {
      try {
        if (!messageId) return;

        const msg = await FanMessage.findById(messageId).populate("user", "role");
        if (!msg) return;

        const isOwner = String(msg.user._id) === String(socket.user._id);
        const isAdmin = socket.user.role === "admin";

        if (!isOwner && !isAdmin) {
          return socket.emit("fanhub:error", { message: "Not allowed to delete this message" });
        }

        await FanMessage.deleteOne({ _id: messageId });

        io.emit("fanhub:deleted", { messageId });
      } catch (err) {
        console.error("Delete error:", err.message);
        socket.emit("fanhub:error", { message: "Could not delete message" });
      }
    });
  });

  return io;
};