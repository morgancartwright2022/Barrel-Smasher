"use strict"
class Projectile extends Entity {
	constructor(name, x, y, width, height, spriteSrcs, rotation, spd, life, creator) {
		if(!Array.isArray(spriteSrcs))
			spriteSrcs = [spriteSrcs];
		super(name, x, y, width, height, "projectiles/" + spriteSrcs[0]);
		this.rotation = rotation;
		this.spriteSrcs = spriteSrcs;
		this.curSprite = spriteSrcs[0];
		this.rotation = rotation;
		this.life = life;
		this.spd = spd;
		this.creator = creator;
		this.tick = 0;
		this.opacity = 1;
	}
	changeFrame() {
		const curIndex = this.spriteSrcs.findIndex(s => s == this.curSprite);
		if(curIndex + 1 === this.spriteSrcs.length)
			this.curSprite = this.spriteSrcs[0];
		else
			this.curSprite = this.spriteSrcs[curIndex + 1];
		this.changeImg("projectiles/" + this.curSprite);
	}
	checkHit(targets, effect) {
		targets.forEach(ent => {
			if(Array.isArray(ent))
				ent.forEach(ent => {
					if(ent.collision(this) && level.projectiles.includes(this) && ent.exists)
						effect.call(this, ent);
				});
			else {
				if(ent.collision(this) && level.projectiles.includes(this) && ent.exists)
					effect.call(this, ent);
			}
		});
	}
}
function shoot(name, x, y, rotation, life) {
	level.projectiles.push(new name(x, y, rotation, life));
}
class Slash extends Projectile {
	constructor(x, y, life, targets, dir, dist, display, dmg, creator) {
		if(display) audio.play("swoosh.wav");
		let src;
		let pos = {x: x, y: y};
		let angle = 0;
		if(dir === 0 || dir == 1 || dir == 7) {
			pos = {x: x, y: y - dist};
			angle = Math.PI;
			src = "slash_down.png";
		}
		else if(dir == 2 || dir == 3) {
			pos = {x: x + dist, y: y};
			angle = 0;
			src = "slash_side.png";
		}
		else if(dir == 4) {
			pos = {x: x, y: y + dist};
			angle = 0;
			src = "slash_down.png";
		}
		else if(dir == 5 || dir == 6) {
			pos = {x: x - dist, y: y};
			angle = Math.PI;
			src = "slash_side.png";
		}
		super("slash", pos.x, pos.y, 48, 40, src, angle, 0, life, creator);
		if(!display)
			this.opacity = 0;
		scheduler.addTimeout(() => this.checkHit(targets, (ent) => {
			if(ent.hasBuff("holy"))
				creator.harm(Math.floor(dmg * ent.getBuff("holy").pow * 0.1));
			ent.harm(dmg);
		}), 1);
	}
	act() {
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}
class LargeSlash extends Projectile {
	constructor(x, y, life, targets, dir, dist, display, dmg, creator) {
		if(display) audio.play("swoosh.wav");
		let src;
		let pos = {x: x, y: y};
		let angle = 0;
		if(dir === 0 || dir == 1 || dir == 7) {
			pos = {x: x, y: y - dist};
			angle = Math.PI;
			src = "slash_down_large.png";
		}
		else if(dir == 2 || dir == 3) {
			pos = {x: x + dist, y: y};
			angle = 0;
			src = "slash_side_large.png";
		}
		else if(dir == 4) {
			pos = {x: x, y: y + dist};
			angle = 0;
			src = "slash_down_large.png";
		}
		else if(dir == 5 || dir == 6) {
			pos = {x: x - dist, y: y};
			angle = Math.PI;
			src = "slash_side_large.png";
		}
		super("large slash", pos.x, pos.y, 96, 80, src, angle, 0, life, creator);
		if(!display)
			this.opacity = 0;
		scheduler.addTimeout(() => this.checkHit(targets, (ent) => {
			if(ent.hasBuff("holy"))
				creator.harm(Math.floor(dmg * ent.getBuff("holy").pow * 0.1));
			ent.harm(dmg);
		}), 1);
	}
	act() {
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}

class Arrow extends Projectile {
	constructor(x, y, life, targets, rotation, spd, dmg, creator) {
		audio.play("arrow.wav");
		super("arrow", x, y, 64, 12, "arrow.png", rotation, spd, life, creator);
		this.targets = targets;
		this.dmg = dmg;
	}
	act() {
		this.pos.x += Math.cos(this.rotation) * this.spd;
		this.pos.y -= Math.sin(this.rotation) * this.spd;
		this.life--;
		this.tick++;
		if(this.life < 1)
			this.remove();
		this.checkHit(this.targets, (ent) => {
			ent.harm(this.dmg);
			this.remove();
		});
	}
}
class GroundWave extends Projectile {
	constructor(x, y, life, targets, rotation, spd, dmg, creator, pushStrength, pushTime) {
		//audio.play("smash.wav");
		super("ground wave", x, y, 12, 48, "ground_wave.png", rotation, spd, life, creator);
		this.targets = targets;
		this.dmg = dmg;
		this.pushStrength = pushStrength;
		this.pushTime = pushTime;
	}
	act() {
		this.pos.x += Math.cos(this.rotation) * this.spd;
		this.pos.y -= Math.sin(this.rotation) * this.spd;
		this.life--;
		this.tick++;
		if(this.life < 1)
			this.remove();
		this.checkHit(this.targets, (ent) => {
			ent.addBuff(new KnockBack(ent, this.pushStrength, this.pushTime, this.rotation));
			ent.harm(this.dmg);
			this.remove();
		});
	}
}
class MagicMissile extends Projectile {
	constructor(x, y, targets, life, rotation, spd, dmg, creator) {
		audio.play("missile_pew.wav");
		super("magic missile", x, y, 40, 20, ["mgc_missile1.png", "mgc_missile2.png"], rotation, spd, life, creator);
		this.dmg = dmg;
		this.targets = targets;
	}
	act() {
		this.pos.x += Math.cos(this.rotation) * this.spd;
		this.pos.y -= Math.sin(this.rotation) * this.spd;
		this.life--;
		this.tick++;
		if(this.life < 1)
			this.remove();
		this.checkHit(this.targets, (ent) => {
			ent.harm(this.dmg, {magic: true});
			this.remove();
		});
		if(this.tick % 15 == 0)
			this.changeFrame();
	}
}
class Fireball extends Projectile {
	constructor(x, y, targets, fireTargets, life, rotation, spd, minDmg, maxDmg, creator, radius, numFires, duration) {
		audio.play("fire_bolt.wav");
		super("fireball", x, y, 40, 20, ["fire_bolt1.png", "fire_bolt2.png"], rotation, spd, life, creator);
		this.minDmg = minDmg;
		this.maxDmg = maxDmg;
		this.radius = radius;
		this.numFires = numFires;
		this.duration = duration;
		this.targets = targets;
		this.fireTargets = fireTargets;
	}
	remove() {
		audio.play("fire_explosion.wav");
		for(let i = 0; i < this.numFires; i++) {
			const xOffset = Math.floor(Math.random() * this.radius * 2) - this.radius;
			const yOffset = Math.floor(Math.random() * this.radius * 2) - this.radius;
			level.environment.push(new Flame(this.pos.x + xOffset, this.pos.y + yOffset, {dur: this.duration, minDmg: this.minDmg, maxDmg: this.maxDmg, targets: this.fireTargets}));
		}
		this.exists = false;
	}
	act() {
		this.pos.x += Math.cos(this.rotation) * this.spd;
		this.pos.y -= Math.sin(this.rotation) * this.spd;
		this.life--;
		this.tick++;
		if(this.life < 1)
			this.remove();
		this.checkHit(this.targets, () => this.remove());
		if(this.tick % 30 == 0)
			this.changeFrame();
	}
}