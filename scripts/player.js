"use strict"
class Player extends Character {
	constructor(name, x, y, stats, sp, proficiencies, start, offsets, spells) {
		super(
			name, x, y, 60, 60, helper.impStdDirImgs("classes/" + name),
			{hp: stats.hp, def: 0, minDmg: 0, maxDmg: 0, moveSpd: stats.moveSpd, atkSpd: 0, range: 0},
			offsets
		);
		this.invManager = new InvManager(this);
		this.player = true;
		this.defaults = {hp: stats.hp, mp: stats.mp, moveSpd: stats.moveSpd};
		this.start = start;
		this.status.gold = 0;
		this.status.mp = stats.mp;
		this.stats.mp = stats.mp;
		this.proficiencies = proficiencies;
		this.spells = {};
		this.useItemTime = 100;
		this.sounds = {hurt: "grunt.wav", block: "block.wav", death: "gameover.wav"};
		if(spells.q)
			this.spells.q = new spells.q(this);
		if(spells.e)
			this.spells.e = new spells.e(this);
		this.inv = [];
		this.eq = {mainHand: null, offHand: null, body: null, head: null, spells: null, ring1: null, ring2: null, neck: null};
		this.ranged = sp.ranged || false;
		this.shielded = sp.shielded || false;
		this.dualist = sp.dualist || false;
		this.caster = stats.mp > 0;
		this.inDialogue = false;
		this.ghosting = false;
		this.npcsMet = [];
	}
	checkStats() {
		const stats = {hp: this.defaults.hp, mp: this.defaults.mp, def: 0, blk: 0, minDmg: 0, maxDmg: 0, offMinDmg: 0, offMaxDmg: 0, moveSpd: this.defaults.moveSpd, atkSpd: 0, offAtkSpd: 0, range: 0, offRange: 0, spellpower: 0, spellCost: 100, castDelay: 0};
		for(const slot in this.eq) {
			if(this.eq[slot] != null) {
				for(const stat in this.eq[slot].stats) {
					if(slot == "offHand" && this.eq[slot].slot == "mainHand") {
						if(stat == "minDmg")
							stats.offMinDmg += this.eq[slot].stats[stat];
						else if(stat == "maxDmg")
							stats.offMaxDmg += this.eq[slot].stats[stat];
						else if(stat == "atkSpd")
							stats.offAtkSpd += this.eq[slot].stats[stat];
						else if(stat == "range")
							stats.offRange += this.eq[slot].stats[stat];
					}
					else if(stat == "dmg") {
						stats.minDmg += this.eq[slot].stats[stat];
						stats.maxDmg += this.eq[slot].stats[stat];
					}
					else
						stats[stat] += this.eq[slot].stats[stat];
				}
				if(this.eq[slot].slot != "mainHand") {
					stats.offMinDmg += (this.eq[slot].stats.minDmg || 0) + (this.eq[slot].stats.dmg || 0);
					stats.offMaxDmg += (this.eq[slot].stats.maxDmg || 0) + (this.eq[slot].stats.dmg || 0);
					stats.offAtkSpd += this.eq[slot].stats.atkSpd || 0;
					stats.offRange += this.eq[slot].stats.range || 0;
				}
			}
		}
		const hpDif = stats.hp - this.stats.hp;
		const mpDif = stats.mp - this.stats.mp;
		this.stats = stats;
		if(hpDif > 0) this.heal(hpDif, false);
		else if(hpDif < 0) this.harm(-hpDif, {hidden: true, ignoreDef: true, nonlethal: true});
		if(mpDif > 0) this.renewMp(mpDif, false);
		else if(mpDif < 0) this.spendMp(-mpDif, false);
	}
	checkDir(keysDown, lastKey) {
		let ret = this.dir;
		if(keysDown.w || lastKey == "w") {
			if(keysDown.d) ret = 1;
			else if(keysDown.a) ret = 7;
			else ret = 0;
		}
		else if(keysDown.d || lastKey == "d") {
			if(keysDown.s) ret = 3;
			else ret = 2;
		}
		else if(keysDown.a || lastKey == "a") {
			if(keysDown.s) ret = 5;
			else ret = 6;
		}
		else if(keysDown.s || lastKey == "s")
			ret = 4
		this.dir = ret;
	}
	checkAtkDir(angle, forceChange) {
		let dir;
		if(angle >= Math.PI/4 && angle <= 3*Math.PI/4) dir = 0;
		else if(angle <= Math.PI/4 || angle >= 7*Math.PI/4) dir = 2;
		else if(angle >= 5*Math.PI/4 && angle <= 7*Math.PI/4) dir = 4;
		else if(angle >= 3*Math.PI/4 && angle <=  5*Math.PI/4) dir = 6;
		if(!this.state.mainAttacking || forceChange)
			this.atkDir = dir;
	}
	collectGold(amount) {
		this.status.gold += amount;
		level.texts.push(new DisplayText(this.pos.x + 8, this.pos.y - 48, "+" + amount, "rgb(250, 175, 0)"));
	}
	spendGold(amount) {
		this.status.gold -= amount;
	}
	spendMp(amount) {
		this.status.mp -= Math.min(amount, this.status.mp);
	}
	renewMp(amount, display) {
		if(display === undefined)
			display = true;
		if(this.caster) {
			amount = Math.min(amount, this.stats.mp - this.status.mp);
			this.status.mp += amount;
			if(display)
				level.texts.push(new DisplayText(this.pos.x, this.pos.y - 48, "+" + amount, "rgb(175, 0, 250)"));
		}
	}
	initAtk(options) {
		if(!this.inDialogue) {
			this.checkAtkDir(controller.mouseAng, true);
			if(options === undefined)
				options = {offHand: false}
			let atkSpd;
			let range;
			if(!options.offHand) {
				atkSpd = this.stats.atkSpd;
				range = this.stats.range;
			}
			else {
				atkSpd = this.stats.offAtkSpd;
				range = this.stats.offRange;
			}
			this.atk(this.dmg(options.offHand), range, atkSpd, [level.monsters, level.dummies], this.atkDir, {directional: true, offHand: options.offHand, ranged: this.ranged, offset: {x: this.offsets.x, y: this.offsets.y}});
		}
	}
	initCast(key, angle, dist, pos) {
		this.checkAtkDir(controller.mouseAng, true);
		if(this.eq.spells && this.spells[key])
			this.cast(this.spells[key], angle, dist, pos);
	}
	initMove() {
		if(!this.inDialogue) {
			this.state.moving = true;
			this.move(this.dir, this.stats.moveSpd, {multiFrame: true});
		}
	}
	stopMv() {
		this.moveTick = 0;
		this.state.moving = false;
		if(!this.busy() && !this.inDialogue)
			this.changeFrame("stand", this.dir);
	}
	talk() {
		let nearestNpc = level.npcs[0];
		level.npcs.forEach(npc => {
			if(npc.distFromPoint(this.pos.x, this.pos.y) < nearestNpc.distFromPoint(this.pos.x, this.pos.y))
				nearestNpc = npc;
		});
		if(nearestNpc.collision(this))
			nearestNpc.hello();
	}
	act() {
		this.mgcRefresh = Math.max(this.mgcRefresh - 1, 0);
		this.tick++;
	}
	remove() {
		level.particles.forEach(particle => {
			if(particle.user === this)
				particle.remove();
		});
		audio.play(this.sounds.death);
		this.exists = false;
		scheduler.addTimeout(() => main.gameover = true, 10);
	}
}

class Wizard extends Player {
	constructor(x, y) {
		super(
			"wizard",
			x, y,
			{hp: 50, mp: 50, moveSpd: 100},
			{},
			["staff", "orb", "robe", "hat", "scroll case", "ring", "amulet"],
			[WoodStaff, OldCase, Robe, MinorHpPotion, MinorMpPotion],
			{x: 0, y: -1},
			{e: FBall, q: MMissile}
		);
	}
}
class Templar extends Player {
	constructor(x, y) {
		super(
			"templar",
			x, y,
			{hp: 50, mp: 50, moveSpd: 100},
			{shielded: true},
			["sword", "shield", "heavy armor", "light armor", "heavy helmet", "light helmet", "holy focus", "ring", "amulet"],
			[Sword, Shield, PlateArmor, HolyFocus, MinorHpPotion, MinorMpPotion],
			{x: 0, y: -12},
			{e: HAura, q: Healing}
		);
	}
}
class Hunter extends Player {
	constructor(x, y) {
		super(
			"hunter",
			x, y,
			{hp: 50, mp: 50, moveSpd: 100},
			{ranged: true},
			["bow", "light armor", "light helmet", "arrows", "satchel", "ring", "amulet"],
			[Bow, Arrows, LeatherArmor, Satchel, MinorHpPotion, MinorMpPotion],
			{x: 0, y: -28},
			{e: Entangle},
		);
	}
}
class Thief extends Player {
	constructor(x, y) {
		super(
			"thief",
			x, y,
			{hp: 50, mp: 50, moveSpd: 100},
			{dualist: true},
			["dagger", "light armor", "light helmet", "cloak", "ring", "amulet"],
			[Dagger, Dagger, LeatherArmor, Cloak, MinorHpPotion, MinorMpPotion],
			{x: 0, y: -16},
			{e: Stealth}
		);
	}
};

//Cheats
function ghostMode() {
	level.players[0].ghosting = true;
	level.players[0].defaults.moveSpd = 300;
	level.players[0].checkStats();
}