export enum PostPermission {
	CREATE_POST = "create:post",
	READ_POST = "read:post",
	READ_ALL_POST = "read-all:post",
	UPDATE_POST = "update:post",
	DELETE_POST = "delete:post",
}

export enum UserPermission {
	CREATE_USER = "create:user",
	READ_USER = "read:user",
	READ_ALL_USER = "read-all:user",
	UPDATE_USER = "update:user",
	DELETE_USER = "delete:user",
}

export enum ManagePermission {
	CREATE_PERMISSION = "create:permission",
	READ_PERMISSION = "read:permission",
	READ_ALL_PERMISSION = "read-all:permission",
	UPDATE_PERMISSION = "update:permission",
	DELETE_PERMISSION = "delete:permission",
}

export enum ManageUserPermission {
	CREATE_USER_PERMISSION = "create:user-permission",
	READ_USER_PERMISSION = "read:user-permission",
	READ_ALL_USER_PERMISSION = "read-all:user-permission",
	UPDATE_USER_PERMISSION = "update:user-permission",
	DELETE_USER_PERMISSION = "delete:user-permission",
}
