import { PathMapper } from '../PathMapper';
import { FileUtils } from '../utils/fileUtils';
import * as path from 'path';
import * as fs from 'fs-extra';

// Mock fs-extra and glob
jest.mock('fs-extra');
jest.mock('glob');

describe('PathMapper', () => {
  let mapper: PathMapper;
  const mockRootDir = '/test/project';

  beforeEach(() => {
    mapper = new PathMapper({ rootDir: mockRootDir });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultMapper = new PathMapper();
      expect(defaultMapper).toBeInstanceOf(PathMapper);
    });

    it('should initialize with custom options', () => {
      const customMapper = new PathMapper({
        rootDir: '/custom/path',
        maxDepth: 5,
        includePatterns: ['**/*.ts']
      });
      expect(customMapper).toBeInstanceOf(PathMapper);
    });
  });

  describe('discoverPaths', () => {
    it('should discover TypeScript files and directories', async () => {
      const mockFiles = [
        '/test/project/src/components/Button.tsx',
        '/test/project/src/utils/helpers.ts'
      ];
      const mockDirs = [
        '/test/project/src/components',
        '/test/project/src/utils'
      ];

      // Mock FileUtils methods
      jest.spyOn(FileUtils, 'getTypeScriptFiles').mockResolvedValue(mockFiles);
      jest.spyOn(FileUtils, 'getDirectoryStructure').mockResolvedValue(mockDirs);

      const result = await mapper.discoverPaths();

      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('alias');
      expect(result[0]).toHaveProperty('path');
      expect(result[0]).toHaveProperty('relativePath');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('depth');
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(FileUtils, 'getTypeScriptFiles').mockRejectedValue(new Error('File system error'));

      await expect(mapper.discoverPaths()).rejects.toThrow('Failed to discover paths: Error: File system error');
    });
  });

  describe('generateMappings', () => {
    it('should generate path mappings from discovered paths', async () => {
      const mockDiscovered = [
        {
          alias: 'button',
          path: '/test/project/src/components/Button.tsx',
          relativePath: 'src/components/Button.tsx',
          type: 'file' as const,
          depth: 2
        },
        {
          alias: 'helpers',
          path: '/test/project/src/utils/helpers.ts',
          relativePath: 'src/utils/helpers.ts',
          type: 'file' as const,
          depth: 2
        }
      ];

      jest.spyOn(mapper, 'discoverPaths').mockResolvedValue(mockDiscovered);

      const result = await mapper.generateMappings();

      expect(result.mappings).toEqual({
        '@button': 'src/components/Button.tsx',
        '@helpers': 'src/utils/helpers.ts'
      });
      expect(result.discovered).toEqual(mockDiscovered);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should handle alias conflicts', async () => {
      const mockDiscovered = [
        {
          alias: 'utils',
          path: '/test/project/src/utils/index.ts',
          relativePath: 'src/utils/index.ts',
          type: 'file' as const,
          depth: 2
        },
        {
          alias: 'utils',
          path: '/test/project/src/utils',
          relativePath: 'src/utils',
          type: 'directory' as const,
          depth: 1
        }
      ];

      jest.spyOn(mapper, 'discoverPaths').mockResolvedValue(mockDiscovered);

      const result = await mapper.generateMappings();

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Alias conflict resolved');
    });
  });

  describe('validateExistingMappings', () => {
    it('should validate existing path mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          paths: {
            '@components': 'src/components',
            '@utils': 'src/utils'
          }
        }
      };

      jest.spyOn(FileUtils, 'pathExists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readTsConfig').mockResolvedValue(mockConfig);
      jest.spyOn(FileUtils, 'validatePathMapping').mockReturnValue(true);
      jest.spyOn(mapper, 'discoverPaths').mockResolvedValue([]);

      const result = await mapper.validateExistingMappings();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect invalid mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          paths: {
            '@invalid': 'src/nonexistent'
          }
        }
      };

      jest.spyOn(FileUtils, 'pathExists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readTsConfig').mockResolvedValue(mockConfig);
      jest.spyOn(FileUtils, 'validatePathMapping').mockReturnValue(false);
      jest.spyOn(mapper, 'discoverPaths').mockResolvedValue([]);

      const result = await mapper.validateExistingMappings();

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('error');
    });
  });

  describe('updateTsConfig', () => {
    it('should update tsconfig.json with new mappings', async () => {
      const newMappings = {
        '@components': 'src/components',
        '@utils': 'src/utils'
      };

      jest.spyOn(FileUtils, 'pathExists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readTsConfig').mockResolvedValue({
        compilerOptions: {}
      });
      jest.spyOn(FileUtils, 'writeTsConfig').mockResolvedValue();

      await mapper.updateTsConfig(newMappings);

      expect(FileUtils.writeTsConfig).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          compilerOptions: expect.objectContaining({
            paths: newMappings
          })
        })
      );
    });

    it('should create new tsconfig.json if it does not exist', async () => {
      const newMappings = {
        '@components': 'src/components'
      };

      jest.spyOn(FileUtils, 'pathExists').mockResolvedValue(false);
      jest.spyOn(FileUtils, 'writeTsConfig').mockResolvedValue();

      await mapper.updateTsConfig(newMappings);

      expect(FileUtils.writeTsConfig).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          compilerOptions: expect.objectContaining({
            paths: newMappings
          })
        })
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for path mappings', async () => {
      jest.spyOn(mapper, 'discoverPaths').mockResolvedValue([]);
      jest.spyOn(FileUtils, 'pathExists').mockResolvedValue(true);

      const suggestions = await mapper.getSuggestions();

      expect(suggestions).toBeInstanceOf(Array);
    });
  });
}); 