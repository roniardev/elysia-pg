import { ulid } from "ulid";

const userId = ulid();

console.log(userId);

const createUserId = ulid();
const readUserId = ulid();
const readAllUserId = ulid();
const updateUserId = ulid();
const deleteUserId = ulid();

const permissions = [
	{
		id: createUserId,
		name: "create:user",
		description: "Create a user",
	},
	{
		id: readUserId,
		name: "read:user",
		description: "Read a user",
	},
	{
		id: readAllUserId,
		name: "read-all:user",
		description: "Read all users",
	},
	{
		id: updateUserId,
		name: "update:user",
		description: "Update a user",
	},
	{
		id: deleteUserId,
		name: "delete:user",
		description: "Delete a user",
	},
];

console.log(permissions);

const userPermissions = [
	{
		userId: userId,
		permissionId: createUserId,
	},
	{
		userId: userId,
		permissionId: readUserId,
	},
	{
		userId: userId,
		permissionId: readAllUserId,
	},
	{
		userId: userId,
		permissionId: updateUserId,
	},
	{
		userId: userId,
		permissionId: deleteUserId,
	},
];

console.log(userPermissions);