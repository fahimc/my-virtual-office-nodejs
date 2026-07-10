import type { CreativeDirection } from '../schemas/creativeDirection.schema.js';

export function buildMoodboardState(directions: CreativeDirection[]) {
  return {
    keywords: [...new Set(directions.flatMap(direction => direction.brandPersonality))],
    palettes: directions.map(direction => ({ name: direction.name, palette: direction.palette })),
    typography: directions.map(direction => ({ name: direction.name, typography: direction.typography })),
    imagery: directions.map(direction => ({ name: direction.name, imageryStyle: direction.imageryStyle }))
  };
}
