import { config } from "@/app/config";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";

export const jwtAccessSetup = new Elysia({
	name: "jwtAccess",
}).use(
	jwt({
		name: "jwtAccess",
		schema: t.Object({
			id: t.String(),
		}),
		secret: config.JWT_ACCESS_SECRET,
		exp: "25m",
	}),
);

export const jwtRefreshSetup = new Elysia({
	name: "jwtRefresh",
}).use(
	jwt({
		name: "jwtRefresh",
		schema: t.Object({
			id: t.String(),
		}),
		secret: config.JWT_REFRESH_SECRET,
		exp: "7d",
	}),
);
