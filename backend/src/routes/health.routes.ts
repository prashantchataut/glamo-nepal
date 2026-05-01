import { Router, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { prisma } from "@/config/database";
import { redis } from "@/config/redis";
import { env } from "@/config/env";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const uptime = process.uptime();
    const now = new Date().toISOString();

    let databaseStatus = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = "disconnected";
    }

    let redisStatus = "connected";
    try {
      await redis.ping();
    } catch {
      redisStatus = "disconnected";
    }

    res.status(200).json({
      success: true,
      message: "GLAMO Nepal API is running",
      data: {
        status: "healthy",
        timestamp: now,
        uptime: `${Math.floor(uptime)}s`,
        environment: env.NODE_ENV,
        version: "1.0.0",
        services: {
          database: databaseStatus,
          redis: redisStatus,
        },
      },
      pagination: null,
    });
  })
);

export const healthRoutes = router;