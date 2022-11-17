class InvManager {
	constructor(player) {
		this.player = player;
	}
	findByName(itemName) {
		return this.player.inv.find(item => item.name === itemName);
	}
	addToInv(item, options) {
		if(options === undefined) options = {silent: false};
		this.player.inv.push(item);
		if(!options.silent)
			audio.play("collect.wav");
		renderer.addToInvDisplay(item, this);
	}
	removeFromInv(item) {
		this.player.inv.splice(this.player.inv.indexOf(item), 1);
		renderer.removeFromInvDisplay(item);
	}
	consume(item, options) {
		if(options === undefined) options = {silent: false};
		if(!this.player.busy()) {
			const time = this.player.useItemTime;
			this.player.state.using = true;
			this.player.changeFrame("use", this.player.dir);
			this.removeFromInv(item);
			scheduler.addTimeout(() => {
				if(item.sounds && item.sounds.use && !options.silent)
					audio.play(item.sounds.use);
				this.player.state.using = false;
				this.player.changeFrame("stand", this.player.dir);
				if(item.stats.minHpRes != undefined && item.stats.maxHpRes != undefined)
					this.player.heal(item.stats.minHpRes + Math.floor(Math.random() * (item.stats.maxHpRes - item.stats.minHpRes + 1)));
				if(item.stats.minMpRes != undefined && item.stats.maxMpRes != undefined)
					this.player.renewMp(item.stats.minMpRes + Math.floor(Math.random() * (item.stats.maxMpRes - item.stats.minMpRes + 1)));
			}, time);
		}
		item.onUse();
	}
	equip(item, slot, options) {
		if(options === undefined) options = {quick: false, create: false};
		let time = this.player.useItemTime;
		if(options.quick) time = 0;
		this.player.state.using = true;
		this.player.changeFrame("use", this.player.dir);
		if(!options.create) this.removeFromInv(item);
		scheduler.addTimeout(() => {
			this.player.state.using = false;
			if(item.slot == "ring1" && this.player.eq.ring1 != null && this.player.eq.ring2 == null)
				slot = "ring2";
			else if(item.slot == "mainHand" && this.player.eq.mainHand != null && this.player.eq.offHand == null && this.player.dualist)
				slot = "offHand";
			this.player.changeFrame("stand", this.player.dir);
			if(this.player.eq[slot] != null) this.addToInv(this.player.eq[slot]);
			this.player.eq[slot] = item;
			this.player.checkStats();
			renderer.equipDisplay(item, slot, this);
		}, time);
		item.onUse();
	}
	unequip(item, slot, options) {
		if(options === undefined) options = {destroy: false};
		renderer.unequipDisplay(item, slot);
		this.player.eq[slot] = null;
		if(!options.destroy) this.addToInv(item);
		this.player.checkStats();
	}
	drop(item, slot, options) {
		if(options === undefined) options = {destroy: false};
		if(slot == "inv" || slot == undefined) this.removeFromInv(item);
		else this.unequip(item, slot, {destroy: true});
		if(!options.destroy) level.bags.push(new LootBag(this.player.pos.x, this.player.pos.y, [item]));
		this.player.checkStats();
	}
	hasItem(itemName) {
		return this.player.inv.find(item => item.name === itemName) !== undefined;
	}
}