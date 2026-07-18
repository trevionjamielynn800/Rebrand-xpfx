"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSupportTicketSchema = exports.insertAssetSchema = exports.supportTicketsTable = exports.assetCatalogTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.assetCatalogTable = (0, pg_core_1.pgTable)("asset_catalog", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    symbol: (0, pg_core_1.text)("symbol").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 20, scale: 8 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USD"),
    change24h: (0, pg_core_1.numeric)("change_24h", { precision: 8, scale: 4 }).notNull().default("0"),
    logoUrl: (0, pg_core_1.text)("logo_url"),
    available: (0, pg_core_1.boolean)("available").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.supportTicketsTable = (0, pg_core_1.pgTable)("support_tickets", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    subject: (0, pg_core_1.text)("subject").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("open"),
    priority: (0, pg_core_1.text)("priority").notNull().default("medium"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
exports.insertAssetSchema = (0, drizzle_zod_1.createInsertSchema)(exports.assetCatalogTable).omit({ id: true, createdAt: true });
exports.insertSupportTicketSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supportTicketsTable).omit({ id: true, createdAt: true, updatedAt: true });
//# sourceMappingURL=assets.js.map