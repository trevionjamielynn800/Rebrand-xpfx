"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertMessageSchema = exports.messagesTable = exports.messageContextEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.messageContextEnum = (0, pg_core_1.pgEnum)("message_context", ["manager", "p2p", "support"]);
exports.messagesTable = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    senderId: (0, pg_core_1.uuid)("sender_id").notNull(),
    senderName: (0, pg_core_1.text)("sender_name").notNull(),
    senderAvatar: (0, pg_core_1.text)("sender_avatar"),
    recipientId: (0, pg_core_1.uuid)("recipient_id"),
    content: (0, pg_core_1.text)("content").notNull(),
    context: (0, exports.messageContextEnum)("context").notNull(),
    contextId: (0, pg_core_1.text)("context_id"),
    isFromUser: (0, pg_core_1.boolean)("is_from_user").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messagesTable).omit({ id: true, createdAt: true });
//# sourceMappingURL=messages.js.map