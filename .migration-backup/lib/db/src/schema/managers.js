"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertManagerSchema = exports.managersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.managersTable = (0, pg_core_1.pgTable)("managers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)("name").notNull(),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    title: (0, pg_core_1.text)("title").notNull(),
    experience: (0, pg_core_1.integer)("experience").notNull().default(1),
    strategy: (0, pg_core_1.text)("strategy").notNull(),
    performance: (0, pg_core_1.numeric)("performance", { precision: 5, scale: 2 }).notNull().default("0"),
    totalClients: (0, pg_core_1.integer)("total_clients").notNull().default(0),
    winRate: (0, pg_core_1.numeric)("win_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    specialization: (0, pg_core_1.text)("specialization").notNull(),
    bio: (0, pg_core_1.text)("bio").notNull().default(""),
    contactEmail: (0, pg_core_1.text)("contact_email").notNull(),
    available: (0, pg_core_1.boolean)("available").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.insertManagerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.managersTable).omit({ id: true, createdAt: true });
//# sourceMappingURL=managers.js.map