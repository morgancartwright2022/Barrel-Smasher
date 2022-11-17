"use strict"
class Buff {
	constructor(name, active, positive, visible, pow, dur, visuals, effect, freq, revVisuals) {
		if(visible === undefined)
			visible = true;
		this.name = name;
		this.active = active;
		this.positive = positive;
		this.visible = visible;
		this.pow = pow;
		this.dur = dur;
		this.visuals = visuals;
		this.effect = effect;
		this.freq = freq;
		this.revVisuals = revVisuals;
	}
}
class Holy extends Buff {
	constructor(target, pow, dur, visible) {
		super("holy", false, true, visible, pow, dur, () => {
			level.particles.push(new HolyAura(target.pos.x, target.pos.y, 72, 72, this.dur, 0.01, target));
		});
	}
}
class Regeneration extends Buff {
	constructor(target, pow, dur, visible) {
		super("healing", true, true, visible, pow, dur, () => {
			level.particles.push(new Hearts(target.pos.x, target.pos.y, 72, 72, this.dur, 0.8, 40, target));
		},	() => {
			target.heal(this.pow, false);
		}, 50);
	}
}
class Entangled extends Buff {
	constructor(target, pow, dur, visible) {
		super("entangled", false, false, visible, pow, dur, () => {
			level.particles.push(new Vines(target.pos.x, target.pos.y, 72, 72, dur, target));
		});
	}
}
class Invisibility extends Buff {
	constructor(target, pow, dur, visible) {
		super("invisibility", false, true, visible, pow, dur, () => {
			target.opacity = 0.5;
		},
		null, 0,
		() => {
			target.opacity = 1;
		});
	}
}
class KnockBack extends Buff {
	constructor(target, pow, dur, rotation) {
		super("knockback", true, false, false, pow, dur, null, () => {
			const dx = Math.cos(this.rotation) * this.pow;
			const dy = Math.sin(this.rotation) * this.pow;
			target.changePos(target.pos.x + dx, target.pos.y + dy);
		}, 1);
		this.rotation = rotation;
	}
}
