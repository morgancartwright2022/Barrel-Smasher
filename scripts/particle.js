class Particle extends Entity {
	constructor(name, x, y, width, height, spriteSrcs, rotation, life) {
		if(!Array.isArray(spriteSrcs))
			spriteSrcs = [spriteSrcs];
		super(name, x, y, width, height, "particles/" + spriteSrcs[0]);
		this.rotation = rotation;
		this.spriteSrcs = spriteSrcs;
		this.rotation = rotation;
		this.life = life;
	}
	rise(dist) {
		this.pos.y -= dist;
	}
	turn(deg) {
		this.rotation += deg;
	}
	duplicate(x, y) {
		level.particles.push(new this.constructor(x, y, this.size.width, this.size.height, this.life));
	}
	act() {
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}
class HolyAura extends Particle {
	constructor(x, y, width, height, life, turnSpd, user) {
		super("holy aura", x, y, width, height, "holy_aura.png", 0, life);
		this.turnSpd = turnSpd;
		this.user = user;
	}
	act() {
		this.pos.x = this.user.pos.x;
		this.pos.y = this.user.pos.y;
		this.turn(this.turnSpd);
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}
class Hearts extends Particle {
	constructor(x, y, width, height, life, riseSpd, dupeRate, user) {
		super("hearts", x, y, width, height, "hearts.png", 0, life);
		this.riseSpd = riseSpd;
		this.dupeRate = dupeRate;
		this.user = user;
	}
	duplicate(x, y) {
		level.particles.push(new this.constructor(x, y, this.size.width, this.size.height, this.life - 1, this.riseSpd, this.dupeRate, this.user));
	}
	act() {
		this.rise(this.riseSpd);
		if(this.life % this.dupeRate === 0) {
			this.duplicate(this.user.pos.x, this.user.pos.y);
			this.remove();
		}
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}
class Vines extends Particle {
	constructor(x, y, width, height, life, user) {
		super("vines", x, y, width, height, "vines.png", 0, life);
		this.user = user;
	}
	act() {
		this.pos.x = this.user.pos.x;
		this.pos.y = this.user.pos.y;
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}
class Chat extends Particle {
	constructor(x, y, life) {
		super("chat", x, y, 40, 28, "chat1.png", 0, life);
	}
	act() {
		this.life--;
		if(this.life < 1)
			this.remove();
	}
}