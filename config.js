export const TILE_SIZE = 32; // Size of each tile in pixels

// Assuming canvas dimensions are fixed or determined elsewhere
// We might need to pass the canvas dimensions here later
// For now, let's keep the calculation logic in game.js or where canvas is defined
// export const MAP_COLS = Math.floor(canvas.width / TILE_SIZE);
// export const MAP_ROWS = Math.floor(canvas.height / TILE_SIZE);

// Define tile types (indices into the tileset image)
// Basic Dungeon Tiles
export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
// World Map Tiles (Assuming tileset order: Floor, Wall, Grass, Water, City)
export const TILE_GRASS = 2;
export const TILE_WATER = 3;
export const TILE_CITY_ENTRANCE = 4; // Tile representing a city on the world map
// City Map Tiles (Assuming tileset order continues: Road, Building, Door)
export const TILE_ROAD = 5;
export const TILE_BUILDING = 6;
export const TILE_DOOR = 7; // Tile representing an entrance/exit within the city
export const TILE_DUNGEON_ENTRANCE = 8; // Tile representing a dungeon entrance on the world map
// Biome Tiles
export const TILE_FOREST = 9;
export const TILE_MOUNTAIN = 10;
export const TILE_DESERT = 11;
export const TILE_SWAMP = 12;

// Combat Constants
export const BASE_HIT_CHANCE = 0.85; // 85% base chance to hit
export const DEXTERITY_HIT_MODIFIER = 0.02; // Each point of Dex difference changes hit chance by 2%
