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
}

export enum SuccessMessage {
	EMAIL_SENT = "Email sent, please check your email for the reset password link",
	LOGIN_SUCCESS = "Login successful",
	LOGOUT_SUCCESS = "Logged out successfully",
	ACCESS_TOKEN_REGENERATED = "Access token regenerated successfully",
	USER_REGISTERED = "User registered successfully, please verify your email",
	PASSWORD_RESET_SUCCESS = "Password reset successfully",
	EMAIL_VERIFIED = "Email verified",
}
