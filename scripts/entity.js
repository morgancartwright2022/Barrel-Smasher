"use strict"
let entNum = 0;
class Entity {
	constructor(name, x, y, width, height, imgSrc) {
		this.name = name;
		this.id = name + entNum;
		entNum++;
		this.pos = {x: x, y: y};
		this.size = {width: width, height: height};
		this.exists = true;
		this.imgSrc = imgSrc;
		this.opacity = 1;
		this.changeImg(imgSrc);
	}
	remove() {
		this.exists = false;
	}
	changeSize(width, height) {
		this.size.width = width;
		this.size.height = height;
	}
	changePos(x, y) {
		this.pos.x = x;
		this.pos.y = y;
	}
	changeImg(img) {
		this.imgSrc = img;
	}
	getHitBox() {
		return {
			left: this.pos.x - this.size.width/2,
			right: this.pos.x + this.size.width/2,
			top: this.pos.y - this.size.height,
			bottom: this.pos.y
		}
	}
	collision(entity) {
		const hitBox1 = this.getHitBox();
		const hitBox2 = entity.getHitBox();
		return (hitBox1.right >= hitBox2.left && hitBox1.left <= hitBox2.right &&
				hitBox1.bottom >= hitBox2.top && hitBox1.top <= hitBox2.bottom);
	}
	containsPoint(x, y) {
		const hitBox = this.getHitBox();
		return (hitBox.left <= x && hitBox.right >= x &&
				hitBox.top <= y && hitBox.bottom >= y);
	}
	distFromPoint(x2, y2) {
		const x1 = this.pos.x;
		const y1 = this.pos.y;
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	}
}