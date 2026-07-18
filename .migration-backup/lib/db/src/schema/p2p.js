"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertP2PMerchantApplicationSchema = exports.insertP2POrderSchema = exports.insertP2PListingSchema = exports.p2pMerchantApplicationsTable = exports.p2pNotificationsTable = exports.p2pOrdersTable = exports.p2pListingsTable = exports.p2pMerchantPaymentMethodEnum = exports.p2pMerchantApplicationStatusEnum = exports.p2pNotificationTypeEnum = exports.p2pListingTypeEnum = exports.p2pOrderStatusEnum = exports.p2pListingStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.p2pListingStatusEnum = (0, pg_core_1.pgEnum)("p2p_listing_status", ["active", "inactive", "completed"]);
exports.p2pOrderStatusEnum = (0, pg_core_1.pgEnum)("p2p_order_status", [
    "pending", "payment_sent", "completed", "disputed", "cancelled"
]);
exports.p2pListingTypeEnum = (0, pg_core_1.pgEnum)("p2p_listing_type", ["buy", "sell"]);
exports.p2pNotificationTypeEnum = (0, pg_core_1.pgEnum)("p2p_notification_type", [
    "deposit_incoming", "deposit_confirmed", "p2p_deposit", "order_update", "admin_message"
]);
exports.p2pMerchantApplicationStatusEnum = (0, pg_core_1.pgEnum)("p2p_merchant_application_status", [
    "pending", "approved", "rejected"
]);
exports.p2pMerchantPaymentMethodEnum = (0, pg_core_1.pgEnum)("p2p_merchant_payment_method", [
    "etransfer", "bank"
]);
exports.p2pListingsTable = (0, pg_core_1.pgTable)("p2p_listings", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    userName: (0, pg_core_1.text)("user_name").notNull(),
    userAvatarUrl: (0, pg_core_1.text)("user_avatar_url"),
    type: (0, exports.p2pListingTypeEnum)("type").notNull(),
    asset: (0, pg_core_1.text)("asset").notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 20, scale: 8 }).notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 20, scale: 8 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USD"),
    minOrder: (0, pg_core_1.numeric)("min_order", { precision: 20, scale: 8 }).notNull(),
    maxOrder: (0, pg_core_1.numeric)("max_order", { precision: 20, scale: 8 }).notNull(),
    paymentMethods: (0, pg_core_1.text)("payment_methods").array().notNull().default([]),
    completionRate: (0, pg_core_1.numeric)("completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    totalTrades: (0, pg_core_1.integer)("total_trades").notNull().default(0),
    status: (0, exports.p2pListingStatusEnum)("status").notNull().default("active"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.p2pOrdersTable = (0, pg_core_1.pgTable)("p2p_orders", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    listingId: (0, pg_core_1.uuid)("listing_id").notNull(),
    buyerId: (0, pg_core_1.uuid)("buyer_id").notNull(),
    sellerId: (0, pg_core_1.uuid)("seller_id").notNull(),
    asset: (0, pg_core_1.text)("asset").notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 20, scale: 8 }).notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 20, scale: 8 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USD"),
    status: (0, exports.p2pOrderStatusEnum)("status").notNull().default("pending"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.p2pNotificationsTable = (0, pg_core_1.pgTable)("p2p_notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    type: (0, exports.p2pNotificationTypeEnum)("type").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    orderId: (0, pg_core_1.text)("order_id"),
    read: (0, pg_core_1.boolean)("read").notNull().default(false),
    amount: (0, pg_core_1.numeric)("amount", { precision: 20, scale: 8 }),
    currency: (0, pg_core_1.text)("currency"),
    asset: (0, pg_core_1.text)("asset"),
    reference: (0, pg_core_1.text)("reference"),
    instructions: (0, pg_core_1.text)("instructions"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
exports.p2pMerchantApplicationsTable = (0, pg_core_1.pgTable)("p2p_merchant_applications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    status: (0, exports.p2pMerchantApplicationStatusEnum)("status").notNull().default("pending"),
    displayName: (0, pg_core_1.text)("display_name").notNull(),
    legalName: (0, pg_core_1.text)("legal_name").notNull(),
    contactEmail: (0, pg_core_1.text)("contact_email").notNull(),
    country: (0, pg_core_1.text)("country").notNull(),
    paymentMethod: (0, exports.p2pMerchantPaymentMethodEnum)("payment_method").notNull(),
    payoutEmail: (0, pg_core_1.text)("payout_email"),
    bankInfo: (0, pg_core_1.text)("bank_info"),
    assets: (0, pg_core_1.text)("assets").notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    rejectionReason: (0, pg_core_1.text)("rejection_reason"),
    reviewedBy: (0, pg_core_1.uuid)("reviewed_by"),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at"),
    submittedAt: (0, pg_core_1.timestamp)("submitted_at").notNull().defaultNow(),
});
exports.insertP2PListingSchema = (0, drizzle_zod_1.createInsertSchema)(exports.p2pListingsTable).omit({ id: true, createdAt: true });
exports.insertP2POrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.p2pOrdersTable).omit({ id: true, createdAt: true });
exports.insertP2PMerchantApplicationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.p2pMerchantApplicationsTable).omit({
    id: true, submittedAt: true, reviewedAt: true, reviewedBy: true, status: true, rejectionReason: true,
});
//# sourceMappingURL=p2p.js.map