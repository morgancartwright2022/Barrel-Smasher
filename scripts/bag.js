let bagId = 0;
class LootBag extends Entity {
	constructor(x, y, loot) {
		super("loot bag", x, y, 32, 32, "misc/loot_bag1.png");
		this.changeImg("misc/loot_bag1.png");
		this.loot = loot;
		loot.forEach(item => item.button = null);
		this.id = "bag" + bagId;
		bagId++;
		this.lastTake = 0;
	}
	takeAll(player) {
		for(let i = this.loot.length - 1; i >= 0; i--) {
			this.take(this.loot[i], player);
		}
	}
	take(item, player) {
		player.invManager.addToInv(item);
		this.loot.splice(this.loot.indexOf(item), 1);
		if(this.loot.length < 1) this.remove();
	}
	insert(item) {
		//WIP
		this.loot.push(item);
	}
}