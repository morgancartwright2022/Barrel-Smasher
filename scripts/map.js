class Tile {
	constructor(src, solid) {
		this.src = src;
		this.solid = solid;
	}
}

class Map {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.tileSize = 64;
		this.tiles;
		this.limits = {
			top: 0,
			right: width * this.tileSize,
			bottom: height * this.tileSize,
			left: 0,
		};
	}
	inBounds(x, y) {
		return (x > this.limits.left && x < this.limits.right) && (y > this.limits.top && y < this.limits.bottom);
	}
	tileInBounds(x, y) {
		return (x >= 0 && x <= this.width - 1) && (y > 0 && y < this.height - 1);
	}
	freeAtTile(x, y) {
		return !this.tiles[y][x].solid;
	}
	freeAtPosition(x, y) {
		if(!this.inBounds(x, y))
			return false;
		else
			return this.freeAtTile(Math.floor(x/64), Math.floor(y/64));
	}
	coordsToTileIndex(x, y) {
		return {x: Math.floor(x/this.tileSize), y: Math.floor(y/this.tileSize)};
	}
	tileIndexToCoords(x, y) {
		return {x: x*this.tileSize + this.tileSize/2, y: y*this.tileSize + this.tileSize};
	}
	fillTiles() {}
	changeTile(x, y, tile) {
		this.tiles[y][x] = tile;
		renderer.renderMap(this);
	}
}
class PlainsMap extends Map {
	constructor(width, height) {
		super(width, height);
		this.tiles = [];
	}
	fillTiles(seed) {
		let curRow;
		for(let y = 0; y < this.height; y++) {
			this.tiles.push([]);
			curRow = this.tiles[y];
			for(let x = 0; x < this.width; x++) {
				let tile;
				const rand = Math.floor(((seed * Math.pow(x + 3, y + 3)) % 100) * seed*2);
				if(seed > 0.95 || rand > 20) 
					tile = new Tile("grass1.png", false);
				else if(seed > 0.85 || rand > 10)
					tile = new Tile("grass2.png", false);
				else if(seed > 0.07 || rand > 5)
					tile = new Tile("grass3.png", false);
				else
					tile = new Tile("dirt.png", false);
				curRow.push(tile);
			}
		}
		this.tiles[0][15] = new Tile("dirt.png", false);
		this.tiles[1][15] = new Tile("dirt.png", false);
		this.tiles[2][15] = new Tile("dirt.png", false);
	}
}
class TownMap extends Map {
	constructor(width, height) {
		super(width, height);
		this.tiles = [];
	}
	fillTiles(seed) {
		const stringMap = [
			"gwwwwwwwggsssss",
			"gwdddddwggscccs",
			"gwdddddwggscccs",
			"gwwwpdpwggscccs",
			"gggggpggggscccs",
			"bbbbbpggggscccs",
			"bfffbppgggsscss",
			"bffffddpppggpgg",
			"bffbbppggppppgg",
			"bbbbggpgggggggg",
			"ggggggppggggggg"
		];
		this.tiles = stringMap.map(str => {
			const tileRow = [];
			for(let i = 0; i < str.length; i++) {
				let name;
				let solid = false;
				const char = str[i];
				switch(char) {
					case "g":
						if(Math.random() > 0.9)
							name = "grass2.png";
						else
							name = "grass1.png";
						break;
					case "d":
						name = "dirt.png";
						break;
					case "p":
						name = "grass3.png";
						break;
					case "f":
						name = "planks.png";
						break;
					case "c":
						name = "stone_floor.png";
						break;
					case "b":
						name = "mud_bricks.png";
						solid = true;
						break;
					case "w":
						name = "wood_wall.png";
						solid = true;
						break;
					case "s":
						name = "stone_wall.png";
						solid = true;
						break;
				}
				tileRow.push(new Tile(name, solid));
			}
			return tileRow;
		});
	}
}
class CastleMap extends Map {
	constructor(width, height) {
		super(width, height);
		this.tiles = [];
	}
	fillTiles(seed) {
		const stringMap = [
			"  XXXLRXXXXXXXXXXXXXXXXXXXXX  ",
			"  X........X.......X.......X  ",
			"  X........X..ccc..........X  ",
			"  X...........ccc..X.......X  ",
			"  X........X..ccc..XXXXXXXXX  ",
			"XXXXXXXXXXXX..ccc..X.......X  ",
			"X.............ccc..........X  ",
			"X..........X.......X.......X  ",
			"X..........XXXX.XXXXXXXXXXXXXX",
			"X..........XX  o         X...X",
			"XXXX.XXXXXXXX  oooooo    X...X",
			"X.......X        oo ooooo....X",
			"X.......X       oo      oXXXXX",
			"X........oooooooo       o....X",
			"X.......X  o   o         X...X",
			"XXXXXXXXXXX.XXX.XXXXXXXXXXXXXX",
			"X...........X.....Xoooooooooo#",
			"X...........X.....Xoooooooooo#",
			"X...........X.....Xoooooooooo#",
			"XX........XXXXXDXXX###oo##ooo#",
			"XXX......XX    o      o  ###,#",
			"XXXXXXXXXX     oooooooooo,,,,#",
			"XX         ooooo   oo    #,,,#",
			"XX     ooooo        ooo  #####",
			"XX     o   oo         o      X",
			"%%%%%%%'%%  o       XX,XXXXXXX",
			"%''''''''%  oo      X,,,X.LR.X",
			"%''''''''%   o      X,,,X....X",
			"%''''''''%XXXoXXXXXXX,,,.....X",
			"%%%%%%%%%%XXXoXXXXXXXXXXXXXXXX",
		];
		this.tiles = stringMap.map(str => {
			const tileRow = [];
			for(let i = 0; i < str.length; i++) {
				let name;
				let solid = false;
				const char = str[i];
				switch(char) {
					case " ":
						if(Math.random() > 0.9)
							name = "grass2.png";
						else
							name = "grass1.png";
						break;
					case ".":
						name = "stone_floor.png";
						break;
					case ",":
						name = "planks.png";
						break;
					case "'":
						name = "dark_planks.png";
						break;
					case "o":
						name = "dirt.png";
						break;
					case "c":
						name = "carpet.png";
						break;
					case "X":
						name = "stone_wall.png";
						solid = true;
						break;
					case "#":
						name = "wood_wall.png";
						solid = true;
						break;
					case "%":
						name = "white_stone_wall.png";
						solid = true;
						break;
					case "D":
						name = "stone_wall_door.png",
						solid = true;
						break;
					case "L":
						name = "stove_left.png";
						solid = true;
						break;
					case "R":
						name = "stove_right.png";
						solid = true;
						break;
					default:
						console.log(char + " is not a valid tile char.");
				}
				tileRow.push(new Tile(name, solid));
			}
			return tileRow;
		});
	}
}