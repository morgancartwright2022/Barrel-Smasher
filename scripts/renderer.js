"use strict"
const classInfo = {
	wizard: {
		classRef: Wizard,
		name: "Wizard",
		desc: "A caster of great magical prowess who wields a staff and spell scrolls. The wizard's equipment grants high magus, but low health and damage.<br><br>E: Fireball (50 mp)<br>Q: Magic Missile (20 mp)"
	},
	templar: {
		classRef: Templar,
		name: "Templar",
		desc: "A holy guardian against evil. The templar uses divine symbols to cast spells and wears heavy protective equipment, which give high defensive stats, but not much speed.<br><br>E: Holy Aura (60 mp)<br>Q: Healing (45 mp)"
	},
	hunter: {
		classRef: Hunter,
		name: "Hunter",
		desc: "A woodland explorer, who is not very powerful up close, but can effectively take out enemies from a range with arrows. The hunter uses the powers of the wild to call forth magic.<br><br>E: Entangle (60 Mp)"
	},
	thief: {
		classRef: Thief,
		name: "Thief",
		desc: "A denizen of the underground empire of criminals, the thief is trained to dual wield daggers and hide from the sight of enemies. Although not very tough, the thief's magical cloak grants great speed.<br><br>E: Stealth (50 Mp)"
	}
};

const renderer = {
	numEffects: {},
	// renderMap -> creates the map tiles
	renderMap: function(map) {
		let res = "";
		for(let y = 0; y < map.height; y++) {
			res += "<tr>";
			for(let x = 0; x < map.width; x++) {
				const imgSrc = map.tiles[y][x].src;
				res += '<td class="map-tile" style="background-image: url(imgs/tiles/' + imgSrc + ')"></td>';
			}
			res += "</tr>"
		}
		const mapElem = document.getElementById("map");
		mapElem.innerHTML = res;
		function setSize(id) {
			const elem = document.getElementById(id);
			elem.style.width = map.width * 64 + "px";
			elem.style.height = map.height * 64 + "px";
		}
		setSize.call(this, "map");
		setSize.call(this, "gameboard");
	},
	// clearEntities -> removes all entity sprites in the list
	clearEntities: (entities) => {
		entities.forEach(entity => {
			let sprite = document.getElementById(entity.id);
			sprite.parentElement.removeChild(sprite);
		});
	},
	// clearAllEntities -> removes all entities from the level
	clearAllEntities: (level) => {
		renderer.clearEntities(level.players);
		renderer.clearEntities(level.monsters);
		renderer.clearEntities(level.dummies);
		renderer.clearEntities(level.projectiles);
		renderer.clearEntities(level.environment);
		renderer.clearEntities(level.bags);
		renderer.clearEntities(level.particles);
		renderer.clearEntities(level.npcs);
	},
	// renderEntities -> shows the entity sprites in the list
	renderEntities: function(entities) {
		entities.forEach(entity => {
			let sprite = document.getElementById(entity.id);
			if(!sprite) {
				sprite = document.createElement("img");
				sprite.id = entity.id;
				const gameboard = document.getElementById("gameboard");
				gameboard.appendChild(sprite);
			}

			const sourceLoc = sprite.src.substring(0, sprite.src.indexOf("imgs/"));
			if(sprite.src != sourceLoc + "imgs/" + entity.imgSrc)
				sprite.src = "imgs/" + entity.imgSrc;
			if(entity.flipped !== undefined) {
				if(entity.flipped)
					sprite.style.transform = "scaleX(-1)";
				if(!entity.flipped)
					sprite.style.transform = "scaleX(1)";
			}
			if(sprite.style.left != entity.pos.x - entity.size.width/2 + "px")
				sprite.style.left = entity.pos.x - entity.size.width/2 + "px";
			if(sprite.style.top != entity.pos.y - entity.size.height + "px")
				sprite.style.top = entity.pos.y - entity.size.height + "px";
			if(sprite.style.width != entity.size.width + "px")
				sprite.style.width = entity.size.width + "px";
			if(sprite.style.height != entity.size.height + "px")
				sprite.style.height = entity.size.height + "px";
			if(sprite.style["z-index"] != Math.floor(entity.pos.y))
				sprite.style["z-index"] = Math.floor(entity.pos.y);
			if(entity.opacity !== undefined && sprite.style.opacity !== entity.opacity) {
				sprite.style.opacity = entity.opacity;
			}
			if(entity.rotation !== undefined)
				sprite.style.transform = "rotate(" + (360-entity.rotation*180/Math.PI).toString() + "deg)";
		});
	},
	// renderTexts -> shows all text displays on the list
	renderTexts: function(texts) {
		texts.forEach(text => {
			let sprite = document.getElementById(text.id);
			if(!sprite) {
				sprite = document.createElement("p");
				sprite.className = text.className;
				sprite.id = text.id;
				const gameboard = document.getElementById("gameboard");
				gameboard.appendChild(sprite);
			}
			if(sprite.innerHTML != text.message)
				sprite.innerHTML = text.message;
			if(sprite.style.color != text.color)
				sprite.style.color = text.color;
			if(sprite.style.left != text.pos.x - text.size.width/2 + "px")
				sprite.style.left = text.pos.x - text.size.width/2 + "px";
			if(sprite.style.top != text.pos.y - text.size.height + "px")
				sprite.style.top = text.pos.y - text.size.height + "px";
			if(sprite.style.width != text.size.width + "px")
				sprite.style.width = text.size.width + "px";
			if(sprite.style.height != text.size.height + "px")
				sprite.style.height = text.size.height + "px";
		});
	},
	// renderPlayerView -> centers the player
	renderPlayerView: function(activePlayer) {
		const viewport = document.getElementById("viewport");
		viewport.scrollLeft = activePlayer.pos.x - 350;
		viewport.scrollTop = activePlayer.pos.y - 332;
	},
	// renderPlayerStatus -> updates number indicators for players gold, health, and magus
	renderPlayerStatus: function(activePlayer) {
		const goldDisp = document.getElementById("gold-hud");
		goldDisp.innerHTML = "Gold: " + activePlayer.status.gold;
		const hpDisp = document.getElementById("hp-hud");
		hpDisp.innerHTML = "Health: " + Math.max(activePlayer.status.hp, 0) + "/" + activePlayer.stats.hp;
		const mpDisp = document.getElementById("mp-hud");
		mpDisp.innerHTML = "Magus: " + Math.max(activePlayer.status.mp, 0) + "/" + activePlayer.stats.mp;
	},
	// renderAll -> shows everything in the level
	renderAll: function(levelData, activePlayer) {
		renderer.renderEntities(levelData.players);
		renderer.renderEntities(levelData.monsters);
		renderer.renderEntities(levelData.dummies);
		renderer.renderEntities(levelData.projectiles);
		renderer.renderEntities(levelData.environment);
		renderer.renderEntities(levelData.bags);
		renderer.renderEntities(levelData.particles);
		renderer.renderEntities(levelData.npcs);
		renderer.renderTexts(levelData.texts);
		renderer.renderPlayerView(activePlayer);
		renderer.renderPlayerStatus(activePlayer);
		renderer.checkLoot(activePlayer);
		renderer.renderEq(activePlayer);
		renderer.renderInv(activePlayer);
	},
	removeEnts: function(levelData) {
		function removeEntities(entities) {
			entities.forEach(entity => {
				const sprite = document.getElementById(entity.id);
				if(sprite && sprite.parentNode)
					sprite.parentNode.removeChild(sprite);
			});
		}
		removeEntities(levelData.deadEntities);
		removeEntities(levelData.deadTexts);
	},
	dispGameOver: function(levelData) {
		const overDisp = document.getElementById("gameover");
		overDisp.style.display = "block";
	},
	dispDialogue(topic, speaker) {
		const dialogueBox = document.getElementById("dialogue-hud");
		dialogueBox.innerHTML = "";
		const msgElem = document.createElement("p");
		const nameStr = "<b>" + speaker.name + ":</b><br><br>"; 
		if(typeof topic.speakerMsg === "function")
			msgElem.innerHTML = nameStr + topic.speakerMsg(speaker).replace("\n", "<br>");
		else if(typeof topic.speakerMsg === "string")
			msgElem.innerHTML = nameStr + topic.speakerMsg.replace("\n", "<br>");
		else console.log("Unusual type for topic.speakerMsg.");
		dialogueBox.appendChild(msgElem);
		let activeReplies = topic.replies;
		if(typeof topic.replies == "function")
			activeReplies = topic.replies(speaker);
		activeReplies = activeReplies.filter(rep => rep.isActive(speaker));
		activeReplies.forEach((reply, i) => {
			const replyElem = document.createElement("p");
			replyElem.className = "reply";
			if(typeof reply.replyMsg === "function")
				replyElem.innerHTML = (i + 1) + ": " + reply.replyMsg(speaker);
			else if(typeof reply.replyMsg === "string")
				replyElem.innerHTML = (i + 1) + ": " + reply.replyMsg;
			else console.log("Unusual type for reply.replyMsg: " + typeof reply.replyMsg);
			
			const clickEffect = () => {
				reply.onClickEffect(speaker)
			};
			replyElem.onclick = clickEffect;
			renderer.numEffects[i + 1] = clickEffect;
			dialogueBox.appendChild(replyElem);
		});
	},
	pressNum(n) {
		if(renderer.numEffects[n])
			renderer.numEffects[n]();
	},
	clearDialogue() {
		const dialogueBox = document.getElementById("dialogue-hud");
		dialogueBox.innerHTML = "Press 'f' to talk to somebody.";
		renderer.numEffects = [];
	},
	loadInv: function(player) {
		for(const slot in player.eq)
			renderer.createBtnImg(renderer.getElem(slot + "-btn"));
		const invClassDisp = document.getElementById("inv-class-disp");
		renderer.changeImgElem(invClassDisp, "imgs/" + player.imgs.front.stand);
	},
	renderEq: function(player) {
		// TODO: add something here
	},
	renderInv: function(player) {
		// TODO: add something here
	},
	addToInvDisplay: function(item, invManager) {
		renderer.removeMouseOver(item);
		const invPanel = document.getElementById("inv-panel");
		const btnElem = renderer.createBtn(invPanel, "loot-item", "imgs/items/" + item.img, () => {
			if(!controller.keysDown.ctrl) {
				if(item.type == "consumable")
					invManager.consume(item)
				else if(invManager.player.proficiencies.includes(item.type) && !invManager.player.busy())
					invManager.equip(item, item.slot);
			}
			else if(controller.keysDown.ctrl)
				invManager.drop(item, "inv");
		});
		btnElem.id = item.id + "-inv-btn";
		renderer.setMouseOver(btnElem, item);
	},
	removeFromInvDisplay: function(item) {
		const btnElem = document.getElementById(item.id + "-inv-btn");
		renderer.clearDesc();
		renderer.removeBtn(btnElem);
	},
	equipDisplay(item, slot, invManager) {
		const btnElem = document.getElementById(slot + "-btn")
		renderer.changeBtnImg(btnElem, "imgs/items/" + item.img);
		renderer.setBtnFunc(btnElem, () => {
			if(!controller.keysDown.ctrl)
				invManager.unequip(item, slot);
			else
				invManager.drop(item, slot);
		});
		renderer.setMouseOver(btnElem, item);
	},
	unequipDisplay(item, slot) {
		const btnElem = document.getElementById(slot + "-btn")
		renderer.removeMouseOver(btnElem);
		renderer.changeBtnImg(btnElem);
		renderer.setBtnFunc(btnElem, null);
	},
	setMouseOver: function(button, item) {
		button.onmouseover = () => {
			let statsTxt = "";
			for(const stat in item.stats) {
				const descMap = {"atkSpd": "Attack Speed", "moveSpd": "Move Speed", "castDelay": "Cast Delay", "blk": "Block Power", "dmg": "Damage", "def": "Defense"};
				const minMap = {
					"minDmg": {min: "minDmg", max: "maxDmg", disp: "Damage"},
					"minHpRes": {min: "minHpRes", max: "maxHpRes", disp: "HP Heal"}, 
					"minMpRes": {min: "minMpRes", max: "maxMpRes", disp: "MP Heal"},
					"minHpDrain": {min: "minHpDrain", max: "maxHpDrain", disp: "HP Drain"},
					"minMpDrain": {min: "minMpDrain", max: "maxMpDrain", disp: "MP Drain"},
				};
				const maxes = ["maxDmg", "maxHpRes", "maxMpRes", "maxHpDrain", "maxMpDrain"];
				if(stat in descMap)
					statsTxt += "<b>" + descMap[stat] + "</b>: " + item.stats[stat] + "<br>";
				else if(stat in minMap)
					statsTxt += "<b>" + minMap[stat].disp + "</b>: " + item.stats[minMap[stat].min]+ "-" + item.stats[minMap[stat].max] + "<br>";
				else if(!maxes.includes(stat))
					statsTxt += "<b>" + stat.substr(0, 1).toUpperCase() + stat.substr(1) + ":</b> " + item.stats[stat] + "<br>";
			}
			const valueTxt = "<b>Value:</b> " + item.value + "<br>";
			let text = "<b>" + item.name +"</b><br><br><b>Type: </b>" + item.type + "<br>" + statsTxt + valueTxt + "<br>" + item.desc;
			if(item.type != "consumable")
				text += "<br><br>Click to equip/unequip. Ctrl click to drop.";
			else
				text += "<br><br>Click to consume. Ctrl click to drop.";
			const desc = document.getElementById("inv-desc-txt");
			desc.innerHTML = text;
		};
		if(button.onmouseout == null) {
			button.onmouseout = () => {
				renderer.clearDesc();
			}
		}
	},
	removeMouseOver: function(button) {
		if(button != undefined) {
			renderer.clearDesc();
			button.onmouseover = null;
			button.onmouseout = null;
		}
	},
	clearDesc: function() {
		const desc = document.getElementById("inv-desc-txt");
		desc.innerHTML = "";
	},
	showBagLoot: function(bag, player) {
		if(!document.getElementById(bag.id + "-box")) {
			const lootHud = document.getElementById("loot-hud");
			const elem = document.createElement("div");
			elem.id = bag.id + "-box";
			elem.className = "loot-divider";
			lootHud.appendChild(elem);
			const addItem = item => {
				if(item == "loot all") {
					renderer.createBtn(elem, "loot-item", "imgs/misc/loot_bag1.png", () => bag.takeAll(player));
				}
				else {
					renderer.createBtn(elem, "loot-item", "imgs/items/" + item.img, () => {
						bag.take(item, player);
						renderer.removeBtn(elem);
					});
				}
			}
			addItem("loot all");
			bag.loot.forEach(item => addItem(item));
		}
	},
	removeBagLoot: function(bag) {
		const lootHud = document.getElementById("loot-hud");
		lootHud.removeChild(document.getElementById(bag.id + "-box"));
	},
	checkLoot: function(player) {
		level.bags.forEach(bag => {
			if(player.collision(bag) && bag.exists)
				renderer.showBagLoot(bag, player);
			else if(document.getElementById(bag.id + "-box"))
				renderer.removeBagLoot(bag);
		});
	},
	getElem: function(id) {
		return document.getElementById(id);
	},
	changeImgElem: function(elem, imgSrc) {
		elem.src = imgSrc;
	},
	dispClasses: () => {
		for(let name in classInfo) {
			const info = classInfo[name];
			const selector = document.getElementById(name + "-select");
			selector.onclick = () => {
				renderer.remClasses();
				const playerClass = info.classRef;
				renderer.toggleInv();
				main.startGame(playerClass);
			};
			const desc = document.getElementById(name + "-desc");
			desc.innerHTML = info.name + "<br><br>" + info.desc;
		}
	},
	remClasses: function() {
		const disp = document.getElementById("class-select");
		disp.style.display = "none";
	},
	//toggleInv -> toggles inventory display on and off
	toggleInv: function() {
		const invHud = document.getElementById("inv-hud");
		if(invHud.style.display == "block")
			invHud.style.display = "none";
		else
			invHud.style.display = "block";
	},
	//dispMerch -> shows merchant buy/sell window
	dispMerch: function() {
		const merchHud = document.getElementById("merchant-hud");
		merchHud.style.display = "block";
	},
	//dispMerch -> hides merchant buy/sell window
	remMerch: function() {
		const merchHud = document.getElementById("merchant-hud");
		merchHud.style.display = "none";
		renderer.clearAllMerch();
	},
	//addMerchItem -> shows an item for display in the buy/sell window
	addMerchItem: function(parent, id, cost, imgSrc, func) {
		const elem = document.createElement("div");
		elem.className = "merchant-item-box";
		elem.id = id + "-box";
		renderer.createBtn(elem, "loot-item", imgSrc, func);
		const priceDisplay = document.createElement("p");
		priceDisplay.innerHTML = "Price: " + cost;
		priceDisplay.className = "merchant-item-cost";
		elem.appendChild(priceDisplay);
		parent.appendChild(elem);
	},
	clearAllMerch: function() {
		const buyItems = document.getElementById("buy-items");
		buyItems.innerHTML = "";
		const sellItems = document.getElementById("sell-items");
		sellItems.innerHTML = "";
	},
	//renderMerch -> clears buy/sell items that are not avaiable
	clearDeadMerch: function(listId, inv) {
		const itemList = document.getElementById(listId).children;
		for(let itemElem of itemList) {
			if(!inv.some(item => item.id + "-box" == itemElem.id))
				itemElem.parentNode.removeChild(itemElem);
		}
	},
	//clearDeadBuyMerch -> clears buy items that are not avaiable
	clearDeadBuyMerch: function(inv) {
		this.clearDeadMerch("buy-items", inv);
	},
	//clearDeadSellMerch -> clears sell items that are not avaiable
	clearDeadSellMerch: function(inv) {
		this.clearDeadMerch("sell-items", inv);
	},
	//showBuyMerch -> shows items that are available to buy
	showBuyMerch: function(inv, player) {
		const buyItems = document.getElementById("buy-items");
		const itemList = buyItems.children;
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
						renderer.showSellMerch(player.inv, player)
					}
				});
			}
		});
	},
	//showSellMerch -> shows items that are available to sell
	showSellMerch: function(inv, player) {
		const sellItems = document.getElementById("sell-items"); 
		const itemList = sellItems.children;
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
					renderer.clearDeadSellMerch(inv);
				});
			}
		});
	},
	remGameover: function() {
		const overDisp = document.getElementById("gameover");
		overDisp.style.display = "none";
	},
	createBtnImg: function(button, imgSrc) {
		const img = document.createElement("img");
		img.className = "button-img";
		if(imgSrc) {
			img.src = imgSrc;
			img.style.visibility = "visible";
		}
		else {
			img.src = "";
			img.style.visibility = "hidden";
		}
		button.appendChild(img);
		return img;
	},
	changeBtnImg: function(button, imgSrc) {
		for(let i = 0; i < button.children.length; i++) {
			if(button.children[i].className = "button-img") {
				if(imgSrc) {
					button.children[i].src = imgSrc;
					button.children[i].style.visibility = "visible";
				}
				else {
					button.children[i].src = "";
					button.children[i].style.visibility = "hidden";
				}
			}
		}
	},
	//setBtnFunc -> sets button dom elem onclick
	setBtnFunc: function(button, func) {
		button.onclick = func;
	},
	//createBtn -> appends button to parent with optional class, image, and onclick function
	createBtn: function(parent, btnClass, imgSrc, func) {
		const button = document.createElement("button");
		if(btnClass)
			button.className = btnClass;
		if(imgSrc)
			renderer.createBtnImg(button, imgSrc);
		if(func)
			renderer.setBtnFunc(button, func);
		parent.appendChild(button);
		return button;
	},
	//removeBtn -> takes button dom element and removes it from parent
	removeBtn: function(button) {
		button.parentNode.removeChild(button);
	},
	//toggleMusicBtn -> takes boolean of music being on and sets music icon to match
	toggleMusicBtn: function(musicOn) {
		const musicCtrl = document.getElementById("music-control");
		if(musicOn)
			musicCtrl.src = "imgs/icons/music.png";
		else
			musicCtrl.src = "imgs/icons/music_off.png";
	},
	//toggleSoundBtn -> takes boolean of sound being on and sets sound icon to match
	toggleSoundBtn: function(soundOn) {
		const soundCtrl = document.getElementById("sound-control");
		if(soundOn)
			soundCtrl.src = "imgs/icons/sound.png";
		else
			soundCtrl.src = "imgs/icons/sound_off.png";
	},
};