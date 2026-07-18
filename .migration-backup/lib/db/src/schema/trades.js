"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTradeSchema = exports.tradesTable = exports.tradeStatusEnum = exports.tradeTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.tradeTypeEnum = (0, pg_core_1.pgEnum)("trade_type", ["long", "short"]);
exports.tradeStatusEnum = (0, pg_core_1.pgEnum)("trade_status", ["active", "completed", "cancelled"]);
exports.tradesTable = (0, pg_core_1.pgTable)("trades", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    pair: (0, pg_core_1.text)("pair").notNull(),
    type: (0, exports.tradeTypeEnum)("type").notNull(),
    status: (0, exports.tradeStatusEnum)("status").notNull().default("active"),
    entryPrice: (0, pg_core_1.numeric)("entry_price", { precision: 20, scale: 8 }).notNull(),
    currentPrice: (0, pg_core_1.numeric)("current_price", { precision: 20, scale: 8 }).notNull(),
    targetPrice: (0, pg_core_1.numeric)("target_price", { precision: 20, scale: 8 }).notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 20, scale: 8 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USDT"),
    profit: (0, pg_core_1.numeric)("profit", { precision: 20, scale: 8 }).notNull().default("0"),
    expectedProfit: (0, pg_core_1.numeric)("expected_profit", { precision: 20, scale: 8 }).notNull().default("0"),
    managerId: (0, pg_core_1.text)("manager_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
exports.insertTradeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tradesTable).omit({ id: true, createdAt: true });
//# sourceMappingURL=trades.js.map