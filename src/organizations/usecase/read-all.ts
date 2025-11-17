import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, sql } from "drizzle-orm"

import { OrganizationPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { organizations, userOrganizations } from "@/db/schema"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readAllOrganizationModel } from "../data/organizations.model"

export const readAllOrganization = new Elysia()
	.use(readAllOrganizationModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/organization",
		async ({ bearer, set, jwtAccess, query }) => {
			const path = "organizations.read-all.usecase"
			const validToken = await jwtAccess.verify(bearer)
			const { page, limit, sort } = query

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
				OrganizationPermission.READ_ALL_ORGANIZATION,
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

			const userOrgIds = await db
				.select({ organizationId: userOrganizations.organizationId })
				.from(userOrganizations)
				.where(eq(userOrganizations.userId, validToken.id))

			const orgIds = userOrgIds.map((o) => o.organizationId)

			const orgs = await db.query.organizations.findMany({
				where: (table, { inArray }) => inArray(table.id, orgIds),
				limit: Number(limit),
				offset: (Number(page) - 1) * Number(limit),
				orderBy: (table, { desc: descFn, asc: ascFn }) => {
					return sort === Sorting.ASC
						? ascFn(table.createdAt)
						: descFn(table.createdAt)
				},
			})

			const totalAllData = await db
				.select({ count: sql<number>`count(*)` })
				.from(organizations)
				.where((table, { inArray }) => inArray(table.id, orgIds))

			const total = Number(totalAllData[0]?.count || 0)
			const totalPage = Math.ceil(total / Number(limit))

			if (page > totalPage && totalPage > 0) {
				return handleResponse({
					message: ErrorMessage.PAGE_NOT_FOUND,
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
				data: orgs,
				attributes: {
					total,
					page: Number(page),
					limit: Number(limit),
					totalPage,
				},
				path,
			})
		},
		{
			query: "readAllOrganizationModel",
		},
	)
