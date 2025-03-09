import { db } from "@/db";
import type { User, Permission } from "@/db/schema";

type GetUser = {
	identifier: string;
	type: "email" | "id";
	condition?: {
		verified?: boolean;
		deleted?: boolean;
	};
	extend?: {
		permissions?: boolean;
	};
};

type GetUserResponse = {
	valid: boolean;
	message: string;
	user: (User & { permissions?: Permission[] }) | null;
};

export const getUser = async ({
	identifier,
	type,
	condition,
	extend,
}: GetUser): Promise<GetUserResponse> => {
	const withPermissions = extend?.permissions || undefined;

	const user = await db.query.users.findFirst({
		where: (table, { eq, and, isNull }) => {
			const conditions = [eq(table[type], identifier)];

			if (!condition?.deleted) {
				conditions.push(isNull(table.deletedAt));
			}

			if (condition?.verified) {
				conditions.push(eq(table.emailVerified, true));
			}

			const result =
				conditions.length === 1 ? conditions[0] : and(...conditions);

			return result;
		},
		with: {
			permissions: withPermissions,
		},
	}) as unknown as User & { permissions?: Permission[] };

	if (!user) {
		return {
			valid: false,
			message: "User not found",
			user: null,
		};
	}

	return {
		valid: true,
		message: "User found",
		user,
	};
};