import { runPostsSeed } from "./post.seed";
import { runUsersSeed } from "./user.seed";

const tasks = [runUsersSeed, runPostsSeed];

tasks
	.reduce(async (prevPromise, nextTask) => {
		try {
			// Tunggu sampai task sebelumnya selesai (success atau error)
			await prevPromise;
		} catch (err) {
			// Tangkap error dari task sebelumnya, tapi lanjutkan eksekusi
			console.error("Task sebelumnya error:", err);
		}
		// Jalankan task berikutnya dan return promise-nya
		return nextTask();
	}, Promise.resolve())
	.catch((err) => {
		// Handle error terakhir (jika ada)
		console.error("Task terakhir error:", err);
	})
	.finally(() => {
		// Exit proses setelah semua task selesai
		console.log("Semua task selesai dijalankan");
		process.exit(0); // atau process.exit(1) jika ingin exit code error
	});
