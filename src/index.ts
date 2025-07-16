export { PathMapper } from './PathMapper';
export * from './types';

import { PathMapper } from './PathMapper';
import { PathMapping, PathMapperOptions } from './types';

export async function generatePathMappings(options?: PathMapperOptions): Promise<PathMapping> {
  const mapper = new PathMapper(options);
  const result = await mapper.generateMappings();
  return result.mappings;
}

export async function validatePathMappings(
  tsConfigPath?: string,
  options?: PathMapperOptions
): Promise<boolean> {
  const mapper = new PathMapper(options);
  const result = await mapper.validateExistingMappings(tsConfigPath);
  return result.isValid;
}

export async function updateTsConfigMappings(
  mappings: PathMapping,
  tsConfigPath?: string,
  merge?: boolean,
  options?: PathMapperOptions
): Promise<void> {
  const mapper = new PathMapper(options);
  await mapper.updateTsConfig(mappings, tsConfigPath, merge);
}

export async function getPathMappingSuggestions(options?: PathMapperOptions): Promise<string[]> {
  const mapper = new PathMapper(options);
  return await mapper.getSuggestions();
} 