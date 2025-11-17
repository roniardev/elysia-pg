import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and } from "drizzle-orm"

import { OrganizationPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { userOrganizations } from "@/db/schema"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { switchOrganizationModel } from "../data/organizations.model"

export const switchOrganization = new Elysia()
	.use(switchOrganizationModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/organization/switch",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "organizations.switch.usecase"
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
				OrganizationPermission.SWITCH_ORGANIZATION,
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
				.where(
					and(
						eq(userOrganizations.userId, validToken.id),
						eq(userOrganizations.organizationId, body.organizationId),
					),
				)
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

			const newToken = await jwtAccess.sign({
				id: validToken.id,
				organizationId: body.organizationId,
			})

			return handleResponse({
				message: SuccessMessage.SUCCESS,
				callback: () => {
					set.status = ResponseSuccessStatus.OK
				},
				data: {
					accessToken: newToken,
					organizationId: body.organizationId,
				},
				path,
			})
		},
		{
			body: "switchOrganizationModel",
		},
	)
