export enum ErrorMessage {
		UNAUTHORIZED = "Unauthorized",
		FORBIDDEN = "Forbidden",
		NOT_FOUND = "Not Found",
		INTERNAL_SERVER_ERROR = "Internal Server Error",
		USER_NOT_FOUND = "User not found",
		INVALID_CREDENTIALS = "Invalid credentials",
		INVALID_EMAIL_TOKEN = "Invalid email token",
		EMAIL_TOKEN_EXPIRED = "Email token expired",
		USER_ALREADY_EXISTS = "User already exists",
		SESSION_ALREADY_EXISTS = "Session already exists",
		EMAIL_NOT_VERIFIED = "Email not verified",
		PASSWORD_DO_NOT_MATCH = "Password and confirm password do not match",
		EMAIL_ALREADY_VERIFIED = "Email already verified",
		INVALID_EMAIL = "Invalid email",
		INVALID_USER = "Invalid user",
		UNAUTHORIZED_PERMISSION = "Unauthorized permission",
		POST_NOT_FOUND = "Post not found",
		PAGE_NOT_FOUND = "Page not found",
		FAILED_TO_READ_POST = "Failed to read post",
		FAILED_TO_UPDATE_POST = "Failed to update post",
		FAILED_TO_CREATE_USER = "Failed to create user",
		FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN = "Failed to create email verification token",
		FAILED_TO_SEND_EMAIL = "Failed to send email",
		FAILED_TO_DELETE_USER = "Failed to delete user",
		USER_ALREADY_DELETED = "User already deleted",
		PERMISSION_NOT_FOUND = "Permission not found",
		PERMISSION_ALREADY_ASSIGNED = "Permission already assigned",
		USER_PERMISSION_NOT_FOUND = "User permission not found",
	}

export enum SuccessMessage {
		EMAIL_SENT = "Email sent, please check your email for the reset password link",
		LOGIN_SUCCESS = "Login successful",
		LOGOUT_SUCCESS = "Logged out successfully",
		ACCESS_TOKEN_REGENERATED = "Access token regenerated successfully",
		USER_REGISTERED = "User registered successfully, please verify your email",
		PASSWORD_RESET_SUCCESS = "Password reset successfully",
		EMAIL_VERIFIED = "Email verified",
		POST_CREATED = "Post created successfully",
		POST_DELETED = "Post deleted successfully",
		POSTS_FETCHED = "Posts fetched successfully",
		POST_READ = "Post read successfully",
		POST_UPDATED = "Post updated successfully",
		USER_CREATED = "User created successfully",
		USER_DELETED = "User deleted successfully",
		USER_FOUND = "User found",
		PERMISSION_CREATED = "Permission created successfully",
		PERMISSION_DELETED = "Permission deleted successfully",
		PERMISSIONS_FETCHED = "Permissions fetched successfully",
		PERMISSION_READ = "Permission read successfully",
		PERMISSION_UPDATED = "Permission updated successfully",
		USER_PERMISSION_CREATED = "User permission created successfully",
		USER_PERMISSION_DELETED = "User permission deleted successfully",
		USER_PERMISSIONS_FETCHED = "User permissions fetched successfully",
		USER_PERMISSION_READ = "User permission read successfully",
		USER_PERMISSION_UPDATED = "User permission updated successfully",
		USER_PERMISSION_REVOKED = "User permission revoked successfully",
	}
