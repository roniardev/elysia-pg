import * as schema from "@/db/schema";
import { pgGenerate } from "drizzle-dbml-generator"; // Using Postgres for this example

const out = "./schema.dbml";
const relational = true;

try {
	console.log("Generating DBML...");
	pgGenerate({ schema, out, relational });
	console.log("DBML generated successfully");
} catch (error) {
	console.log("Error generating DBML");
	console.error(error);
}
