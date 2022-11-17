let level;
const main = {
	gameover: false,
	time:  new Date().getTime(),
	timeBuffer: 0,
	tickInterval: 20,
	checked: true,
	allLevels: {},
	currentLevel: null,
	loadControls: function() {
		const gameboard = document.getElementById("gameboard");
		window.onkeydown = controller.keyPress;
		window.onkeyup = controller.keyRelease;
		gameboard.onmousedown = controller.mouseDown;
		gameboard.onmousemove = controller.checkMouse;
		gameboard.onmouseup = controller.mouseUp;
	},
	unloadControls: function() {
		window.onkeydown = null;
		window.onkeyup = null;
		gameboard.onmousedown = null;
		gameboard.onmousemove = null;
		gameboard.onmouseup = null;
	},
	initLevels() {
		main.allLevels = {
			plains: new Plains(50, 30),
			town: new Town(),
			castle: new Castle()
		};
		console.log(main.allLevels);
		for(let levelName in main.allLevels) {
			main.allLevels[levelName].fill();
		}
		main.currentLevel = main.allLevels.castle;
		level = this.currentLevel;
	},
	changeLevel(levelName, xStart, yStart) {
		//Replaces the current level with the new level, placing all players at (xStart, yStart)
		renderer.clearAllEntities(this.currentLevel);
		const oldLevel = main.currentLevel;
		const players = oldLevel.players;
		const selectedLevel = main.allLevels[levelName];
		players.forEach(player => {
			player.pos = {x: xStart, y: yStart};
			selectedLevel.addPlayer(player);
		});
		oldLevel.players = [];
		main.currentLevel = selectedLevel;
		renderer.renderMap(main.currentLevel.map);
		level = main.currentLevel;
	},
	broadcastEvent: function(eventName) {
		for(let levelName in main.allLevels) {
			const level = main.allLevels[levelName];
			level.npcs.forEach(npc => npc.receiveEvent(eventName));
		}
	},
	startGame: function(playerClass) {
		main.initLevels();
		audio.initSound();
		main.loadControls();
		renderer.renderMap(level.map);
		const player = new playerClass(800, 1500);
		level.startPlayer(player);
		renderer.loadInv(player);
		main.run();
	},
	run: function() {
		const level = this.currentLevel;
		const newTime = new Date().getTime();
		const delay = newTime - this.time;
		this.timeBuffer += delay;
		if(this.timeBuffer > this.tickInterval) {
			this.timeBuffer = 0;
			if(!main.gameover) {
				controller.act();
				level.allAct(delay);
				if(level.players[0] === undefined)
					console.log(level);
				if(level.players.length > 0)
					renderer.renderAll(level, level.players[0]);
				level.checkForDead();
				renderer.removeEnts(level);
				level.clearDead();
				scheduler.incrementTime();
			}
			else {
				renderer.dispGameOver();
			}
		}
		this.time = newTime;
		setTimeout(() => main.run(), 5);
	},
};