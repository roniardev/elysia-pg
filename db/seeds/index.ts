import { runPostsSeed } from "./post.seed";
import { runUsersSeed } from "./user.seed";
import { runPermissionsSeed } from "./permission.seed";
import { runUserPermissionsSeed } from "./user-permissions.seed";

const tasks = [
	runUsersSeed,
	runPermissionsSeed,
	runUserPermissionsSeed,
	runPostsSeed,
];

tasks
	.reduce(async (prevPromise, nextTask) => {
		try {
			// Tunggu sampai task sebelumnya selesai (success atau error)
			await prevPromise;
		} catch (err) {
			// Tangkap error dari task sebelumnya, tapi lanjutkan eksekusi
			console.error("Prev seeding error:", err);
		}
		// Jalankan task berikutnya dan return promise-nya
		return nextTask();
	}, Promise.resolve())
	.catch((err) => {
		// Handle error terakhir (jika ada)
		console.error("Last seeding error:", err);
	})
	.finally(() => {
		// Exit proses setelah semua task selesai
		console.log("All seeding completed");
		process.exit(0); // atau process.exit(1) jika ingin exit code error
	});
