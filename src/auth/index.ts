import { Elysia } from "elysia";
import { login } from "./usecase/login.usecase";
import { logout } from "./usecase/logout.usecase";
import { verifyJWT } from "./usecase/verify-jwt.usecase";

export const auth = new Elysia().use(login).use(logout).use(verifyJWT);
