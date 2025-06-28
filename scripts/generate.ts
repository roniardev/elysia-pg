#!/usr/bin/env bun

import { join } from "node:path"
import { existsSync } from "node:fs"
import {
	capitalizeFirstLetter,
	createDirectoryIfNotExists,
	generateFile,
} from "./utils/generator"

// Import templates
import { dataModelTemplate } from "./templates/data-model.template"
import { schemaTemplate } from "./templates/schema.template"
import { createTemplate } from "./templates/create.template"
import { readTemplate } from "./templates/read.template"
import { readAllTemplate } from "./templates/read-all.template"
import { updateTemplate } from "./templates/update.template"
import { deleteTemplate } from "./templates/delete.template"
import { indexTemplate } from "./templates/index.template"

// Import test templates
import {
	createTestTemplate,
	readTestTemplate,
	readAllTestTemplate,
	updateTestTemplate,
	deleteTestTemplate,
} from "./templates/tests"

/**
 * Main function to generate usecase files
 * @param sourceName The name of the source to generate files for
 */
async function generateUsecaseFiles(sourceName: string) {
	if (!sourceName) {
		console.error("Please provide a source name")
		process.exit(1)
	}

	// Capitalize first letter of source name
	const capitalizedSourceName = capitalizeFirstLetter(sourceName)

	// Create source directory if it doesn't exist
	const sourceDirPath = join(process.cwd(), "src", sourceName.toLowerCase())
	await createDirectoryIfNotExists(sourceDirPath)

	// Create usecase directory if it doesn't exist
	const usecaseDirPath = join(sourceDirPath, "usecase")
	await createDirectoryIfNotExists(usecaseDirPath)

	// Create data directory if it doesn't exist
	const dataDirPath = join(sourceDirPath, "data")
	await createDirectoryIfNotExists(dataDirPath)

	// Generate usecase files
	const usecaseFiles = [
		{ name: "create.ts", template: createTemplate(capitalizedSourceName) },
		{ name: "read.ts", template: readTemplate(capitalizedSourceName) },
		{ name: "read-all.ts", template: readAllTemplate(capitalizedSourceName) },
		{ name: "update.ts", template: updateTemplate(capitalizedSourceName) },
		{ name: "delete.ts", template: deleteTemplate(capitalizedSourceName) },
	]

	for (const file of usecaseFiles) {
		const filePath = join(usecaseDirPath, file.name)
		await generateFile(filePath, file.template)
	}

	// Generate index.ts file
	const indexFilePath = join(sourceDirPath, "index.ts")
	await generateFile(indexFilePath, indexTemplate(capitalizedSourceName))

	// Generate data model file
	const modelFilePath = join(
		dataDirPath,
		`${sourceName.toLowerCase()}.model.ts`,
	)
	await generateFile(modelFilePath, dataModelTemplate(capitalizedSourceName))

	// Check if schema directory exists
	const schemaDirPath = join(process.cwd(), "db", "schema")
	if (existsSync(schemaDirPath)) {
		// Generate schema file
		const schemaFilePath = join(
			schemaDirPath,
			`${sourceName.toLowerCase()}.ts`,
		)
		await generateFile(schemaFilePath, schemaTemplate(capitalizedSourceName))
	} else {
		console.log("Schema directory not found. Skipping schema file generation.")
	}

	// Generate test files
	const testDirPath = join(
		process.cwd(),
		"test",
		"routes",
		sourceName.toLowerCase(),
	)
	await createDirectoryIfNotExists(testDirPath)

	const testFiles = [
		{
			name: "create.test.ts",
			template: createTestTemplate(capitalizedSourceName),
		},
		{ name: "read.test.ts", template: readTestTemplate(capitalizedSourceName) },
		{
			name: "read-all.test.ts",
			template: readAllTestTemplate(capitalizedSourceName),
		},
		{
			name: "update.test.ts",
			template: updateTestTemplate(capitalizedSourceName),
		},
		{
			name: "delete.test.ts",
			template: deleteTestTemplate(capitalizedSourceName),
		},
	]

	for (const file of testFiles) {
		const filePath = join(testDirPath, file.name)
		await generateFile(filePath, file.template)
	}

	console.log(`
Successfully generated files for ${capitalizedSourceName}!`)
	console.log("\nNext steps:")
	console.log(
		`1. Add ${capitalizedSourceName}Permission to your permissions enum`,
	)
	console.log(
		"2. Add appropriate success and error messages to your response-message enum",
	)
	console.log(
		"3. Update the schema file with any additional fields specific to your model",
	)
	console.log(
		"4. Update the data model file with any additional fields specific to your model",
	)
	console.log("5. Import and use the schema in your db/schema/index.ts file")
	console.log(
		`6. Import and use the ${sourceName.toLowerCase()} module in your server.ts file:`,
	)
	console.log(
		`   - Add this import: import { ${sourceName.toLowerCase()} } from "@/src/${sourceName.toLowerCase()}";`,
	)
	console.log(
		`   - Add this line to your app: app.use(${sourceName.toLowerCase()})`,
	)
	console.log(
		`\nAfter completing these steps, your new ${capitalizedSourceName} endpoints will be available at:`,
	)
	console.log(
		`- POST /${sourceName.toLowerCase()} - Create a new ${sourceName.toLowerCase()}`,
	)
	console.log(
		`- GET /${sourceName.toLowerCase()} - Get all ${sourceName.toLowerCase()}s`,
	)
	console.log(
		`- GET /${sourceName.toLowerCase()}/:id - Get a specific ${sourceName.toLowerCase()}`,
	)
	console.log(
		`- PUT /${sourceName.toLowerCase()}/:id - Update a specific ${sourceName.toLowerCase()}`,
	)
	console.log(
		`- DELETE /${sourceName.toLowerCase()}/:id - Delete a specific ${sourceName.toLowerCase()}`,
	)
	console.log(
		`\nTest files have been generated in test/routes/${sourceName.toLowerCase()}/`,
	)
	console.log(
		`Run tests with: bun test test/routes/${sourceName.toLowerCase()}`,
	)
}

// Parse command line arguments
const sourceName = process.argv[2]
if (sourceName) {
	generateUsecaseFiles(sourceName)
} else {
	console.error("Please provide a source name")
	process.exit(1)
}