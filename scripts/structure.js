"use strict"
//ALL WIP
class Structure {
	constructor(x, y) {
		this.pos = {x: x, y: y};
	}
	randomPlace(type, ent, minRadius, maxRadius, num, props, center) {
		if(num === undefined)
			num = 1;
		if(props === undefined)
			props = {};
		if(center === undefined)
			center = this.pos;
		
		for(let i = 0; i < num; i++) {
			const dist = minRadius + Math.random() * (maxRadius - minRadius);
			const radians = Math.random() * 2 * Math.PI;
			const x = center.x + dist * Math.cos(radians);
			const y = center.y - dist * Math.sin(radians);
			level[type].push(new ent(x, y, props));
		}
	}
	spawn() {}
}

class Camp extends Structure {
	constructor(x, y, size) {
		super(x, y);
		this.size = size;
	}
	spawn() {
		this.randomPlace("environment", Tent, 100 + this.size * 3, 100 + this.size * 20, this.size);
		//create(CampFire, this.pos.x, this.pos.y);
		if(this.size >= 20) {
			this.randomPlace("environment", CampFire, 100 + this.size * 4, 100 + this.size * 15, Math.floor(this.size/10));
		}
	}
}
class FenceLine extends Structure {
	constructor(x1, y1, xEnd, yEnd) {
		super(1, y1);
		this.end = {x: xEnd, y:yEnd};
	}
	spawn() {
		if(this.pos.x == this.end.x) {
			/*for(let yCur = this.pos.y; yCur < this.end.y; yCur += 28)
				create(HorFence, this.pos.x, yCur);*/
		}
		else if(this.pos.y == this.end.y) {
			/*for(let xCur = this.pos.x; xCur < this.end.x; xCur += 48)
				create(VerFence, xCur, this.pos.y);*/
		}
	}
}