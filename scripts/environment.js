"use strict"
class Environment extends Character {
	constructor(name, x, y, width, height, sprites, solid, minDmg, maxDmg, range, targets) {
		if(!Array.isArray(targets))
			targets = [targets];
		let sprite;
		if(sprites === undefined)
			sprite = "misc/invisible.png";
		else if(typeof sprites === "string") {
			sprite = "environment/" + sprites;
			sprites = [sprites];
		}
		else {
			sprite = "environment/" + sprites[0];
		}
		super(name, x, y, width, height, sprite, {minDmg: minDmg, maxDmg: maxDmg || minDmg, range: range});
		this.tick = 0;
		this.sprites = sprites;
		this.solid = solid || false;
		this.targets = targets;
		this.spriteIndex = 0;
	}
	atk() {
		if(!isNaN(this.stats.minDmg)) {
			const targetArr = this.targets.map(entType => level[entType]).flat();
			targetArr.forEach(ent => {
				if(ent.collision(this) && ent.exists)
					ent.harm(this.dmg(), {magic: true, ignoreDef: true});
			});
		}
	}
	nextFrame() {
		this.spriteIndex++;
		if(this.spriteIndex > this.sprites.length - 1)
			this.spriteIndex = 0;
		this.changeImg("environment/" + this.sprites[this.spriteIndex]);
	}
	act() {
		if(this.sprites.length > 1 && this.tick % 50 == 0)
			this.nextFrame();
	}
};
class Flame extends Environment {
	constructor(x, y, props) {
		super("flame", x, y, 48, 36, ["small_fire1.png", "small_fire2.png", "small_fire3.png"], false, props.minDmg, props.maxDmg, 10, props.targets);
		this.dur = props.dur;
		if(this.targets.includes(undefined))
			console.log(this);
	}
	act() {
		if(this.tick % 40 == 0)
			this.atk();
		if(this.tick % 15 == 0)
			this.nextFrame();
		this.tick++;
		if(this.tick > this.dur)
			this.remove();
	}
}
class CampFire extends Environment {
	constructor(x, y) {
		super("camp fire", x, y, 48, 36, ["small_camp_fire1.png", "small_camp_fire2.png", "small_camp_fire3.png"], true);
	}
	act() {
		if(this.tick % 10 == 0)
			this.nextFrame();
		this.tick++;
	}
}
class Shrub extends Environment {
	constructor(x, y) {
		const spriteIndex = Math.floor(Math.random() * 2);
		const sprites = ["shrub1.png", "shrub2.png"];
		super("shrub", x, y, 64, 64, sprites[spriteIndex], false);
	}
}
class DoorFrame extends Environment {
	constructor(x, y) {
		super("door frame", x, y, 64, 64, "door_frame.png", false);
	}
}
class Altar extends Environment {
	constructor(x, y) {
		super("altar", x, y, 64, 64, "altar.png", false);
	}
}
class ShadyMerchant extends Environment {
	constructor(x, y) {
		super("shady merchant", x, y, 64, 64, "merchant.png", false);
		this.inv = [
			new MinorHpPotion(),
			new MinorMpPotion(),
			new DarkBow(),
			new DarkStaff(),
			new SkyDagger(),
			new SkySword(),
			new DualRing()
		];
	}
	updateBuy(player) {
		const buyItems = document.getElementById("buy-items");
		const itemList = buyItems.children;
		const inv = this.inv;
		for(let itemElem of itemList) {
			if(!inv.some(item => item.id + "-box" == itemElem.id))
				itemElem.parentNode.removeChild(itemElem);
		}
		inv.forEach(item => {
			let found = false;
			for(let itemElem of itemList) {
				if(itemElem.id == item.id + "-box")
					found = true;
			}
			if(!found) {
				renderer.addMerchItem(buyItems, item.id, item.value, "imgs/items/" + item.img, () => {
					if(player.status.gold >= item.value) {
						player.spendGold(item.value);
						player.invManager.addToInv(new item.constructor(), {silent: true});
					}
				});
			}
		});
	}
	updateSell(player) {
		const sellItems = document.getElementById("sell-items");
		const itemList = sellItems.children;
		const inv = player.inv;
		for(let itemElem of itemList) {
			if(!inv.some(item => item.id + "-box" == itemElem.id))
				itemElem.parentNode.removeChild(itemElem);
		}
		inv.forEach(item => {
			let found = false;
			for(let itemElem of itemList) {
				if(itemElem.id == item.id + "-box")
					found = true;
			}
			if(!found) {
				renderer.addMerchItem(sellItems, item.id, Math.floor(item.value/2), "imgs/items/" + item.img, () => {
					player.collectGold(Math.floor(item.value/2));
					player.invManager.drop(item, "inv", {destroy: true});
				});
			}
		});
	}
	act() {
		level.players.forEach(player => {
			if(player.collision(this)) {
				this.updateBuy(player);
				this.updateSell(player);
				renderer.dispMerch();
			}
			else {
				renderer.remMerch();
			}
		});
	}
}
class Tent extends Environment {
	constructor(x, y) {
		const spriteIndex = Math.floor(Math.random() * 1);
		const sprites = ["tent1.png"];
		super("tent", x, y, 112, 80, sprites[spriteIndex], true);
	}
}
class HorFence extends Environment {
	constructor(x, y) {
		super("horizontal fence", x, y, 48, 72, "wood_fence1.png", true);
	}
}
class Bedroll extends Environment {
	constructor(x, y) {
		super("bedroll", x, y, 96, 48, "bedroll.png", false);
	}
}
class VerFence extends Environment {
	constructor(x, y) {
		super("vertical fence", x, y, 48, 72, "wood_fence2.png", true);
	}
}
class Hay extends Environment {
	constructor(x, y) {
		super("hay", x, y, 48, 24, "hay.png", false);
	}
}
class Pig extends Environment {
	constructor(x, y) {
		super("pig", x, y, 80, 44, "pig.png", false);
	}
}
class LevelChanger extends Environment {
	constructor(x, y, levelName, playerStart) {
		super("level changer", x, y, 50, 50);
		this.levelName = levelName;
		this.playerStart = playerStart; //{x: Number, y: Number}
	}
	act() {
		level.players.forEach(player => {
			if(player.collision(this)) {
				main.changeLevel(this.levelName, this.playerStart.x, this.playerStart.y)
			}
		})
	}
}
class Table extends Environment {
	constructor(x, y) {
		super("table", x, y, 128, 52, "table.png", false);
	}
}