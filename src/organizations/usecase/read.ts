import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq } from "drizzle-orm"

import { OrganizationPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { userOrganizations } from "@/db/schema"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { readOrganizationModel } from "../data/organizations.model"

export const readOrganization = new Elysia()
	.use(readOrganizationModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/organization/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const path = "organizations.read.usecase"
			const validToken = await jwtAccess.verify(bearer)

			if (!validToken) {
				return handleResponse({
					message: ErrorMessage.UNAUTHORIZED,
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			const { valid } = await verifyPermission(
				OrganizationPermission.READ_ORGANIZATION,
				validToken.id,
			)

			if (!valid) {
				return handleResponse({
					message: ErrorMessage.UNAUTHORIZED_PERMISSION,
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			const membership = await db
				.select()
				.from(userOrganizations)
				.where(eq(userOrganizations.userId, validToken.id))
				.limit(1)

			if (membership.length === 0) {
				return handleResponse({
					message: "Not a member of this organization",
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			const organization = await db.query.organizations.findFirst({
				where: (table, { eq }) => eq(table.id, params.id),
			})

			if (!organization) {
				return handleResponse({
					message: "Organization not found",
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			return handleResponse({
				message: SuccessMessage.SUCCESS,
				callback: () => {
					set.status = ResponseSuccessStatus.OK
				},
				data: organization,
				path,
			})
		},
		{
			params: "readOrganizationModel",
		},
	)
