import { db } from "./index";
import {
	refreshToken,
	sessions,
	userPermissions,
	permissions,
	posts,
	emailVerificationTokens,
	passwordResetTokens,
	users,
} from "./schema";
import { getTableName } from "drizzle-orm";

const tables = [
	refreshToken,
	sessions,
	userPermissions,
	permissions,
	posts,
	emailVerificationTokens,
	passwordResetTokens,
	users,
];

for (const table of tables) {
	const name = getTableName(table);
	console.log(`Dropping ${name}`);
	await db.delete(table);
	console.log(`Dropped ${name}`);
	const tableResult = await db.select().from(table);
	console.log(`${name} result: `, tableResult);
}

console.log("Database dropped");

process.exit(0);
