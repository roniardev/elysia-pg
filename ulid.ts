import { ulid } from "ulid";

export const generateId = () => {
	return ulid();
};

const user = generateId();
console.log({
	user,
});

const createPost = generateId();
const updatePost = generateId();
const deletePost = generateId();
const readAllPost = generateId();
const readPost = generateId();

const permission = [
	{
		id: createPost,
		name: "create:post",
		description: "Create a post",
	},
	{
		id: updatePost,
		name: "update:post",
		description: "Update a post",
	},
	{
		id: deletePost,
		name: "delete:post",
		description: "Delete a post",
	},
	{
		id: readAllPost,
		name: "read-all:post",
		description: "Read all posts",
	},
	{
		id: readPost,
		name: "read:post",
		description: "Read a post",
	},
];

console.log({
	permission,
});

const userPermission = [
	{
		userId: user,
		permissionId: createPost,
	},
	{
		userId: user,
		permissionId: updatePost,
	},
	{
		userId: user,
		permissionId: deletePost,
	},
	{
		userId: user,
		permissionId: readAllPost,
	},
	{
		userId: user,
		permissionId: readPost,
	},
];

console.log({
	userPermission,
});
