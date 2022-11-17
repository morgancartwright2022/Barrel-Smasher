"use strict"
class Monster extends Character {
	constructor(name, x, y, width, height, imgs, stats, gold, inv, sounds, start, agile, offset) {
		super(name, x, y, width, height, imgs, stats, offset);
		this.player = false;
		this.agile = agile || false;
		if(gold === undefined) gold = {minGp: 0, maxGp: 0};
		this.loot = {minGp: gold.minGp, maxGp: gold.maxGp};
		this.inv = [];
		if(inv != undefined) {
			inv.forEach(item => {
				if(Math.random() < item.chance)
					this.inv.push(new item.name());
			});
		}
		if(start == undefined) start = {phase: 0, tick: 0, direction: 4};
		this.sounds = sounds || {};
		this.phase = start.phase || 0;
		this.tick = start.tick || 0;
		this.dir = start.dir || 4;
	}
	remove() {
		if(this.sounds && this.sounds.death) audio.play(this.sounds.death);
		level.particles.forEach(par => {
			if(par.user === this)
				par.remove();
		});
		if(this.loot.minGp && this.loot.maxGp)
			level.players.forEach(player => player.collectGold(this.loot.minGp + Math.floor(Math.random() * (this.loot.minGp - this.loot.minGp + 1))));
		if(this.inv.length > 0)
			level.bags.push(new LootBag(this.pos.x, this.pos.y, this.inv));
		this.exists = false;
		main.broadcastEvent("kill");
	}
	reverseDir(dir) {
		let revDir = dir + 4;
		if(revDir > 7)
			revDir -= 8;
		return revDir;
	}
	randomDir() {
		return Math.floor(Math.random() * 8);
	}
	nearestPlayer(options) {
		if(options === undefined) options = {seeInvisible: false};
		let nearest = level.players.find(player => !player.isInvisible() || options.seeInvisible);
		if(nearest) {
			level.players.forEach(player => {
				if(player.distFromPoint(this.pos.x, this.pos.y) < nearest.distFromPoint(this.pos.x, this.pos.y) && (!player.isInvisible() || options.seeInvisible))
					nearest = player;
			});
		}
		return nearest;
	}
	playerDist(player) {
		if(player)
			return this.distFromPoint(player.pos.x, player.pos.y);
		else
			return 1000;
	}
	nearestPlayerDist() {
		return this.playerDist(this.nearestPlayer());
	}
	playerDir(player) {
		const x1 = Math.floor(this.pos.x + this.offsets.x);
		const y1 = Math.floor(this.pos.y + this.offsets.y);
		const x2 = Math.floor(player.pos.x);
		const y2 = Math.floor(player.pos.y);
		
		let angle = Math.atan(-(y2 - y1)/(x2 - x1));
		angle *= 180/Math.PI;
		if(x2 < x1)
			angle += 180;
		else if(y2 > y1)
			angle += 360;
		
		let dir;
		if(angle >= 67.5 && angle <= 112.5) dir = 0;
		else if(angle >= 22.5 && angle <= 67.5) dir = 1;
		else if(angle >= 337.5 || angle <= 22.5) dir = 2;
		else if(angle >= 292.5 && angle <= 337.5) dir = 3;
		else if(angle >= 247.5 && angle <= 292.5) dir = 4;
		else if(angle >= 202.5 && angle <= 247.5) dir = 5;
		else if(angle >= 157.5 && angle <= 202.5) dir = 6;
		else dir = 7;
		return dir;
	}
	atkPlayerDir(player) {
		const x1 = Math.floor(this.pos.x + this.offsets.x);
		const y1 = Math.floor(this.pos.y + this.offsets.y);
		const x2 = Math.floor(player.pos.x);
		const y2 = Math.floor(player.pos.y);
		
		const pi = Math.PI;
		let angle = Math.atan(-(y2 - y1)/(x2 - x1));
		if(x2 < x1)
			angle += pi;
		else if(y2 > y1)
			angle += 2*pi;
		angle *= 180/pi;
		
		let dir;
		if(angle >= 45 && angle <= 135) dir = 0;
		else if(angle <= 45 || angle >= 315) dir = 2;
		else if(angle >= 225 && angle <= 315) dir = 4;
		else if(angle >= 135 && angle <= 225) dir = 6;
		return dir;
	}
	changePhase(nextPhase) {
		this.phase = nextPhase;
		this.tick = 1;
		this.unblock();
	}
	checkPhase(dur, nextPhase) {
		if(this.tick == dur) {
			this.changePhase(nextPhase);
		}
	}
	wander(dur, moveSpd, changeRate, nextPhase) {
		if(this.tick % changeRate == 0)
			this.dir = this.randomDir();
		const moveSucc = this.move(this.dir, moveSpd);
		if(!moveSucc)
			this.dir = this.randomDir();
		this.checkPhase(dur, nextPhase);
	}
	standardAction(dur, moveSpd, changeRate, nextPhase, action) {
		const nearest = this.nearestPlayer();
		if(!nearest)
			this.wander(dur, moveSpd, changeRate, nextPhase);
		else {
			action(nearest);
		}
		this.checkPhase(dur, nextPhase);
	}
	amble(dur, moveSpd, changeRate, nextPhase) {
		this.standardAction(dur, moveSpd, changeRate, nextPhase, player => {
			if(this.tick % changeRate == 0) {
				let lowerDir = this.playerDir(player) - 1;
				let upperDir = this.playerDir(player) + 1;
				if(lowerDir < 0)
					lowerDir = 7;
				if(upperDir > 7);
					upperDir = 8;
				do {
					this.dir = this.randomDir();
				} while(this.dir != lowerDir && this.dir != this.playerDir(player) && this.dir != upperDir);
			}
			if(this.playerDist(player) > Math.max(this.stats.range * 3, 16)) {
				const moveSucc = this.move(this.dir, moveSpd);
				if(!moveSucc)
					this.dir = this.randomDir();
			}
			else if(!this.state.mainAttacking)
				this.changeFrame("stand", this.dir);
		});
	}
	flee(dur, moveSpd, nextPhase) {
		this.standardAction(dur, moveSpd, 0, nextPhase, player => {
			this.dir = this.reverseDir(this.playerDir(player));
			this.move(this.dir, moveSpd);
		});
	}
	hunt(dur, moveSpd, nextPhase) {
		this.standardAction(dur, moveSpd, 0, nextPhase, player => {
			if(this.playerDist(player) > Math.max(this.stats.range * 3, 16)) {
				this.dir = this.playerDir(player);
				this.move(this.dir, moveSpd);
			}
			else if(!this.state.blocking)
				this.changeFrame("stand", this.dir);
		});
	}
	charge(dur, moveSpd, changeRate, nextPhase) {
		this.standardAction(dur, moveSpd, changeRate, nextPhase, player => {
			if(this.tick % changeRate == 0 || this.tick == 2)
				this.dir = this.playerDir(player);
			const moveSucc = this.move(this.dir, moveSpd);
			if(!moveSucc)
				this.dir = this.randomDir();
		});
	}
	strafe(dur, moveSpd, changeRate, nextPhase) {
		this.standardAction(dur, moveSpd, changeRate, nextPhase, player => {
			if(this.tick % changeRate == 0) {
				if(this.playerDist(player) > Math.max(this.stats.range * 3, 16))
					this.dir = this.playerDir(player);
				else
					this.dir = this.randomDir();
			}
			const moveSucc = this.move(this.dir, moveSpd);
			if(!moveSucc)
				this.dir = this.randomDir();
		});
	}
	multiAtk(atkRate, directional) {
		if(this.tick % atkRate === 0)
			this.atk(this.dmg(), this.stats.range, this.stats.atkSpd, level.players, this.dir, {directional: directional, offset: this.offsets});
	}
	targetedMultiAtk(atkRate, directional, large) {
		const player = this.nearestPlayer();
		if(this.tick % atkRate === 0 && player) {
			this.dir = this.atkPlayerDir(player);
			this.atk(this.dmg(), this.stats.range, this.stats.atkSpd, level.players, this.dir, {directional: directional, offset: this.offsets, large: large});
		}
	}
	multiBlk(blkRate, blkDur) {
		if(this.tick % blkRate == 0)
			this.block()
		else if((this.tick - blkDur) % blkRate == 0)
			this.unblock();
	}
	defend(dur, nextPhase) {
		if(this.tick < dur)
			this.block()
		else
			this.unblock();
		this.checkPhase(dur, nextPhase);
	}
	jump(dur, crouchTime, maxSpd, nextPhase) {
		if(this.tick < crouchTime)
			this.changeFrame("crouch", this.dir);
		else {
			this.changeFrame("stand", this.dir);
			let spd = (2*(this.tick - crouchTime)/(dur - crouchTime) - 1)*maxSpd;
			this.changePos(this.pos.x, this.pos.y + spd);
		}
		this.checkPhase(dur, nextPhase);
	}
	slam(minDmg, maxDmg, life, spd, pushStrength, pushTime) {
		const dmg = minDmg + Math.floor(Math.random()*(maxDmg - minDmg + 1));
		const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
		rotations.forEach(rotation => {
			const proj = new GroundWave(this.pos.x, this.pos.y, life, level.players, rotation, spd, dmg, this, pushStrength, pushTime);
			level.projectiles.push(proj);
		});
	}
	act() {}
}
function spawn(name, x, y) {
	level.monsters.push(new name(x, y));
};

class Barrel extends Monster {
	constructor(x, y) {
		super("barrel", x, y, 56, 56, helper.impRandomImg(["enemies/barrel3.png", "enemies/barrel4.png"]),
			{hp: 50, def: 0, minDmg: 0, maxDmg: 0, moveSpd: 0, atkSpd: 0, range: 0},
			{},
			[{name: MinorHpPotion, chance: 0.15}, {name: MinorMpPotion, chance: 0.15}],
			{hurt: "barrel_hit.wav", death: "barrel_smash.wav"}
		);
		this.maxMons = 10;
	}
	remove() {
		if(this.sounds && this.sounds.death) audio.play(this.sounds.death);
		if(Math.random() > 0.8)
			level.players.forEach(player => player.collectGold(Math.max(Math.ceil(Math.random() * 6) - 3, 1)));
		let curMons = 0;
		if(Math.random() * (1 + level.difficulty*0.01) > 0.7 && curMons < this.maxMons) {
			spawnMons.call(this);
			curMons++;
		}
		
		function spawnMons() {
			const roll = Math.ceil(Math.random() * 6);
			if(roll == 1 || roll == 2)
				spawn(Spirit, this.pos.x, this.pos.y);
			else if(roll == 3)
				spawn(Ghost, this.pos.x, this.pos.y);
			else if(roll == 4)
				spawn(Slime, this.pos.x, this.pos.y);
			else if(roll == 5 || roll == 6)
				spawn(Skeleton, this.pos.x, this.pos.y);
			if(Math.random() * (1 + level.difficulty*0.01) > 0.9)
				spawnMons.call(this);
		}
		if(this.inv.length > 0)
			level.bags.push(new LootBag(this.pos.x, this.pos.y, this.inv));
		level.difficulty++;
		this.exists = false;
	}
}
class BeerBarrel extends Monster {
	constructor(x, y) {
		super("beer barrel", x, y, 56, 56, helper.impRandomImg(["enemies/barrel3.png", "enemies/barrel4.png"]),
			{hp: 50, def: 0, minDmg: 0, maxDmg: 0, moveSpd: 0, atkSpd: 0, range: 0},
			{},
			[{name: Beer, chance: 1}],
			{hurt: "barrel_hit.wav", death: "barrel_smash.wav"}
		);
	}
	remove() {
		audio.play(this.sounds.death);
		if(this.inv.length > 0)
			level.bags.push(new LootBag(this.pos.x, this.pos.y, this.inv));
		this.exists = false;
		main.broadcastEvent("destroy beer barrel");
	}
}
class OgreBarrel extends Monster {
	constructor(x, y) {
		super("ogre barrel", x, y, 72, 72, "enemies/barrel3.png",
			{hp: 50, def: 0, minDmg: 0, maxDmg: 0, moveSpd: 0, atkSpd: 0, range: 0},
			{},
			[{name: MinorHpPotion, chance: 0.15}, {name: MinorMpPotion, chance: 0.15}],
			{hurt: "barrel_hit.wav", death: "barrel_smash.wav"}
		);
	}
	remove() {
		if(this.sounds && this.sounds.death) audio.play(this.sounds.death);
		spawn(Ogre, this.pos.x, this.pos.y)
		this.exists = false;
	}
}


class Spirit extends Monster {
	constructor(x, y) { 
		super("spirit", x, y, 64, 64, {front: {stand: "enemies/spirit.png", atk: "enemies/spirit_atk.png"}},
			{hp: 100, def: 3, minDmg: 20, maxDmg: 35, moveSpd: 70, atkSpd: 130, range: 0},
			{minGp: 3, maxGp: 5},
			[{name: OldHat, chance: 0.1}, {name: LeatherHelmet, chance: 0.1}, {name: MetalHelmet, chance: 0.1}],
			{hurt: "ghost_hurt.wav", death: "ghost_death.wav"},
			{tick: 75},
			true
		);
	}
	act() {
		if(this.phase == 0) {
			this.wander(150, this.stats.moveSpd, 50, 1);
		}
		else if(this.phase == 1) {
			this.multiAtk(80);
			this.charge(250, this.stats.moveSpd, 100, 0);
		}
		this.tick++;
	}
}
class Ghost extends Monster {
	constructor(x, y) {
		super("ghost", x, y, 64, 64, {front: {stand: "enemies/ghost.png", atk: "enemies/ghost_atk.png"}},
			{hp: 80, def: 0, minDmg: 15, maxDmg: 30, moveSpd: 130, atkSpd: 300, range: 0},
			{minGp: 3, maxGp: 6},
			[{name: LesserSpdRing, chance: 0.15}, {name: OldOrb, chance: 0.05}],
			{hurt: "ghost_hurt.wav", death: "ghost_death.wav"},
			{},
			true
		);
	}
	act() {
		if(this.phase == 0) {
			this.opacity = 1
			this.wander(200, this.stats.moveSpd, 100, 1);
		}
		else if(this.phase == 1) {
			if(this.tick > 100)
				this.multiAtk(25);
			this.hunt(200, this.stats.moveSpd, 2);
		}
		else if(this.phase == 2) {
			this.opacity = 0;
			this.wander(100, this.stats.moveSpd, 75, 0);
		}
		this.tick++;
	}
}
class Slime extends Monster {
	constructor(x, y) {
		super("slime", x, y, 64, 64, {front: {stand: "enemies/orange_slime.png", walk1: "enemies/orange_slime.png", walk2: "enemies/orange_slime_move.png", atk: "enemies/orange_slime_atk.png"}},
			{hp: 150, def: 0, minDmg: 20, maxDmg: 50, moveSpd: 65, atkSpd: 150, range: 0}, 
			{minGp: 2, maxGp: 4},
			[{name: LesserWarriorAmulet, chance: 0.1}],
			{hurt: "slime_hurt.wav", death: "slime_death.wav"},
			{phase: 2, tick: 100}
		);
	}
	act() {
		if(this.phase == 0) {
			if(this.nearestPlayerDist() < 20) {
				this.phase = 1;
				this.tick = 40;
			}
			else
				this.hunt(400, this.stats.moveSpd, 1);
		}
		else if(this.phase == 1) {
			this.multiAtk(40);
			this.checkPhase(100, 2);
		}
		else if(this.phase == 2) {
			this.wander(150, this.stats.moveSpd, 50, 0);
		}
		this.tick++;
	}
}
class Skeleton extends Monster {
	constructor(x, y) {
		super("skeleton", x, y, 64, 64, helper.impStdDirImgs("enemies/skeleton"), 
			{hp: 120, def: 5, minDmg: 20, maxDmg: 35, moveSpd: 42, atkSpd: 70, range: 12, mgcResist: 5},
			{minGp: 3, maxGp: 4},
			[{name: LesserMpRing, chance: 0.15}, {name: LesserHpRing, chance: 0.15}],
			{hurt: "skeleton_hurt.wav", death: "skeleton_death.wav"},
			{phase: 2, tick: 101},
			false,
			{x: 0, y: -10}
		);
	}
	act() {
		if(this.nearestPlayerDist() > 150) {
			this.amble(150, this.stats.moveSpd, 100, 0);
		}
		else if(this.phase == 0) {
			this.strafe(300, this.stats.moveSpd, 50, 2);
			this.targetedMultiAtk(100, true);
		}
		else if(this.phase == 2) {
			this.wander(150, this.stats.moveSpd, 100, 0);
			this.targetedMultiAtk(100, true);
		}
		this.tick++;
	}
}
class Ogre extends Monster {
	constructor(x, y) {
		super("ogre", x, y, 96, 96, helper.impStdDirImgs("enemies/ogre"), 
			{hp: 400, def: 4, minDmg: 20, maxDmg: 50, moveSpd: 30, atkSpd: 50, range: 22, blk: 40, mgcResist: 10},
			{minGp: 15, maxGp: 30},
			[{name: MagusRobe, chance: 0.2}, {name: StuddedLeatherArmor, chance: 0.2}, {name: SkyArmor, chance: 0.2}, {name: BarkShield, chance: 0.5}, {name: BarbarianNecklace, chance: 0.5}],
			{hurt: "ogre_hurt.wav", death: "ogre_death.wav", block: "ogre_block.wav"},
			{phase: 0, tick: 0},
			false,
			{x: 0, y: -10}
		);
		this.shielded = true;
		this.rage = false;
		this.phaseTime = 500;
	}
	act() {
		if(this.status.hp < 100 && !this.rage) {
			this.rage = true;
			this.stats.moveSpd = 50;
			this.stats.atkSpd = 70;
			this.phaseTime = 250;
		}
		if(this.hasBuff("entangled") && this.nearestPlayerDist() > 150) {
			this.changePhase(7);
		}
		if(this.phase == 0) {
			const random = Math.random();
			if(this.nearestPlayerDist() > 200) {
				if(random > 0.5 || this.rage)
					this.phase = 1;
				else
					this.phase = 2;
			}
			else if(this.nearestPlayerDist() > 80) {
				if(random > 0.7 || this.rage)
					this.phase = 3;
				else if(random > 0.2)
					this.phase = 4;
				else
					this.phase = 5;
			}
			else {
				if(random > 0.5 || this.rage)
					this.phase = 5;
				else
					this.phase = 6;
			}
		}
		if(this.phase == 1) {
			if(this.nearestPlayerDist() <= 110)
				this.changePhase(0);
			else
				this.charge(this.phaseTime, this.stats.moveSpd*2.4, 400, 0);
		}
		else if(this.phase == 2) {
			if(this.nearestPlayerDist() <= 110)
				this.changePhase(0);
			else {
				this.hunt(this.phaseTime, this.stats.moveSpd*1.2, 0);
				this.multiBlk(100, 50);
			}
		}
		if(this.phase == 3) {
			this.amble(this.phaseTime, this.stats.moveSpd, 100, 0);
			this.targetedMultiAtk(60, true, true);
		}
		else if(this.phase == 4) {
			this.strafe(this.phaseTime, this.stats.moveSpd, 150, 0)
			this.targetedMultiAtk(75, true, true);
			this.multiBlk(50, 30);
		}
		else if(this.phase == 5) {
			this.jump(70, 50, 1.5, 5.5);
		}
		else if(this.phase == 5.5) {
			this.slam(20, 30, 200, 2, 4, 30);
			this.phase = 0;
			this.tick = 1;
		}
		else if(this.phase == 6) {
			if(this.nearestPlayerDist() > 80) {
				this.changePhase(0);
			}
			else
				this.flee(this.phaseTime, this.stats.moveSpd, 0);
		}
		else if(this.phase == 7) {
			this.defend(100, 0);
		}
		this.tick++;
	}
}