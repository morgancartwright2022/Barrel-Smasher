"use strict"
class Level {
	constructor(width, height, map) {
		this.size = {width: width, height: height};
		this.map = map;
		this.players = [];
		this.monsters = [];
		this.dummies = [];
		this.texts = [];
		this.projectiles = [];
		this.environment = [];
		this.bags = [];
		this.particles = [];
		this.npcs = [];
		this.deadEntities = [];
		this.deadTexts = [];
		this.seed = Math.random();
		this.difficulty = 0;
		this.gameover = false;
	}
	fill() {
		// loads entities and returns player start coordinates
		this.map.fillTiles(this.seed);
		return {x: 100, y: 100}
	}
	startPlayer(player) {
		this.players.push(player);
		controller.setPlayer(player);
		player.start.forEach(s => {
			const item = new s();
			if(player.proficiencies.includes(item.type))
				player.invManager.equip(item, item.slot, {quick: true, create: true});
			else
				player.invManager.addToInv(item, {silent: true});
		});
	}
	addPlayer(player) {
		this.players.push(player);
	}
	switchPlayer(player) {
		controller.setPlayer(player);
		player.checkStats();
	}
	canMove(x, y) {
		const inBounds = level.map.inBounds(x, y);
		const tileFree = level.map.freeAtPosition(x, y);
		return inBounds && tileFree;
	}
	spawnAtPos(x, y, entityClass, type) {
		this[type].push(new entityClass(x, y));
	}
	spawnAtTile(x, y, entityClass, type) {
		const tilePos = this.map.tileIndexToCoords(x, y);
		this[type].push(new entityClass(tilePos.x, tilePos.y - 2));
	}
	findByName(name, type) {
		return this[type].find(ent => ent.name === name);
	}
	getRandom(type) {
		return this[type][Math.floor(Math.random()*this[type].length)];
	}
	changeMapTile(x, y, tile) {
		this.map.changeTile(x, y, tile);
	}
	allAct(delay) {
		const ents = ["players", "monsters", "texts", "particles", "projectiles", "environment", "npcs"];
		ents.forEach(arrName => {
			this[arrName].forEach(e => {
				if(e.exists)
					e.act(delay);
			});
		});
	}
	checkForDead() {
		const ents = ["players", "monsters", "particles", "projectiles", "environment", "dummies", "bags"];
		ents.forEach(arrName => {
			this[arrName].forEach(e => {
				if(!e.exists)
					this.deadEntities.push(e);
			});
			this[arrName] = this[arrName].filter(e => e.exists);
		});
		this.texts.forEach(text => {
			if(!text.exists)
				this.deadTexts.push(text);
		});
		this.texts = this.texts.filter(text => text.exists);
	}
	clearDead() {
		this.deadEntities = [];
		this.deadTexts = [];
	}
}
class Plains extends Level {
	constructor(width, height) {
		super(width, height, new PlainsMap(width, height));
	}
	fill() {
		this.seed = 0.612231345689090; // tmp value, should be random
		this.map.fillTiles(this.seed);
		console.log("Seed: " + this.seed);

		//barrels
		const barrelNum = 120;
		let curBarrel = {x: 0, y: 0};
		const padding = 100;
		for(let i = 0; i < barrelNum; i++) {
			curBarrel.x = this.map.limits.left + padding + Math.floor(Math.random() * (this.map.limits.right - padding));
			curBarrel.y = this.map.limits.top + padding + Math.floor(Math.random() * (this.map.limits.bottom - padding));
			this.dummies.push(new Barrel(curBarrel.x, curBarrel.y));
		}
		const bushNum = Math.floor(200 * this.seed);
		let curBush = {x: 0, y: 0};
		for(let j = 0; j < bushNum; j++) {
			curBush.x = this.map.limits.left + Math.floor(Math.random() * this.map.limits.right);
			curBush.y = this.map.limits.top + Math.floor(Math.random() * this.map.limits.bottom);
			this.environment.push(new Shrub(curBush.x, curBush.y));
		}
		const bigBarrelNum = 5;
		let curBigBarrel = {x: 0, y: 0};
		for(let i = 0; i < bigBarrelNum; i++) {
			curBigBarrel.x = this.map.limits.left + padding + Math.floor(Math.random() * (this.map.limits.right - padding));
			curBigBarrel.y = this.map.limits.top + padding + Math.floor(Math.random() * (this.map.limits.bottom - padding));
			this.dummies.push(new OgreBarrel(curBigBarrel.x, curBigBarrel.y));
		}

		//other stuff
		this.environment.push(new LevelChanger(1000, 40, "castle", {x: 865, y: 1850}));
		return {x: 1000, y: 1000};
	}
}
class Town extends Level {
	constructor() {
		// tmp values, should more flexible later on:
		const width = 15;
		const height = 11;
		super(width, height, new TownMap(width, height));
	}
	fill() {
		this.map.fillTiles(this.seed);
		this.npcs.push(new Joseph(350, 150));
		this.npcs.push(new Sarah(100, 510));
		this.npcs.push(new Lexor(800, 300));
		this.environment.push(new Hay(200, 100));
		this.environment.push(new Hay(210, 180));
		this.environment.push(new Hay(220, 170));
		this.environment.push(new Hay(170, 140));
		return {x: 400, y: 500};
	}
	townMeeting() {
		this.npcs.forEach(npc => npc.talkable = false);
		this.npcs[0].setGoal(410, 450);
		this.npcs[1].setGoal(350, 510);
		this.npcs[2].setGoal(800, 550);
		scheduler.addTimeout(() => this.npcs[2].setGoal(430, 550), 270);
		scheduler.addTimeout(() => this.npcs[0].chatBubble(), 600);
		scheduler.addTimeout(() => this.npcs[1].chatBubble(), 700);
		scheduler.addTimeout(() => this.npcs[2].chatBubble(), 800);
		scheduler.addTimeout(() => this.npcs[0].chatBubble(), 900);
		scheduler.addTimeout(() => this.npcs[1].chatBubble(), 1000);
		scheduler.addTimeout(() => this.npcs[2].chatBubble(), 1100);
		scheduler.addTimeout(() => this.goHome(), 1300);
	}
	goHome() {
		this.npcs.forEach(npc => npc.talkable = true);
		this.npcs[0].setGoal(350, 150);
		this.npcs[1].setGoal(100, 510);
		this.npcs[2].setGoal(805, 550);
		scheduler.addTimeout(() => this.npcs[2].setGoal(800, 300), 370);
	}
}
class Castle extends Level {
	constructor() {
		// tmp values, should more flexible later on:
		const width = 30;
		const height = 30;
		super(width, height, new CastleMap(width, height));
	}
	fill() {
		this.map.fillTiles(this.seed);
		this.spawnAtTile(15, 1, King, "npcs");
		this.spawnAtTile(18, 3, Princess, "npcs");
		this.spawnAtTile(27, 10, Lexor, "npcs");
		this.spawnAtTile(4, 3, Hamar, "npcs");
		this.spawnAtTile(27, 14, Sarah, "npcs");
		this.spawnAtTile(28, 21, Joseph, "npcs");
		this.spawnAtTile(16, 20, Watchman, "npcs");
		this.spawnAtTile(2, 27, George, "npcs");
		this.spawnAtTile(4, 13, Duchess, "npcs");
		this.spawnAtTile(27, 27, Odyss, "npcs");
		this.npcs.forEach(npc => npc.init());
		this.spawnAtTile(24, 22, BeerBarrel, "dummies");
		this.spawnAtTile(24, 23, BeerBarrel, "dummies");
		this.environment.push(new LevelChanger(865, 1920, "plains", {x: 1000, y: 150}));
		this.environment.push(new Shrub(730, 1780));
		this.environment.push(new Shrub(700, 1750));
		this.environment.push(new Shrub(910, 1550));
		this.environment.push(new Shrub(850, 1350));
		this.environment.push(new Shrub(750, 1375));
		this.environment.push(new Hay(1600, 1200));
		this.environment.push(new Hay(1260, 1100));
		this.environment.push(new Hay(1350, 1100));
		this.environment.push(new Hay(1320, 1150));
		this.environment.push(new Pig(1520, 1150));
		this.environment.push(new Bedroll(1800, 1450));
		this.environment.push(new Bedroll(1800, 880));
		this.environment.push(new Bedroll(1800, 750));
		this.environment.push(new CampFire(388, 64));
		this.environment.push(new CampFire(1730, 1728));
		this.environment.push(new Anvil(1630, 1728));
		this.environment.push(new Anvil(1825, 1728));
		this.environment.push(new Table(550, 150));
		this.spawnAtTile(1, 27, Altar, "environment");
		return {x: 800, y: 1500};
	}
}