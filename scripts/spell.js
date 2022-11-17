"use strict"
class Spell {
	constructor(name, cost, delayMultiplier, caster, effect) {
		this.name = name;
		this.cost = cost;
		this.delayMultiplier = delayMultiplier;
		this.caster = caster;
		this.effect = effect; //effect(angle, dist, pos)
		this.targets;
	}
}
class OffensiveSpell extends Spell {
	constructor(name, cost, delayMultiplier, caster, effect) {
		super(name, cost, delayMultiplier, caster, effect);
		if(caster.player)
			this.targets = ["dummies", "monsters"];
		else
			this.targets = ["player"];
	}
}
class PersonalSpell extends Spell {
	constructor(name, cost, delayMultiplier, caster, effect) {
		super(name, cost, delayMultiplier, caster, effect);
		if(caster.player)
			this.targets = ["player"];
		else
			this.targets = ["monsters"];
	}
}
class FBall extends OffensiveSpell {
	constructor(caster) {
		super("fireball", 50, 2, caster, (angle, dist) => {
			level.projectiles.push(new Fireball(caster.pos.x, caster.pos.y, this.targets.map(entType => level[entType]).flat(), this.targets, Math.min(dist / 4, caster.stats.spellpower * 20), angle, 4, 10, 20, caster, 60 + caster.stats.spellpower * 5, Math.max(1, caster.stats.spellpower - 1), caster.stats.spellpower * 50));
		});
	}
}
class MMissile extends OffensiveSpell {
	constructor(caster) {
		super("magic missile", 20, 1, caster, (angle) => {
			level.projectiles.push(new MagicMissile (caster.pos.x, caster.pos.y, this.targets.map(entType => level[entType]).flat(), caster.stats.spellpower * 20, angle, 6, 35 + caster.stats.spellpower*3 + Math.floor(Math.random() * (30 + caster.stats.spellpower * 5)), caster));
		});
	}
}
class HAura extends PersonalSpell {
	constructor(caster) {
		super("holy aura", 60, 2, caster, () => {
			caster.addBuff(new Holy(caster, caster.stats.spellpower, 1300 + caster.stats.spellpower*200));
		});
	}
}
class Healing extends PersonalSpell {
	constructor(caster) {
		super("healing", 45, 1, caster, () => {
			caster.addBuff(new Regeneration(caster, caster.stats.spellpower, 300 + caster.stats.spellpower*50));
		});
	}
}
class Entangle extends OffensiveSpell {
	constructor(caster) {
		super("entangle", 60, 1, caster, (_angle, _dist, pos) => {
			const currentTargetEnts = this.targets.map(entType => level[entType]).flat();
			currentTargetEnts.forEach(ent => {
				if(ent.distFromPoint(pos.x, pos.y) < 150 + caster.stats.spellpower * 8) {
					ent.addBuff(new Entangled(ent, 1, 200 + caster.stats.spellpower * 30));
				}
			});
		});
	}
}
class Stealth extends PersonalSpell {
	constructor(caster) {
		super("stealth", 50, 2, caster, () => {
			caster.addBuff(new Invisibility(caster, 1, 500 + caster.stats.spellpower*100));
		});
	}
}