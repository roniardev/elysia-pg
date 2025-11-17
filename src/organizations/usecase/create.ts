import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"
import { eq } from "drizzle-orm"

import { OrganizationPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { organizations, userOrganizations } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { createOrganizationModel } from "../data/organizations.model"

export const createOrganization = new Elysia()
	.use(createOrganizationModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/organization",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "organizations.create.usecase"
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

			const existingUser = await getUser({
				identifier: validToken.id,
				type: "id",
				condition: {
					deleted: false,
				},
			})

			if (!existingUser.user) {
				return handleResponse({
					message: ErrorMessage.INVALID_USER,
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			const { valid } = await verifyPermission(
				OrganizationPermission.CREATE_ORGANIZATION,
				existingUser.user?.id,
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

			const existingOrg = await db
				.select()
				.from(organizations)
				.where(eq(organizations.slug, body.slug))
				.limit(1)

			if (existingOrg.length > 0) {
				return handleResponse({
					message: "Organization slug already exists",
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			const organizationId = ulid()

			try {
				await db.insert(organizations).values({
					id: organizationId,
					name: body.name,
					slug: body.slug,
					ownerId: existingUser.user?.id,
				})

				await db.insert(userOrganizations).values({
					userId: existingUser.user?.id,
					organizationId: organizationId,
					role: "owner",
				})
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

			const response = {
				id: organizationId,
				name: body.name,
				slug: body.slug,
			}

			return handleResponse({
				message: SuccessMessage.SUCCESS,
				callback: () => {
					set.status = ResponseSuccessStatus.CREATED
				},
				data: response,
				path,
			})
		},
		{
			body: "createOrganizationModel",
		},
	)
