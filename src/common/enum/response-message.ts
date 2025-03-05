export enum SuccessMessage {
  PERMISSION_CREATED = "Permission created successfully",
  PERMISSION_UPDATED = "Permission updated successfully",
  PERMISSION_DELETED = "Permission deleted successfully",
  USER_PERMISSION_CREATED = "User permission created successfully",
  USER_PERMISSION_UPDATED = "User permission updated successfully",
  USER_PERMISSION_DELETED = "User permission deleted successfully",
}

export enum ErrorMessage {
  UNAUTHORIZED = "Unauthorized",
  INVALID_USER = "Invalid user",
  UNAUTHORIZED_PERMISSION = "Unauthorized permission",
  INTERNAL_SERVER_ERROR = "Internal server error",
  PERMISSION_ALREADY_ASSIGNED = "Permission already assigned to user",
  USER_PERMISSION_NOT_FOUND = "User permission not found",
} 