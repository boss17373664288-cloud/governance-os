﻿﻿﻿import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const isSqlite = false; // PostgreSQL configured, using real DB

function parseDatabaseUrl(url: string): TypeOrmModuleOptions {
  const u = new URL(url);
  return {
    type: "postgres",
    host: u.hostname,
    port: parseInt(u.port || "5432", 10),
    username: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    entities: [join(__dirname, "..", "**", "*.entity{.ts,.js}")],
    synchronize: process.env.DB_SYNCHRONIZE === "true",
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    poolSize: 20,
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
    },
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };
}

export const databaseConfig: TypeOrmModuleOptions = isSqlite
  ? {
      type: "sqljs",
      autoSave: true,
      location: join(__dirname, "..", "..", "data", "governance.db"),
      entities: [join(__dirname, "..", "**", "*.entity{.ts,.js}")],
      synchronize: true,
      logging: ["error", "warn"],
    }
  : process.env.DATABASE_URL
    ? parseDatabaseUrl(process.env.DATABASE_URL)
    : {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "governance",
        password: process.env.DB_PASSWORD || "governance123",
        database: process.env.DB_DATABASE || "governance_db",
        entities: [join(__dirname, "..", "**", "*.entity{.ts,.js}")],
        synchronize: process.env.DB_SYNCHRONIZE === "true",
        logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        poolSize: 20,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
        },
      };

export const redisConfig = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL, maxRetriesPerRequest: 3, retryStrategy: (times: number) => Math.min(times * 100, 3000) }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || "",
      db: parseInt(process.env.REDIS_DB || "0", 10),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    };

export const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "governance-jwt-secret-dev",
  expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export const paddleOcrConfig = {
  endpoint: process.env.PADDLEOCR_ENDPOINT || "http://localhost:5000",
  timeout: 30000,
};

export const appConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  apiPrefix: "api/v1",
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
    : ["http://localhost:3001"],
};
