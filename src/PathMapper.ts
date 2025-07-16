import * as path from "path";
import { FileUtils } from "./utils/fileUtils";
import { PathMapping, PathMapperOptions, DiscoveredPath, PathMapperResult, ValidationResult, ValidationIssue } from "./types";

export class PathMapper {
  private rootDir: string;
  private options: Required<PathMapperOptions>;

  constructor(options: PathMapperOptions = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.options = {
      rootDir: this.rootDir,
      includePatterns: options.includePatterns || ["**/*.ts", "**/*.tsx"],
      excludePatterns: options.excludePatterns || ["**/*.d.ts", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
      maxDepth: options.maxDepth || 3,
      autoGenerate: options.autoGenerate ?? true,
      validateExisting: options.validateExisting ?? true,
    };
  }

  /**
   * Discover potential path mappings in the project
   */
  async discoverPaths(): Promise<DiscoveredPath[]> {
    const discovered: DiscoveredPath[] = [];

    try {
      // Get TypeScript files
      const tsFiles = await FileUtils.getTypeScriptFiles(this.rootDir, this.options.includePatterns, this.options.excludePatterns);

      // Get directory structure
      const directories = await FileUtils.getDirectoryStructure(this.rootDir, this.options.maxDepth);

      // Process files
      for (const file of tsFiles) {
        const relativePath = path.relative(this.rootDir, file);
        const alias = FileUtils.generateAlias(file, this.rootDir);

        discovered.push({
          alias,
          path: file,
          relativePath,
          type: "file",
          depth: this.calculateDepth(relativePath),
        });
      }

      // Process directories
      for (const dir of directories) {
        const relativePath = path.relative(this.rootDir, dir);
        const alias = FileUtils.generateAlias(dir, this.rootDir);

        discovered.push({
          alias,
          path: dir,
          relativePath,
          type: "directory",
          depth: this.calculateDepth(relativePath),
        });
      }

      // Sort by depth and then by alias
      return discovered.sort((a, b) => {
        if (a.depth !== b.depth) {
          return a.depth - b.depth;
        }
        return a.alias.localeCompare(b.alias);
      });
    } catch (error) {
      throw new Error(`Failed to discover paths: ${error}`);
    }
  }

  /**
   * Generate path mappings from discovered paths
   */
  async generateMappings(): Promise<PathMapperResult> {
    const discovered = await this.discoverPaths();
    const mappings: PathMapping = {};
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Group by alias to handle conflicts
    const aliasGroups = new Map<string, DiscoveredPath[]>();

    for (const item of discovered) {
      if (!aliasGroups.has(item.alias)) {
        aliasGroups.set(item.alias, []);
      }
      aliasGroups.get(item.alias)!.push(item);
    }

    // Process each alias group
    for (const [alias, items] of aliasGroups) {
      if (items.length === 1) {
        // No conflict, use the item
        const item = items[0];
        mappings[`@${alias}`] = item.relativePath;

        if (item.depth > 2) {
          suggestions.push(`Consider using a shorter alias for deep path: ${item.relativePath}`);
        }
      } else {
        // Conflict detected, resolve it
        const resolved = this.resolveAliasConflict(alias, items);
        mappings[`@${resolved.alias}`] = resolved.path;
        warnings.push(`Alias conflict resolved: ${alias} -> ${resolved.alias} for ${resolved.path}`);
      }
    }

    return {
      mappings,
      discovered,
      suggestions,
      warnings,
      errors,
    };
  }

  /**
   * Validate existing path mappings in tsconfig.json
   */
  async validateExistingMappings(tsConfigPath?: string): Promise<ValidationResult> {
    const configPath = tsConfigPath || path.join(this.rootDir, "tsconfig.json");
    const issues: ValidationIssue[] = [];

    try {
      if (!(await FileUtils.pathExists(configPath))) {
        issues.push({
          type: "error",
          message: "tsconfig.json not found",
          path: configPath,
        });
        return { isValid: false, issues };
      }

      const config = await FileUtils.readTsConfig(configPath);
      const pathMappings = config.compilerOptions?.paths || {};

      for (const [alias, mapping] of Object.entries(pathMappings)) {
        const mappingPath = Array.isArray(mapping) ? mapping[0] : mapping;

        if (!FileUtils.validatePathMapping(mappingPath, this.rootDir)) {
          issues.push({
            type: "error",
            message: `Invalid path mapping: ${alias} -> ${mappingPath}`,
            path: mappingPath,
            suggestion: "Remove or fix this mapping",
          });
        } else {
          // Check for potential improvements
          const discovered = await this.discoverPaths();
          const betterMapping = this.findBetterMapping(alias, mappingPath, discovered);

          if (betterMapping) {
            issues.push({
              type: "info",
              message: `Consider using shorter path: ${betterMapping}`,
              path: mappingPath,
              suggestion: betterMapping,
            });
          }
        }
      }

      return {
        isValid: issues.filter((issue) => issue.type === "error").length === 0,
        issues,
      };
    } catch (error) {
      issues.push({
        type: "error",
        message: `Failed to validate mappings: ${error}`,
        path: configPath,
      });
      return { isValid: false, issues };
    }
  }

  /**
   * Update tsconfig.json with new path mappings
   */
  async updateTsConfig(newMappings: PathMapping, tsConfigPath?: string, merge: boolean = true): Promise<void> {
    const configPath = tsConfigPath || path.join(this.rootDir, "tsconfig.json");

    try {
      let config: any;

      if (await FileUtils.pathExists(configPath)) {
        config = await FileUtils.readTsConfig(configPath);
      } else {
        config = {
          compilerOptions: {
            target: "ES2020",
            module: "commonjs",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
        };
      }

      // Ensure compilerOptions exists
      if (!config.compilerOptions) {
        config.compilerOptions = {};
      }

      // Update path mappings
      if (merge && config.compilerOptions.paths) {
        config.compilerOptions.paths = { ...config.compilerOptions.paths, ...newMappings };
      } else {
        config.compilerOptions.paths = newMappings;
      }

      await FileUtils.writeTsConfig(configPath, config);
    } catch (error) {
      throw new Error(`Failed to update tsconfig.json: ${error}`);
    }
  }

  /**
   * Get intelligent suggestions for path mappings
   */
  async getSuggestions(): Promise<string[]> {
    const discovered = await this.discoverPaths();
    const suggestions: string[] = [];

    // Analyze import patterns
    const importPatterns = await this.analyzeImportPatterns();

    for (const pattern of importPatterns) {
      if (pattern.count > 5) {
        // Suggest for frequently used patterns
        suggestions.push(`Consider creating alias for: ${pattern.pattern} (used ${pattern.count} times)`);
      }
    }

    // Suggest common directory aliases
    const commonDirs = ["components", "utils", "types", "services", "hooks", "pages"];
    for (const dir of commonDirs) {
      const dirPath = path.join(this.rootDir, "src", dir);
      if (await FileUtils.pathExists(dirPath)) {
        suggestions.push(`Consider adding alias for common directory: @${dir} -> src/${dir}`);
      }
    }

    return suggestions;
  }

  private calculateDepth(relativePath: string): number {
    return relativePath.split(path.sep).length - 1;
  }

  private resolveAliasConflict(alias: string, items: DiscoveredPath[]): { alias: string; path: string } {
    // Prefer files over directories
    const files = items.filter((item) => item.type === "file");
    const directories = items.filter((item) => item.type === "directory");

    if (files.length > 0) {
      // Use the file with the shortest path
      const shortestFile = files.reduce((shortest, current) => (current.relativePath.length < shortest.relativePath.length ? current : shortest));
      return { alias: shortestFile.alias, path: shortestFile.relativePath };
    }

    if (directories.length > 0) {
      // Use the directory with the shortest path
      const shortestDir = directories.reduce((shortest, current) => (current.relativePath.length < shortest.relativePath.length ? current : shortest));
      return { alias: shortestDir.alias, path: shortestDir.relativePath };
    }

    // Fallback to first item
    return { alias: items[0].alias, path: items[0].relativePath };
  }

  private findBetterMapping(alias: string, currentPath: string, discovered: DiscoveredPath[]): string | null {
    // Find if there's a shorter path that leads to the same destination
    const targetPath = path.resolve(this.rootDir, currentPath);

    for (const item of discovered) {
      const itemFullPath = path.resolve(this.rootDir, item.relativePath);
      if (itemFullPath === targetPath && item.relativePath.length < currentPath.length) {
        return item.relativePath;
      }
    }

    return null;
  }

  private async analyzeImportPatterns(): Promise<Array<{ pattern: string; count: number }>> {
    // This is a simplified implementation
    // In a real implementation, you would parse TypeScript files and analyze import statements
    return [];
  }
}
