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

export enum OrganizationPermission {
	CREATE_ORGANIZATION = "create:organization",
	READ_ORGANIZATION = "read:organization",
	READ_ALL_ORGANIZATION = "read-all:organization",
	UPDATE_ORGANIZATION = "update:organization",
	DELETE_ORGANIZATION = "delete:organization",
	SWITCH_ORGANIZATION = "switch:organization",
	MANAGE_MEMBERS = "manage:members",
}

export enum SpatialDataPermission {
	CREATE_SPATIAL_DATA = "create:spatial-data",
	READ_SPATIAL_DATA = "read:spatial-data",
	READ_ALL_SPATIAL_DATA = "read-all:spatial-data",
	UPDATE_SPATIAL_DATA = "update:spatial-data",
	DELETE_SPATIAL_DATA = "delete:spatial-data",
}

export enum SpatialLayerPermission {
	CREATE_SPATIAL_LAYER = "create:spatial-layer",
	READ_SPATIAL_LAYER = "read:spatial-layer",
	READ_ALL_SPATIAL_LAYER = "read-all:spatial-layer",
	UPDATE_SPATIAL_LAYER = "update:spatial-layer",
	DELETE_SPATIAL_LAYER = "delete:spatial-layer",
}

export enum SpatialMapPermission {
	CREATE_SPATIAL_MAP = "create:spatial-map",
	READ_SPATIAL_MAP = "read:spatial-map",
	READ_ALL_SPATIAL_MAP = "read-all:spatial-map",
	UPDATE_SPATIAL_MAP = "update:spatial-map",
	DELETE_SPATIAL_MAP = "delete:spatial-map",
}
