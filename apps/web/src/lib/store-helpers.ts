import { Item, Bid } from '@/types';

/**
 * Normalizes an array of entities into a map indexed by ID.
 */
export function normalize<T extends { id: string }>(entities: T[]): Record<string, T> {
  return entities.reduce((acc, entity) => {
    acc[entity.id] = entity;
    return acc;
  }, {} as Record<string, T>);
}

/**
 * Updates a single item in the normalized map, preserving other items.
 */
export function upsertEntity<T extends { id: string }>(
  map: Record<string, T>,
  entity: T
): Record<string, T> {
  return {
    ...map,
    [entity.id]: entity
  };
}

/**
 * Updates multiple items in the normalized map.
 */
export function upsertEntities<T extends { id: string }>(
  map: Record<string, T>,
  entities: T[]
): Record<string, T> {
  const newMap = { ...map };
  entities.forEach(entity => {
    newMap[entity.id] = entity;
  });
  return newMap;
}

/**
 * Removes an entity from the map.
 */
export function removeEntity<T extends { id: string }>(
  map: Record<string, T>,
  id: string
): Record<string, T> {
  const { [id]: removed, ...rest } = map;
  return rest;
}
