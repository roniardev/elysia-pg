import { config } from "@/app/config";
import * as crypto from "node:crypto";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class Crypto {
	public static encrypt = (text: string): string => {
		if (!text) throw new Error("Error encryption");

		// GENERATE RANDOM BYTES FOR INITIAL VECTOR
		const iv = crypto.randomBytes(16);
		// GENERATE RANDOM BYTES FOR SALT
		const salt = crypto.randomBytes(64);
		// GENERATE ENCRYPTION KEY
		const key = crypto.pbkdf2Sync(
			config.SECRET_KEY,
			salt as unknown as crypto.BinaryLike, // Cast ke BinaryLike
			2145,
			32,
			"sha512",
		);
		// AES 256 GCM
		const cipher = crypto.createCipheriv(
			"aes-256-gcm",
			key as unknown as crypto.CipherKey, // Cast ke CipherKey
			iv as unknown as crypto.BinaryLike, // Cast ke BinaryLike
		);
		// ENCRYPT "text"
		const encrypted = Buffer.concat([
			cipher.update(text, "utf8") as unknown as Uint8Array<ArrayBufferLike>,
			cipher.final() as unknown as Uint8Array<ArrayBufferLike>,
		]);
		// RETURN THE RESULT
		return Buffer.concat([
			salt as unknown as Uint8Array<ArrayBufferLike>,
			iv as unknown as Uint8Array<ArrayBufferLike>,
			encrypted as unknown as Uint8Array<ArrayBufferLike>,
		]).toString("base64");
	};

	public static decrypt = (encryptedText: string): string => {
		if (!encryptedText) throw new Error("Error decryption");

		// DECODE BASE64
		const base64 = Buffer.from(encryptedText, "base64");
		// EXTRACT SALT, INITIAL VALUE, AND TEXT FROM BASE64 VALUE
		const salt = base64.subarray(0, 64);
		const iv = base64.subarray(64, 80);
		const text = base64.subarray(80);
		// GENERATE ENCRYPTION KEY
		const key = crypto.pbkdf2Sync(
			config.SECRET_KEY,
			salt as unknown as crypto.BinaryLike, // Cast ke BinaryLike
			2145,
			32,
			"sha512",
		);
		// AES 256 GCM Mode
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm", // Harus sama dengan mode di encrypt
			key as unknown as crypto.CipherKey, // Cast ke CipherKey
			iv as unknown as crypto.BinaryLike, // Cast ke BinaryLike
		);
		// DECRYPT THE GIVEN TEXT
		const decrypted = Buffer.concat([
			decipher.update(
				text as unknown as DataView<ArrayBufferLike>,
			) as unknown as Uint8Array<ArrayBufferLike>,
			decipher.final() as unknown as Uint8Array<ArrayBufferLike>,
		]);
		// RETURN THE RESULT
		return decrypted.toString("utf8");
	};
}
