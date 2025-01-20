import { runPostsSeed } from "./post.seed";
import { runUsersSeed } from "./user.seed";

Promise.all([runPostsSeed(), runUsersSeed()])
	.then(() => {
		console.log("✅ All Seeds runned");
	})
	.catch((err) => {
		console.error(err);
	})
	.finally(() => {
		console.log("🚀 Shutting down...");
		process.exit(0);
	});
