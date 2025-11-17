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
import { organizations, userOrganizations } from "@/db/schema"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { deleteOrganizationModel } from "../data/organizations.model"

export const deleteOrganization = new Elysia()
	.use(deleteOrganizationModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/organization/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const path = "organizations.delete.usecase"
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
				OrganizationPermission.DELETE_ORGANIZATION,
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
						eq(userOrganizations.organizationId, params.id),
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

			const role = membership[0].role

			if (role !== "owner") {
				return handleResponse({
					message: "Only owner can delete organization",
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			try {
				await db
					.update(organizations)
					.set({ deletedAt: new Date() })
					.where(eq(organizations.id, params.id))
			} catch (error) {
				console.error(error)
				return handleResponse({
					message: ErrorMessage.INTERNAL_SERVER_ERROR,
					callback: () => {
						set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
					},
					path,
				})
			}

			return handleResponse({
				message: SuccessMessage.SUCCESS,
				callback: () => {
					set.status = ResponseSuccessStatus.OK
				},
				data: { id: params.id },
				path,
			})
		},
		{
			params: "deleteOrganizationModel",
		},
	)
