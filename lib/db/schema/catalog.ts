import { relations, sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  char,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { user } from "@/lib/db/schema/auth"
import {
  PRODUCT_FILE_STATUSES,
  PRODUCT_MEDIA_ROLES,
  PRODUCT_STATUSES,
} from "@/lib/catalog/constants"

export const productStatusEnum = pgEnum("product_status", PRODUCT_STATUSES)

export const productMediaRoleEnum = pgEnum(
  "product_media_role",
  PRODUCT_MEDIA_ROLES
)

export const productFileStatusEnum = pgEnum(
  "product_file_status",
  PRODUCT_FILE_STATUSES
)

export const product = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 320 }),
    description: text("description"),
    status: productStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_slug_uidx").on(table.slug),
    index("product_status_idx").on(table.status),
    index("product_updated_at_idx").on(table.updatedAt),
    index("product_created_by_idx").on(table.createdBy),
    index("product_updated_by_idx").on(table.updatedBy),
    check(
      "product_published_at_required",
      sql`${table.status} <> 'published' or ${table.publishedAt} is not null`
    ),
    check(
      "product_archived_at_required",
      sql`${table.status} <> 'archived' or ${table.archivedAt} is not null`
    ),
  ]
)

export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }),
    sku: varchar("sku", { length: 100 }),
    priceAmount: integer("price_amount").notNull(),
    currency: char("currency", { length: 3 }).default("IDR").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("product_variant_product_id_idx").on(table.productId),
    uniqueIndex("product_variant_sku_uidx")
      .on(table.sku)
      .where(sql`${table.sku} is not null`),
    uniqueIndex("product_variant_default_uidx")
      .on(table.productId)
      .where(sql`${table.isDefault} = true`),
    index("product_variant_updated_at_idx").on(table.updatedAt),
    check(
      "product_variant_price_amount_nonnegative",
      sql`${table.priceAmount} >= 0`
    ),
    check(
      "product_variant_position_nonnegative",
      sql`${table.position} >= 0`
    ),
    check("product_variant_currency_idr", sql`${table.currency} = 'IDR'`),
  ]
)

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    role: productMediaRoleEnum("role").default("gallery").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: varchar("alt_text", { length: 500 }),
    rejectionReason: varchar("rejection_reason", { length: 500 }),
    position: integer("position").default(0).notNull(),
    status: productFileStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_media_storage_key_uidx").on(table.storageKey),
    uniqueIndex("product_media_current_cover_uidx")
      .on(table.productId)
      .where(sql`${table.role} = 'cover' and ${table.status} = 'ready'`),
    index("product_media_product_id_idx").on(table.productId),
    index("product_media_status_idx").on(table.status),
    index("product_media_updated_at_idx").on(table.updatedAt),
    check("product_media_file_size_nonnegative", sql`${table.fileSize} >= 0`),
    check(
      "product_media_width_positive",
      sql`${table.width} is null or ${table.width} > 0`
    ),
    check(
      "product_media_height_positive",
      sql`${table.height} is null or ${table.height} > 0`
    ),
    check("product_media_position_nonnegative", sql`${table.position} >= 0`),
    check(
      "product_media_ready_dimensions_required",
      sql`${table.status} <> 'ready' or (${table.width} is not null and ${table.height} is not null)`
    ),
  ]
)

export const productAsset = pgTable(
  "product_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    downloadName: varchar("download_name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    checksumSha256: char("checksum_sha256", { length: 64 }),
    rejectionReason: varchar("rejection_reason", { length: 500 }),
    version: integer("version").default(1).notNull(),
    status: productFileStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_asset_storage_key_uidx").on(table.storageKey),
    index("product_asset_product_id_idx").on(table.productId),
    uniqueIndex("product_asset_product_version_uidx").on(
      table.productId,
      table.version
    ),
    index("product_asset_status_idx").on(table.status),
    index("product_asset_updated_at_idx").on(table.updatedAt),
    check("product_asset_file_size_nonnegative", sql`${table.fileSize} >= 0`),
    check("product_asset_version_positive", sql`${table.version} > 0`),
    check(
      "product_asset_checksum_format",
      sql`${table.checksumSha256} is null or ${table.checksumSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "product_asset_ready_checksum_required",
      sql`${table.status} <> 'ready' or ${table.checksumSha256} is not null`
    ),
  ]
)

export const category = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("category_slug_uidx").on(table.slug),
    index("category_updated_at_idx").on(table.updatedAt),
  ]
)

export const productCategory = pgTable(
  "product_category",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "product_category_pk",
      columns: [table.productId, table.categoryId],
    }),
    index("product_category_product_id_idx").on(table.productId),
    index("product_category_category_id_idx").on(table.categoryId),
  ]
)

export const productRelations = relations(product, ({ many, one }) => ({
  variants: many(productVariant),
  media: many(productMedia),
  assets: many(productAsset),
  categories: many(productCategory),
  createdByUser: one(user, {
    fields: [product.createdBy],
    references: [user.id],
    relationName: "productCreatedBy",
  }),
  updatedByUser: one(user, {
    fields: [product.updatedBy],
    references: [user.id],
    relationName: "productUpdatedBy",
  }),
}))

export const productVariantRelations = relations(productVariant, ({ one }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
}))

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(product, {
    fields: [productMedia.productId],
    references: [product.id],
  }),
}))

export const productAssetRelations = relations(productAsset, ({ one }) => ({
  product: one(product, {
    fields: [productAsset.productId],
    references: [product.id],
  }),
}))

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(productCategory),
}))

export const productCategoryRelations = relations(
  productCategory,
  ({ one }) => ({
    product: one(product, {
      fields: [productCategory.productId],
      references: [product.id],
    }),
    category: one(category, {
      fields: [productCategory.categoryId],
      references: [category.id],
    }),
  })
)
