import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export class FileUtils {
  /**
   * Check if a path exists and is accessible
   */
  static async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all TypeScript files in a directory recursively
   */
  static async getTypeScriptFiles(
    rootDir: string,
    includePatterns: string[] = ['**/*.ts', '**/*.tsx'],
    excludePatterns: string[] = ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/build/**']
  ): Promise<string[]> {
    const patterns = includePatterns.map(pattern => path.join(rootDir, pattern));
    const excludePatternsWithRoot = excludePatterns.map(pattern => path.join(rootDir, pattern));
    
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        ignore: excludePatternsWithRoot,
        absolute: true,
        nodir: true
      });
      files.push(...matches);
    }
    
    return [...new Set(files)];
  }

  /**
   * Get directory structure up to a certain depth
   */
  static async getDirectoryStructure(
    rootDir: string,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<string[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    try {
      const items = await fs.readdir(rootDir);
      const directories: string[] = [];

      for (const item of items) {
        const fullPath = path.join(rootDir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          directories.push(fullPath);
          const subDirs = await this.getDirectoryStructure(fullPath, maxDepth, currentDepth + 1);
          directories.push(...subDirs);
        }
      }

      return directories;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate a meaningful alias from a path
   */
  static generateAlias(filePath: string, rootDir: string): string {
    const relativePath = path.relative(rootDir, filePath);
    const withoutExt = path.parse(relativePath);
    
    // Remove common prefixes and generate camelCase alias
    let alias = withoutExt.name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+(\w)/g, (_: string, char: string) => char.toUpperCase())
      .replace(/^(\w)/, (_: string, char: string) => char.toLowerCase());
    
    // If it's a directory, use the directory name
    if (withoutExt.ext === '') {
      alias = path.basename(filePath);
    }
    
    // Ensure alias starts with a letter
    if (!/^[a-zA-Z]/.test(alias)) {
      alias = 'p' + alias;
    }
    
    return alias;
  }

  /**
   * Validate if a path mapping is valid
   */
  static validatePathMapping(mapping: string, rootDir: string): boolean {
    const fullPath = path.resolve(rootDir, mapping);
    return fs.existsSync(fullPath);
  }

  /**
   * Read tsconfig.json file
   */
  static async readTsConfig(configPath: string): Promise<any> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read tsconfig.json: ${error}`);
    }
  }

  /**
   * Write tsconfig.json file
   */
  static async writeTsConfig(configPath: string, config: any): Promise<void> {
    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to write tsconfig.json: ${error}`);
    }
  }
} 