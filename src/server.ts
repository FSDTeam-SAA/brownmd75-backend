import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app";
import config from "./config";
import logger from "./logger";
import { initNotificationSocket } from "./socket/notification.service";
import syncStripePayments from "./modules/cron/paymentSync";


async function main() {
  try {
    await mongoose.connect(config.mongodbUrl as string);
    logger.info("MongoDB connected successfully");
    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      socket.on("joinRoom", (userId) => socket.join(userId));
    });

    initNotificationSocket(io);

    // --- START CRON JOB ---
    syncStripePayments();
    logger.info("Background Payment Sync Job initialized");

    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error: any) {
    logger.error("Server failed to start:", error);
  }
}

main();
