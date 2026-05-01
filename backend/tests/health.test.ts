import request from "supertest";
import { app } from "../src/app";

jest.mock("@/config/database", () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

jest.mock("@/config/redis", () => ({
  redis: {
    ping: jest.fn().mockResolvedValue("PONG"),
    on: jest.fn(),
    quit: jest.fn(),
  },
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 5000,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    FRONTEND_URL: "http://localhost:3000",
    CORS_ORIGINS: "http://localhost:3000",
    REFRESH_TOKEN_SECRET: "test-secret",
    COOKIE_DOMAIN: "localhost",
  },
}));

describe("Health Endpoint", () => {
  it("GET /api/v1/health should return 200 with health data", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.uptime).toBeDefined();
    expect(res.body.data.environment).toBeDefined();
    expect(res.body.data.services).toBeDefined();
  });

  it("GET /api/v1/health should include database and redis status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.body.data.services.database).toBeDefined();
    expect(res.body.data.services.redis).toBeDefined();
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});