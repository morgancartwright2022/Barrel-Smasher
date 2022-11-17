"use strict"
const controller = {
	keysDown: {w: false, d: false, s: false, a: false, shift: false, ctrl: false},
	moveKeyActive: false,
	mouseActive: false,
	mousePos: {x: 0, y: 0},
	mouseAng: 0,
	mouseDist: 0,
	cooldown: 0,
	player: null,
	setPlayer: player => {
		controller.player = player;
	},
	checkMouse: event => {
		var bounds = gameboard.getBoundingClientRect();
		controller.mousePos.x = event.pageX - bounds.left;
		controller.mousePos.y = event.pageY - bounds.top;
		
		const x1 = controller.player.pos.x;
		const x2 = controller.mousePos.x;
		const dx = x2 - x1;
		const y1 = controller.player.pos.y - controller.player.size.height/2;
		const y2 = controller.mousePos.y;
		const dy = -y2 + y1;
		let angle = Math.atan(dy/dx);
		if(dx < 0)
			angle += Math.PI;
		else if(dy < 0)
			angle += Math.PI*2;
		controller.mouseAng = angle;
		controller.mouseDist = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
		controller.player.checkAtkDir(controller.mouseAng);
	},
	keyPress: event => {
		const key = event.key;
		if(key != undefined && controller.player != undefined) {
			if(key in controller.keysDown)
				controller.keysDown[key] = true;
			if(key == "e" || key == "q")
				controller.player.initCast(key, controller.mouseAng, controller.mouseDist, controller.mousePos);
			else if(key == "Shift")
				controller.player.block();
			else if(key == "i")
				renderer.toggleInv();
			else if(key == "Control")
				controller.keysDown.ctrl = true;
			else if(key == "f")
				controller.player.talk();
			else if(key == "w" || key == "a" || key == "s" || key == "d")
				controller.moveKeyActive = true;
			else if(!isNaN(Number(key)))
				renderer.pressNum(Number(key));
		}
	},
	keyRelease: event => {
		const key = event.key;
		if(key != undefined && !main.gameover) {
			controller.keysDown[key] = false;
			if(!(controller.keysDown.w || controller.keysDown.d || controller.keysDown.s || controller.keysDown.a)) {
				controller.moveKeyActive = false;
				controller.player.stopMv();
			}
			if(key == "Shift")
				controller.player.unblock();
			else if(key == "Control")
				controller.keysDown.ctrl = false;
		}
	},
	mouseDown: () => {
		controller.mouseActive = true;
	},
	mouseUp: () => {
		controller.mouseActive = false;
	},
	checkMove: () => {
		if(controller.moveKeyActive) {
			const gameboard = renderer.getElem("gameboard");
			var bounds = gameboard.getBoundingClientRect();
			const oldClientPos = {pageX: controller.mousePos.x + bounds.left, pageY: controller.mousePos.y + bounds.top};
			
			controller.player.checkDir(controller.keysDown, controller.lastKey);
			controller.player.initMove();
			
			controller.checkMouse(oldClientPos);
		}
	},
	checkAtk: () => {
		controller.cooldown = Math.max(controller.cooldown - 1, 0);
		const mainHand = !controller.player.state.mainAttacking && controller.player.eq.mainHand != null && (controller.player.eq.offHand != null || !controller.player.ranged);
		const offHand = controller.player.dualist && !controller.player.state.offAttacking && controller.player.eq.offHand != null;
		if((mainHand || offHand) && controller.cooldown < 1 && controller.mouseActive) {
			controller.cooldown = 30;
			controller.player.checkAtkDir(controller.mouseAng);
			controller.player.initAtk({offHand: (!mainHand && offHand)});
		}
	},
	act: () => {
		controller.checkMove();
		controller.checkAtk();
	},
};