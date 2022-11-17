"use strict"
class Character extends Entity {
	constructor(name, x, y, width, height, imgs, stats, offsets) {
		if(typeof imgs == "string") {
			super(name, x, y, width, height, imgs);
			this.imgs = {front: {stand: imgs}, side: {}, back: {}};
		}
		else {
			super(name, x, y, width, height, imgs.front.stand);
			this.imgs = imgs;
		}
		this.defaultSize = {width: width, height: height};
		this.stats = {hp: stats.hp, mp: stats.mp, def: stats.def, maxDmg: stats.maxDmg, offMaxDmg: stats.maxDmg, minDmg: stats.minDmg, offMinDmg: stats.minDmg, moveSpd: stats.moveSpd, atkSpd: stats.atkSpd, offAtkSpd: stats.atkSpd, range: stats.range, offRange: stats.range, blk: stats.blk};
		this.status = {hp: stats.hp, mp: stats.mp};
		this.dir = 4;
		this.atkDir = 4;
		this.moveTick = 0;
		this.tick = 0;
		this.mgcRefresh = 0;
		this.state = {mainAttacking: false, offAttacking: false, preparingMainAttack: false, preparingOffAttack: false, blocking: false, moving: false, using: false};
		this.buffs = [];
		this.offsets = offsets || {x: 0, y: 0};
		this.ranged = false;
		this.caster = false;
		this.shielded = false;
		this.dualist = false;
		this.agile = false;
		this.ghosting = false;
	}
	changePos(x, y) {
		if(level.canMove(x + this.size.width/2, this.pos.y) && level.canMove(x- this.size.width/2, this.pos.y))
			this.pos.x = x;
		if(level.canMove(this.pos.x, y) && level.canMove(this.pos.x, y - this.size.height))
			this.pos.y = y
	}
	getHitBox() {
		return {
			left: this.pos.x - this.defaultSize.width/2,
			right: this.pos.x + this.defaultSize.width/2,
			top: this.pos.y - this.defaultSize.height,
			bottom: this.pos.y
		}
	}
	dmg(offHand) {
		if(!offHand)
			return this.stats.minDmg + Math.floor(Math.random() * (this.stats.maxDmg - this.stats.minDmg + 1));
		else
			return this.stats.offMinDmg + Math.floor(Math.random() * (this.stats.offMaxDmg - this.stats.offMinDmg + 1));
	}
	busy() {
		return this.state.mainAttacking || this.state.offAttacking || this.state.blocking || this.state.using;
	}
	active() {
		return this.busy() || this.state.moving;
	}
	changeFrame(variant, dir, options) {
		if(variant === undefined)
			variant = "stand";
		if(dir === undefined)
			dir = this.dir || 4;
		if(options === undefined)
			options = {ranged: false, offHand: false, wideAtk: false};
		
		const dirNameMapper = ["back", "back", "side", "side", "front", "side", "side", "back"];
		let dirName = dirNameMapper[dir];
		
		if(options.offHand) {
			if(variant == "preAtk") variant == "preOffAtk";
			else if(variant == "atk") variant == "offAtk";
		}
		
		if(this.imgs[dirName] === undefined)
			dirName = "front";
		if(this.imgs[dirName][variant] === undefined)
			variant = "stand";
		
		const flipped = (dir == 2 || dir == 3) && dirName == "side";
		if(this.imgs[dirName] != undefined && this.imgs[dirName][variant] != undefined) {
			this.changeImg(this.imgs[dirName][variant], flipped);
			this.flipped = flipped;
		}
		
		if((variant == "atk" || variant == "offAtk") && options.wideAtk)
			this.changeSize(this.defaultSize.width * 2, this.defaultSize.height);
		else
			this.changeSize(this.defaultSize.width, this.defaultSize.height);
	}
	checkCanMove(xDist, yDist) {
		const topLeft = {x: this.pos.x - this.size.width/2, y: this.pos.y - this.size.height};
		const topRight = {x: this.pos.x + this.size.width/2, y: this.pos.y - this.size.height};
		const bottomLeft = {x: this.pos.x - this.size.width/2, y: this.pos.y};
		const bottomRight = {x: this.pos.x + this.size.width/2, y: this.pos.y};
		const xCanMove = level.canMove(topLeft.x + xDist, topLeft.y) && level.canMove(topRight.x + xDist, topRight.y) &&
						 level.canMove(bottomLeft.x + xDist, bottomLeft.y) && level.canMove(bottomRight.x + xDist, bottomLeft.y);
		const yCanMove = level.canMove(topLeft.x, topLeft.y + yDist) && level.canMove(topRight.x, topRight.y + yDist) &&
						 level.canMove(bottomLeft.x, bottomLeft.y + yDist) && level.canMove(bottomRight.x, bottomLeft.y + yDist);
		return {xCanMove, yCanMove};
	}
	move(dir, moveSpd) {
		const animRate = Math.ceil(2000/moveSpd);
		if(!this.busy() && !this.ghosting) {
			if(this.moveTick % animRate === 0)
				this.changeFrame("walk1", dir);
			else if(Math.floor(this.moveTick + animRate / 2) % animRate === 0)
				this.changeFrame("walk2", dir);
		}
		else if(this.ghosting) {
			this.changeFrame("stand", dir);
		}
		
		let dist = (moveSpd || this.stats.moveSpd) / 50;
		if(dir % 2 != 0)
			dist = dist/1.4142;
		if((this.ranged && !this.agile && (this.state.mainAttacking || this.state.offAttacking)) || this.state.using || this.state.blocking || this.hasBuff("entangled"))
			dist = 0;
		else if(!this.agile && (this.state.mainAttacking || this.state.offAttacking))
			dist = dist/2;
		
		const mapper = [
			{y: -dist, x: 0},
			{y: -dist, x: dist},
			{y: 0, x: dist},
			{y: dist, x: dist},
			{y: dist, x: 0},
			{y: dist, x: -dist},
			{y: 0, x: -dist},
			{y: -dist, x: -dist},
			{y: 0, x: 0},
		];
		const xDist = mapper[dir].x;
		const yDist = mapper[dir].y;
		
		const moveSuccess = this.checkCanMove(xDist, yDist);
		if(moveSuccess.xCanMove || this.ghosting)
			this.pos.x += xDist;
		if(moveSuccess.yCanMove || this.ghosting)
			this.pos.y += yDist;
		this.moveTick++;
		return moveSuccess.xCanMove || moveSuccess.yCanMove;
	}
	atk(dmg, range, atkSpd, targets, dir, options) {
		const delay = 4000 / (atkSpd || this.stats.atkSpd);
		if(options === undefined)
			options = {offHand: false, ranged: false, directional: false, large: false, offset: {x: 0, y: 0}};
		if(options.offset === undefined || options.offset.x === undefined || options.offset.y === undefined)
			options.offset = {x: options.offset.x || 0, y: options.offset.y || 0};
		
		function start() {
			if(options.directional)
				this.unblock();
			if(!options.offHand) {
				this.state.mainAttacking = true;
				this.state.preparingMainAttack = true;
				if(!this.state.offAttacking)
					this.changeFrame("preAtk", dir, {offHand: options.offHand});
			}
			else {
				this.state.offAttacking = true;
				this.state.preparingOffAttack = true;
				if(!this.state.mainAttacking)
					this.changeFrame("preOffAtk", dir, {offHand: options.offHand});
			}
		}
		function checkHands() {
			if(this.state.offAttacking && this.state.preparingMainAttack)
				this.changeFrame("preAtk", dir, {offHand: options.offHand})
			if(this.state.mainAttacking && this.state.preparingOffAttack)
				this.changeFrame("preOffAtk", dir, {offHand: options.offHand});
		}
		function action() {
			if(this.exists) {
				if(!options.offHand) {
					this.changeFrame("atk", dir, {offHand: options.offHand, ranged: options.ranged, wideAtk: !options.ranged && options.directional});
					this.state.preparingMainAttack = false;
				}
				else {
					this.changeFrame("offAtk", dir, {offHand: options.offHand, ranged: options.ranged, wideAtk: !options.ranged && options.directional});
					this.state.preparingOffAttack = false;
				}
				let moddedDmg = dmg;
				const stealthMultiplier = 2;
				if(this.isInvisible()) {
					this.removeBuff("invisibility");
					moddedDmg = dmg*stealthMultiplier;
				}
				const arrowSpd = 10;
				if(options.ranged)
					level.projectiles.push(new Arrow(this.pos.x + options.offset.x, this.pos.y + options.offset.y, range, targets, controller.mouseAng, arrowSpd, moddedDmg, this));
				else if(options.large)
					level.projectiles.push(new LargeSlash(this.pos.x + options.offset.x, this.pos.y + options.offset.y, delay / 4, targets, dir, range * 4, options.directional, moddedDmg, this));
				else
					level.projectiles.push(new Slash(this.pos.x + options.offset.x, this.pos.y + options.offset.y, delay / 4, targets, dir, range * 4, options.directional, moddedDmg, this));
			}
		}
		function reset() {
			if(!options.offHand)
				this.state.mainAttacking = false;
			else
				this.state.offAttacking = false;
			if(controller.keysDown.shift)
				this.block();
			else if(!this.state.mainAttacking && !this.state.offAttacking && !this.state.preparingMainAttack && !this.state.preparingOffAttack)
				this.changeFrame("stand", dir);
		}
		if(
			!this.state.using && !this.state.block &&
			(!this.state.mainAttacking && !this.state.preparingOffAttack && !options.offHand || !this.state.offAttacking && !this.state.preparingMainAttack && options.offHand && this.dualist)
		) {
			start.call(this);
			scheduler.addTimeout(() => checkHands.call(this), delay * 0.1);
			scheduler.addTimeout(() => action.call(this), delay * 0.5);
			scheduler.addTimeout(() => reset.call(this), delay);
		}
	}
	block() {
		if(!this.busy() && this.shielded && this.stats.blk > 0) {
			this.state.blocking = true;
			this.changeFrame("blk", this.dir);
		}
	}
	unblock() {
		if(this.state.blocking) {
			this.state.blocking = false;
			this.changeFrame("stand", this.dir);
		}
	}
	harm(amount, options) {
		if(options === undefined)
			options = {hidden: false, ignoreDef: false, nonlethal: false, magic: false};
		
		if(!options.ignoreDef) {
			amount = Math.max(amount - this.stats.def, Math.ceil(amount/20));
			if(this.state.blocking)
				amount = Math.floor(amount/(this.stats.blk / 10));
		}
		if(options.magic && this.stats.mgcResist) {
			amount = Math.floor(amount * (1 - this.stats.mgcResist/100));
		}
		const dispLoss = Math.max(Math.min(amount, this.status.hp), 1)
		this.status.hp -= amount;
		if(!options.hidden && this.player)
			level.texts.push(new DisplayText(this.pos.x, this.pos.y - this.size.height, "-" + dispLoss, "rgb(250, 0, 0)"));
		else if(!options.hidden)
			level.texts.push(new DisplayText(this.pos.x, this.pos.y - this.size.height, "-" + dispLoss, "rgb(200, 0, 0)"));
		if(this.status.hp < 1 && !options.nonlethal)
			this.remove();
		else if(this.sounds && !options.hidden) {
			if(this.state.blocking && this.sounds.block && !options.ignoreDef)
				audio.play(this.sounds.block, 10);
			else if(this.sounds.hurt)
				audio.play(this.sounds.hurt, 10);
		}
	}
	heal(amount, display) {
		if(display === undefined) display = true;
		amount = Math.min(amount, this.stats.hp - this.status.hp)
		this.status.hp += amount;
		if(display)
			level.texts.push(new DisplayText(this.pos.x, this.pos.y - this.size.height, "+" + amount, "rgb(0, 250, 0)"));
	}
	removeBuff(name) {
		if(this.hasBuff(name)) {
			const buff = this.buffs.find(buff => buff.name === name);
			if(buff.visible && buff.revVisuals)
				buff.revVisuals();
			return this.buffs.splice(this.buffs.indexOf(buff), 1);
		}
			else return null;
	}
	addBuff(buff) {
		this.buffs.push(buff);
		if(buff.visible && buff.visuals)
			buff.visuals();
		if(buff.active)
			scheduler.addInterval(buff.effect, buff.dur, buff.freq);
		scheduler.addTimeout(() => this.removeBuff(buff.name), buff.dur);
	}
	getBuff(name) {
		return this.buffs.find(buff => buff.name === name);
	}
	hasBuff(name) {
		return this.buffs.find(buff => buff.name === name) != undefined;
	}
	isInvisible() {
		return this.hasBuff("invisibility");
	}
	cast(spell, angle, dist, pos) {
		if(!this.busy() && this.mgcRefresh === 0 && this.status.mp >= spell.cost) {
			this.mgcRefresh = 10000 / this.stats.castDelay * spell.delayMultiplier;
			this.changeFrame(null, this.atkDir);
			spell.effect(angle, dist, pos);
			const mpCostMult = this.stats.spellCost || 100;
			this.spendMp(spell.cost * mpCostMult/100);
		}
	}
}