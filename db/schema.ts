import { sqliteTable, text, real, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const ads = sqliteTable('ads', {
 id: text('id').primaryKey(), title: text('title').notNull(), description: text('description').notNull(),
 category: text('category').notNull(), city: text('city').notNull(), district: text('district').notNull(),
 phone: text('phone').notNull(), lat: real('lat').notNull(), lng: real('lng').notNull(),
 createdAt: integer('created_at').notNull(), deleteHash: text('delete_hash').notNull(),
 street: text('street'), house: text('house'), imageKey: text('image_key'), videoKey: text('video_key'), videoType: text('video_type'), videoSize: integer('video_size'), ownerId: text('owner_id').references(()=>users.id)
});
export const users = sqliteTable('users', {
 id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
 passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(), createdAt: integer('created_at').notNull()
});
export const sessions = sqliteTable('sessions', {
 tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(()=>users.id), expiresAt: integer('expires_at').notNull()
});
export const authLimits = sqliteTable('auth_limits', {
 key: text('key').primaryKey(), windowStart: integer('window_start').notNull(), attempts: integer('attempts').notNull()
});

export const videoUploads = sqliteTable('video_uploads', {
 id: text('id').primaryKey(), adId: text('ad_id').notNull(), ownerId: text('owner_id').notNull().references(()=>users.id),
 storageKey: text('storage_key').notNull(), r2Id: text('r2_id').notNull(), mime: text('mime').notNull(), size: integer('size').notNull(),
 received: integer('received').notNull(), parts: text('parts').notNull(), status: text('status').notNull(), expiresAt: integer('expires_at').notNull()
});

export const adComments = sqliteTable('ad_comments', {
 id: text('id').primaryKey(), adId: text('ad_id').references(()=>ads.id,{onDelete:'cascade'}),
 authorId: text('author_id').references(()=>users.id,{onDelete:'cascade'}), body: text('body').notNull(), createdAt: integer('created_at').notNull()
},table=>[index('comments_ad_created_idx').on(table.adId,table.createdAt,table.id)]);
export const conversations = sqliteTable('conversations', {
 id: text('id').primaryKey(), adId: text('ad_id').references(()=>ads.id,{onDelete:'cascade'}),
 buyerId: text('buyer_id').references(()=>users.id,{onDelete:'cascade'}), sellerId: text('seller_id').references(()=>users.id,{onDelete:'cascade'}),
 createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull()
},table=>[uniqueIndex('conversations_ad_buyer_idx').on(table.adId,table.buyerId),index('conversations_buyer_updated_idx').on(table.buyerId,table.updatedAt),index('conversations_seller_updated_idx').on(table.sellerId,table.updatedAt)]);
export const messages = sqliteTable('messages', {
 id: text('id').primaryKey(), conversationId: text('conversation_id').references(()=>conversations.id,{onDelete:'cascade'}),
 authorId: text('author_id').references(()=>users.id,{onDelete:'cascade'}), body: text('body').notNull(), createdAt: integer('created_at').notNull(), readAt: integer('read_at')
},table=>[index('messages_conversation_created_idx').on(table.conversationId,table.createdAt,table.id)]);

export const siteAdmin = sqliteTable('site_admin', {
 id: text('id').primaryKey(), userId: text('user_id').references(()=>users.id), createdAt: integer('created_at').notNull()
});
export const adminAudit = sqliteTable('admin_audit', {
 id: text('id').primaryKey(), actorId: text('actor_id').references(()=>users.id), action: text('action').notNull(),
 targetId: text('target_id').notNull(), detail: text('detail').notNull(), createdAt: integer('created_at').notNull()
},table=>[index('admin_audit_created_idx').on(table.createdAt,table.id)]);
