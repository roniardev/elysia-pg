import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Creates a directory if it doesn't exist
 * @param dirPath The path of the directory to create
 * @returns A promise that resolves when the directory is created
 */
export async function createDirectoryIfNotExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Generates a file from a template
 * @param filePath The path of the file to generate
 * @param content The content of the file
 * @returns A promise that resolves when the file is generated
 */
export async function generateFile(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content);
  console.log(`Generated file: ${filePath}`);
}

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 