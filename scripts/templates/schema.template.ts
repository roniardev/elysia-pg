/**
 * Template for generating schema files
 */
export const schemaTemplate = (sourceName: string) => {
  // Capitalize first letter of source name
  const capitalizedSourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
  
  return `import { relations } from "drizzle-orm";
import { index, text, timestamp, varchar, pgTable } from "drizzle-orm/pg-core";

import { users } from "./user";

export const ${sourceName.toLowerCase()} = pgTable(
  "${sourceName.toLowerCase()}",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    // Add other fields specific to your model here
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date(),
    ),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (t) => [
    index("${sourceName.toLowerCase()}_user_idx").on(t.userId),
    index("${sourceName.toLowerCase()}_created_at_idx").on(t.createdAt),
  ],
);

export type ${capitalizedSourceName} = typeof ${sourceName.toLowerCase()}.$inferSelect;
export type New${capitalizedSourceName} = typeof ${sourceName.toLowerCase()}.$inferInsert;

export const ${sourceName.toLowerCase()}Relations = relations(${sourceName.toLowerCase()}, ({ one }) => ({
  user: one(users, {
    fields: [${sourceName.toLowerCase()}.userId],
    references: [users.id],
  }),
}));
`;
};