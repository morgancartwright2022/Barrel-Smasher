"use strict"
class DisplayText {
	constructor(x, y, message, color, speedMod, lifeMod) {
		if(!speedMod) speedMod = 1;
		if(!lifeMod) lifeMod = 1;
		this.name = "text";
		this.id = this.name + entNum;
		entNum++;
		this.pos = {x: x, y: y};
		this.size = {width: 50, height: 30};
		this.exists = true;
		this.className = "display-text";
		this.color = color;
		this.message = message;
		this.life = 50*lifeMod;
		this.spd = 2*speedMod;
	}
	act() {
		this.pos.y -= this.spd;
		this.life--;
		if(this.life < 1) {
			this.exists = false;
		}
	}
}
class WideText {
	constructor(x, y, message, color, speedMod, lifeMod) {
		if(speedMod === undefined) speedMod = 1;
		if(!lifeMod) lifeMod = 1;
		this.name = "text";
		this.id = this.name + entNum;
		entNum++;
		this.pos = {x: x, y: y};
		this.size = {width: 300, height: 300};
		this.exists = true;
		this.className = "wide-text";
		this.color = color;
		this.message = message;
		this.life = 50*lifeMod;
		this.spd = 2*speedMod;
	}
	act() {
		this.pos.y -= this.spd;
		this.life--;
		if(this.life < 1) {
			this.exists = false;
		}
	}
}