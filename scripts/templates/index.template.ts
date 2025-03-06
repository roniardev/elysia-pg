/**
 * Template for generating index.ts file that groups all usecases
 */
export const indexTemplate = (sourceName: string) => `import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyAuth } from "@/src/general/usecase/verify-auth";
import { ErrorMessage } from "@/common/enum/response-message";

import { create${sourceName} } from "./usecase/create";
import { read${sourceName} } from "./usecase/read";
import { readAll${sourceName} } from "./usecase/read-all";
import { update${sourceName} } from "./usecase/update";
import { delete${sourceName} } from "./usecase/delete";

/**
 * ${sourceName} module that groups all ${sourceName.toLowerCase()} related endpoints
 * Import this in your server.ts file to use these endpoints:
 * 
 * import { ${sourceName.toLowerCase()} } from "@/src/${sourceName.toLowerCase()}";
 * 
 * Then add it to your app:
 * 
 * app.use(${sourceName.toLowerCase()})
 */
export const ${sourceName.toLowerCase()} = new Elysia()
  .use(jwtAccessSetup)
  .use(bearer())
  .guard(
    {
      beforeHandle: async ({ bearer, jwtAccess, set }) => {
        const token = await jwtAccess.verify(bearer);
        let valid = false;
        let message = "";

        if (token && bearer) {
          const { valid: isAuthorized, message: authMessage } =
            await verifyAuth(bearer, token);
          valid = isAuthorized;
          message = authMessage;
        }

        if (!valid) {
          set.status = 401;
          return {
            status: false,
            message: ErrorMessage.UNAUTHORIZED,
          };
        }
      },
    },
    (app) =>
      app
        .use(create${sourceName})
        .use(read${sourceName})
        .use(readAll${sourceName})
        .use(update${sourceName})
        .use(delete${sourceName})
  );
`; 