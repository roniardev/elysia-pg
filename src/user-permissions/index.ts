import { Elysia } from "elysia";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import bearer from "@elysiajs/bearer";

import { createUserPermission } from "./usecase/create";
import { readUserPermission } from "./usecase/read";
import { readAllUserPermission } from "./usecase/read-all";
import { updateUserPermission } from "./usecase/update";
import { deleteUserPermission } from "./usecase/delete";
import { encryptResponse } from "@/utils/encrypt-response";
import { verifyAuth } from "../general/usecase/verify-auth";
import { ErrorMessage } from "@/common/enum/response-message";

export const userPermissions = new Elysia()
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
      afterHandle: ({ response, request }) => {
        console.log({
          from: "user-permissions",
          response,
          request,
        });
        return encryptResponse(response);
      },
    },
    (app) =>
      app
        .use(createUserPermission)
        .use(readUserPermission)
        .use(readAllUserPermission)
        .use(updateUserPermission)
        .use(deleteUserPermission)
  ); 