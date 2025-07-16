#!/usr/bin/env node

import { Command } from "commander";
import { generatePathMappings, validatePathMappings, updateTsConfigMappings, getPathMappingSuggestions } from "./index";
import { PathMapper } from "./PathMapper";
import * as fs from "fs-extra";
import * as path from "path";

const program = new Command();

program.name("alias-it").description("Intelligent TypeScript path mapping with auto-discovery and validation").version("1.0.0");

program
  .command("discover")
  .description("Discover potential path mappings in the project")
  .option("--root-dir <path>", "Root directory to scan", process.cwd())
  .option("--output <path>", "Output file for results (JSON format)")
  .action(async (options) => {
    const mapper = new PathMapper({ rootDir: options.rootDir });
    const discovered = await mapper.discoverPaths();
    console.log(`\nFound ${discovered.length} potential mappings:\n`);
    for (const item of discovered) {
      console.log(`  @${item.alias} -> ${item.relativePath} (${item.type}, depth: ${item.depth})`);
    }
    if (options.output) {
      await fs.writeJson(options.output, discovered, { spaces: 2 });
      console.log(`\nResults saved to: ${options.output}`);
    }
  });

program
  .command("generate")
  .description("Generate path mappings and optionally update tsconfig.json")
  .option("--root-dir <path>", "Root directory to scan", process.cwd())
  .option("--tsconfig <path>", "Path to tsconfig.json", "tsconfig.json")
  .option("--output <path>", "Output file for mappings (JSON format)")
  .option("--merge", "Merge with existing mappings", true)
  .option("--no-merge", "Replace existing mappings")
  .action(async (options) => {
    const result = await generatePathMappings({ rootDir: options.rootDir });
    console.log(`\nGenerated ${Object.keys(result).length} mappings:\n`);
    for (const [alias, mapping] of Object.entries(result)) {
      console.log(`  ${alias}: "${mapping}"`);
    }
    if (options.merge !== false) {
      await updateTsConfigMappings(result, options.tsconfig, true, { rootDir: options.rootDir });
      console.log("✅ tsconfig.json updated successfully!");
    }
    if (options.output) {
      await fs.writeJson(options.output, result, { spaces: 2 });
      console.log(`\nMappings saved to: ${options.output}`);
    }
  });

program
  .command("validate")
  .description("Validate existing path mappings in tsconfig.json")
  .option("--root-dir <path>", "Root directory to scan", process.cwd())
  .option("--tsconfig <path>", "Path to tsconfig.json", "tsconfig.json")
  .action(async (options) => {
    const isValid = await validatePathMappings(options.tsconfig, { rootDir: options.rootDir });
    if (isValid) {
      console.log("✅ All path mappings are valid!");
    } else {
      console.log("❌ Some path mappings have issues.");
      process.exit(1);
    }
  });

program
  .command("suggest")
  .description("Get suggestions for path mappings")
  .option("--root-dir <path>", "Root directory to scan", process.cwd())
  .action(async (options) => {
    const suggestions = await getPathMappingSuggestions({ rootDir: options.rootDir });
    if (suggestions.length === 0) {
      console.log("No suggestions available.");
    } else {
      console.log("\nSuggestions:\n");
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }
  });

program
  .command("update")
  .description("Update tsconfig.json with new mappings from a file")
  .requiredOption("--output <path>", "Input file with mappings (JSON format)")
  .option("--tsconfig <path>", "Path to tsconfig.json", "tsconfig.json")
  .option("--merge", "Merge with existing mappings", true)
  .option("--no-merge", "Replace existing mappings")
  .option("--root-dir <path>", "Root directory to scan", process.cwd())
  .action(async (options) => {
    const mappings = await fs.readJson(options.output);
    await updateTsConfigMappings(mappings, options.tsconfig, options.merge, { rootDir: options.rootDir });
    console.log("✅ tsconfig.json updated successfully!");
  });

program.parseAsync(process.argv);
