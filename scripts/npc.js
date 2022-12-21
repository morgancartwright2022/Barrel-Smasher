"use strict"
/**
 * A Non-Player Character
 * 
 * Uses my custom behaviour generator to create interesting behaviour based on opinions
 * of other NPCs and the player
 */
class Npc extends Character {
    // Primary constructor
    constructor(name, x, y, width, height, imgs, stats, topics, inv) {
		super(name, x, y, width, height, imgs, stats);
        this.startPosition = {x, y};
        this.topics = topics;
        this.inv = inv;
        this.acting = false;
        this.inDialogue = false;
        this.unfindable = false;
        this.opinions = {player: 0};
        this.personality = {
            talkative: 0,
            friendly: 0,
            anxious: 0,
            openminded: 0
        }
        this.stationary = false;
        this.boredom = 0;
        this.path = [];
        this.onArrival = () => {};
        this.memory = {};
        this.quests = [];
        this.eventResponses = [
            {name: "end trading", effect: () => this.goodbye()}
        ];
        this.greetings = [];
        this.recentGossip = [];
	}
    // Initialization function, can be overwritten by descendants
    init() {}
    // Display dialogue for given topic
    initiateDialogue(topicName) {
        renderer.dispDialogue(this.topics[topicName], this);
        this.chatBubble();
    }
    // Display dialogue with message modification
    customDialogue(topicName, newMsg) {
        const topic = this.topics[topicName].clone();
        topic.setSpeakerMsg(newMsg);
        renderer.dispDialogue(topic, this);
        this.chatBubble();
    }
    // Get angular direction to a (x, y) position
    getDirectionToPoint(x2, y2) {
		const x1 = this.pos.x;
		const y1 = this.pos.y;
		
		let angle = Math.atan(-(y2 - y1)/(x2 - x1));
		angle *= 180/Math.PI;
		if(x2 < x1)
			angle += 180;
		else if(y2 > y1)
			angle += 360;
		
		let dir;
		if(angle >= 67.5 && angle <= 112.5) dir = 0;
		else if(angle >= 22.5 && angle <= 67.5) dir = 1;
		else if(angle >= 337.5 || angle <= 22.5) dir = 2;
		else if(angle >= 292.5 && angle <= 337.5) dir = 3;
		else if(angle >= 247.5 && angle <= 292.5) dir = 4;
		else if(angle >= 202.5 && angle <= 247.5) dir = 5;
		else if(angle >= 157.5 && angle <= 202.5) dir = 6;
		else dir = 7;
		return dir;
	}
    chatBubble() {
        level.particles.push(new Chat(this.pos.x + this.size.width/2 + 10, this.pos.y - this.size.height + 10, 50));
    }
    // Start dialogue
    hello() {
        const player = level.players[0]; // TODO: change for multiplayer
        if(this.topics && this.topics.greet) {
            if(!player.npcsMet.includes(this.name)) {
                this.opinions.player += 5;
                player.npcsMet.push(this.name);
            }
            let greeting = this.topics.greet.getSpeakerMsg(this);
            if(this.greetings.length > 0) {
                const i = Math.floor(Math.random()*this.greetings.length);
                greeting = this.greetings[i];
                this.greetings.splice(i, 1);
            }
            this.customDialogue("greet", greeting);
            this.inDialogue = true;
            player.inDialogue = true;
        }
    }
    // End dialogue
    goodbye() {
        const player = level.players[0]; // Must be changed for multiplayer
        renderer.clearDialogue();
        player.inDialogue = false;
        scheduler.addTimeout(() => {
            this.inDialogue = false;
        }, 30);
        this.endTrading();
    }
    // Add/subtract an opinion
    modOpinion(character, value) {
        if(this.opinions[character] == undefined)
            this.opinions[character] = 0;
        this.opinions[character] += value;
    }
    // Set an opinion
    setOpinion(character, value) {
        this.opinions[character] = value;
    }
    // Get an opinion
    getOpinion(character) {
        if(!this.opinions[character])
            return 0;
        else
            return this.opinions[character];
    }
    // Determines whether the NPC is currently willing to talk about another person
    willGossip(character) {
        return !this.recentGossip.includes(character);
    }
    // Adds gossip for specific character to recent list, pausing future gossip
    addRecentGossip(character) {
        this.recentGossip.push(character);
    }
    // Allows all gossip again
    resetGossip() {
        this.recentGossip = [];
    }
    // Simulates a conversation between two npcs by displaying information
    // and exchanging opinions.
    simulateChat(npcTarget) {
        npcTarget.acting = true;
        this.acting = true;
        this.chatBubble();
        scheduler.addTimeout(() => npcTarget.chatBubble(), 50);
        scheduler.addTimeout(() => {
            this.acting = false;
            npcTarget.acting = false;
            this.goHome(() => {
                this.unfindable = false;
                npcTarget.unfindable = false;
            });
        }, 100);
        const passOpinion = (sender, receiver, curOpn) => {
            const senderOpn = sender.opinions[curOpn];
            if(!receiver.opinions[sender.name])
                receiver.opinions[sender.name] = 5;
            const trust = receiver.opinions[sender.name];
            if(!receiver.opinions[curOpn])
                receiver.opinions[curOpn] = 0;
            const baseChange = sender.opinions[curOpn]*trust;
            let finalChange = 0;
            if(baseChange > 1)
                finalChange = Math.floor(Math.log(baseChange));
            if(baseChange < -1)
                finalChange = -Math.floor(Math.log(Math.abs(baseChange)));
            //console.log({trust, senderOpn, baseChange, finalChange});
            receiver.opinions[curOpn] += finalChange;

            if(curOpn === "player") {
                if(trust > 0 && senderOpn > 0)
                    receiver.addGreeting(sender.name + " says good things about you. Keep it up!");
                else if(trust > 0 && senderOpn < 0)
                    receiver.addGreeting(sender.name + " tells me you've been causing trouble. Watch yourself, or you may regret it.");
                else if(trust < 0 && senderOpn > 0)
                    receiver.addGreeting(sender.name + " seems to think highly of you. I would make better friends than that, if I were you.");
                else if(trust < 0 && senderOpn < 0)
                    receiver.addGreeting(sender.name + " is spreading hostile rumors about you, but I don't believe such foolish tales.");
            }
        }

        // Get list of initiator opinions
        const nameArr = Object.keys(this.opinions).filter(name => {
            const validName = name != this.name && name != npcTarget.name;
            const validOpinion = Math.abs(this.opinions[name]) > 5 || Math.abs(npcTarget.opinions.name) > 5;
            return validName && validOpinion;
        });

        // 1-3 rounds of gossip, limited to number of initiators total opinions
        const rounds = Math.min(3, nameArr.length);
        
        //console.log("Gossip: " + this.name + " <-> " + npcTarget.name);
        //console.log("Rounds: ", rounds);

        for(let i = 0; i < rounds; i++) {
            // Get random person name from the list
            const randIndex = Math.floor(Math.random() * nameArr.length);
            const name = nameArr[randIndex];

            // Remove from list, so ther are no repeats
            nameArr.splice(randIndex, 1);

            //console.log("Name: ", name);
            //console.log("Old: ", this.opinions[name], npcTarget.opinions[name]);

            // Pass opinions, both directions
            passOpinion(this, npcTarget, name);
            passOpinion(npcTarget, this, name);

            //console.log("New: ", this.opinions[name], npcTarget.opinions[name]);
        }

        this.resetGossip();
        npcTarget.resetGossip();
    }
    //Adds a reply option to a specific topic branch
    addReplyToTopic(reply, topicName) {
        this.topics[topicName].addReply(reply);
    }
    //Adds a new greeting to the list of possible greetings.
    addGreeting(greeting) {
        if(!this.greetings.includes(greeting))
            this.greetings.push(greeting);
    }
    moveToPos(x, y) {
        const dir = this.getDirectionToPoint(x, y);
        this.move(dir, this.stats.moveSpd);
        if(this.distFromPoint(this.goal.x, this.goal.y) < 1) {
            this.pathfinding = false;
            this.changeFrame("stand", dir);
        }
    }
    /**
     * receiveEvent
     * 
     * Receives event from event broadcast, activating all associated functions
     * for that event.
     */
    receiveEvent(name) {
        this.eventResponses.forEach(event => {
            if(event.name === name)
                event.effect();
        });
    }
    /**
     * onEvent
     * 
     * Sets up a response function which activates upon receiving an event broadcast.
     */
    onEvent(name, effect) {
        this.eventResponses.push({name, effect});
    }
    /**
     * getDFSPath
     * 
     * Finds the shortest path to (x, y) coordinates using Depth First Search
     * Ideally this should be changed to A*, but it seems to work well enough as is in small maps
     */
    getDFSPath(x, y, map) {
        /*const euclidHeuristic = (x1, y1, x2, y2) => {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }*/
        const goalTile = map.coordsToTileIndex(x, y);
        const startTile = map.coordsToTileIndex(this.pos.x, this.pos.y);
        startTile.path = [];
        const visited = [];
        const border = [startTile];
        let curTile = startTile;
        let tx = startTile.x;
        let ty = startTile.y;
        let steps = 0;
        const threshhold = 10000;
        while(border.length > 0 && !(tx === goalTile.x && ty === goalTile.y) && steps < threshhold) {
            curTile = border.shift();
            tx = curTile.x;
            ty = curTile.y;
            steps++;
            //console.log("Testing tile: ", curTile);
            //console.log("Visited tiles: ", visited);
            let newTiles = [
                {x: tx - 1, y: ty},
                {x: tx, y: ty - 1},
                {x: tx + 1, y: ty},
                {x: tx, y: ty + 1}
            ];
            newTiles = newTiles.filter(newTile => {
                const tileVisited = visited.some(visitedTile => visitedTile.x === newTile.x && visitedTile.y === newTile.y);
                const tileInBounds = map.tileInBounds(newTile.x, newTile.y);
                const tileFree = map.freeAtTile(newTile.x, newTile.y);
                return !tileVisited && tileInBounds && tileFree;
            });
            newTiles.forEach(newTile => {
                newTile.path = curTile.path.map(tile => tile);
                newTile.path.push(newTile);
                border.push(newTile);
                visited.push(newTile);
            });
        }
        if(tx === goalTile.x && ty === goalTile.y) {
            curTile.path.unshift(startTile);
            return curTile.path;
        }
        else
            return [];
    }
    /**
     * goToEntity
     * 
     * Pathfind to the given entity, possibly activating a function on arrival
     */
    goToEntity(entity, onArrival) {
        this.path = this.getDFSPath(entity.pos.x, entity.pos.y, level.map);
        const defaultArrival = () => {};
        this.onArrival = onArrival || defaultArrival;
    }
    /**
     * goToTile
     * 
     * Pathfind to the given tile, possibly activating a function on arrival
     */
    goToTile(x, y, onArrival) {
        const coords = level.map.tileIndexToCoords(x, y);
        this.path = this.getDFSPath(coords.x, coords.y, level.map);
        const defaultArrival = () => {};
        this.onArrival = onArrival || defaultArrival;
    }
    /**
     * goHome
     * 
     * Pathfind to this npc's starting position, possibly activating a function on arrival
     */
    goHome(onArrival) {
        this.path = this.getDFSPath(this.startPosition.x, this.startPosition.y, level.map);
        const defaultArrival = () => {};
        this.onArrival = onArrival || defaultArrival;
    }
    stopPathing() {
        this.path = [];
        this.onArrival();
        this.onArrival = () => {};
        this.changeFrame("stand");
    }
    pathMove() {
        const curDest = this.path[0];
        const destCoords = level.map.tileIndexToCoords(curDest.x, curDest.y);
        destCoords.y -= 2;
        const finalGoal = this.path[this.path.length - 1];
        const goalCoords = level.map.tileIndexToCoords(finalGoal.x, finalGoal.y);
        //goalCoords.y -= 2;
        if(this.distFromPoint(goalCoords.x, goalCoords.y) < 70) {
            this.stopPathing();
        }
        else if(this.distFromPoint(destCoords.x, destCoords.y) < 1) {
            this.path.shift();
            if(this.path.length > 0)
                this.pathMove();
            else
                this.stopPathing();
        }
        else {
            const dir = this.getDirectionToPoint(destCoords.x, destCoords.y);
            this.move(dir, this.stats.moveSpd);
        }
    }
    startQuest(id) {
        const selectedQuest = this.quests.find(qst => qst.id === id);
        if(!selectedQuest)
            console.log("Cannot find quest by id.");
        else
            selectedQuest.started = true;
    }
    startTrading(player) {
		renderer.clearDeadBuyMerch(this.inv);
		renderer.showBuyMerch(this.inv, player);
		renderer.clearDeadSellMerch(player.inv);
		renderer.showSellMerch(player.inv, player);
		renderer.dispMerch();
	}
	endTrading() {
		renderer.remMerch();
	}
    act() {
        if(this.path.length > 0 && !this.inDialogue)
            this.pathMove();
        else if(this.boredom > 200) {
            const availableNpcs = level.npcs.filter(npc => {
                const path = this.getDFSPath(npc.pos.x, npc.pos.y, level.map);
                return npc.name !== this.name && !npc.acting && !npc.unfindable && !npc.inDialogue && path.length > 0;
            });
            if(availableNpcs.length > 0) {
                const npcChosen = availableNpcs[Math.floor(Math.random()*availableNpcs.length)];
                this.unfindable = true;
                npcChosen.unfindable = true;
                this.goToEntity(npcChosen, () => {
                    this.simulateChat(npcChosen);
                });
            }
            this.boredom = 0;
        }
        else if(!this.acting && !this.inDialogue && Math.random() > 0.8 && !this.stationary && !this.unfindable)
            this.boredom++;
    }
}

// List of npcs and for refference
// Note that this is not an ideal way to do this and should probably be changed
const npcList = [
    {name: "Joseph", pronoun: "he"},
    {name: "George", pronoun: "he"},
    {name: "Alexander", pronoun: "he"},
    {name: "Sarah", pronoun: "she"},
    {name: "Lexor", pronoun: "he"},
    {name: "Hamar", pronoun: "he"},
    {name: "King Peter", pronoun: "he"},
    {name: "Duchess Elizabeth", pronoun: "she"},
    {name: "Princess Lilly", pronoun: "she"}
];
function getNpcList(callerName) {
    return npcList.filter(npc => npc.name !== callerName);
}

class Joseph extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/farmer1_front_stand.png", walk1: "npcs/farmer1_front_move1.png", walk2: "npcs/farmer1_front_move2.png"}};
        super("Joseph", x, y, 60, 60, imgs, {moveSpd: 50}, [], [
            new LeatherArmor(),
            new LeatherHelmet(),
            new WoodStaff(),
            new Bow(),
            new DarkStaff(),
            new DarkBow(),
            new Beer()
        ]);
        this.finesPayed = false;
        this.hasHelmet = true;
    }
    init() {
        this.quests = [
            new Quest("fines", "Pay Off Fines", {
                request: "I need help paying my fines.",
                description: "Apparently I have been convicted of 'disorderly conduct' by the watchman. Can you possibly pay off my fines for me?",
                accept: "Thank you, you are very generous.",
                reject: "Oh, I suppose that is fair.",
                update: "Have you payed them off?",
                reminder: "Oh yes. Just talk to the watchman next to the front entrance. He'll tell you how much I owe him.",
                completed: "Oh thank you so much! Here, I don't have a lot, but you can take some of my homemade ale",
            }, () => true, () => this.finesPayed = true, () => false, () => {
                this.modOpinion("player", 3);
                const newReply = new Reply("I'm here to pay off the fines for Joseph.", "payFines", null, () => !this.finesPayed);
                const alexander = level.findByName("Alexander", "npcs")
                alexander.addReplyToTopic(newReply, "greet");
                alexander.addReplyToTopic(newReply, "newTopic");
            }, () => {
                level.players[0].invManager.addToInv(new Beer(), {silent: false});
                this.modOpinion("player", 20);
            })
        ];
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "You look great!", 5);
        tg.addSmallTalk("ins1", "You look ugly.", -5);
        tg.addSmallTalk("chat1", "It's a nice day.", 0);
        tg.addSmallTalk("pig1", "That's a nice looking pig!", 3);
        tg.addSmallTalk("pig2", "That pig reminds me of something... oh yeah, your face.", -10);
        tg.addInfo("quesName", "What is your name?", "ansName", "I go by Joseph.");
        tg.addInfo("ques1", "Who is king around here?", "ans1", "That would be king Peter.");
        tg.addInfo("quesGear", "Do you have any weapons or armor?", "ansGear", null, null, speaker => speaker.hasHelmet);
        tg.addInfo("ques2", "What do you do?", "ans2", "I mostly just take care of the king's animals.");
        tg.addInfo("ques3", "What are those barrels outside your home?", "ans3", "Those store my beer. Please don't touch them.");
        this.topics = tg.generate();
        this.topics.ansGear = new Topic("I do have this old helmet...", [
            new Reply("Can I have it?", "helmetSucc", speaker => {
                level.players[0].invManager.addToInv(new MetalHelmet(), {silent: false});
                speaker.hasHelmet = false;
            }, speaker => speaker.getOpinion("player") >= 15),
            new Reply("Can I have it?", "helmetFail", null, speaker => speaker.getOpinion("player") < 15),
            new Reply("Nevermind.", "newTopic")
        ]);
        this.topics.helmetSucc = new Topic("Oh, very well. I don't really use it.", [
            new Reply("Thank you!", "newTopic")
        ]);
        this.topics.helmetFail = new Topic("No, I don't see why I should give it to you.", [
            new Reply("That's too bad.", "newTopic"),
        ]);
        this.topics.churchFail = new Topic("You go tell that old man to leave me alone! I don't need him or anyone else telling me what to do.", [
            new Reply("Okay.", "newTopic")
        ]);
        this.topics.churchSucc = new Topic("Oh... Yes I suppose I should see the priest at some point.", [
            new Reply("Great!", "newTopic")
        ]);
        this.setOpinion("George", -20);
        this.setOpinion("Alexander", 5);
        this.setOpinion("Odyss", 10);
        this.setOpinion("player", 0);
        this.onEvent("destroy beer barrel", () => {
            this.opinions.player -= 5;
            this.addGreeting("I saw you break one of my beer barrels earlier... In the future, please keep your hands off other people's property.");
        });
    }
}
class George extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/priest_front_stand.png", walk1: "npcs/priest_front_move1.png", walk2: "npcs/priest_front_move2.png"}};
        super("George", x, y, 60, 60, imgs, {moveSpd: 50}, [], [
            new Robe(),
            new OldHat(),
            new MinorMpPotion(),
            new MinorHpPotion()
        ]);
    }
    init() {
        this.quests = [
            new Quest("donation", "Donation", {
                request: "The church here could use a donation.",
                description: "Tithes have been very short lately. Do you think you could collect 50 gold for me?",
                accept: "God bless you.",
                reject: "Oh. Very well.",
                update: "What do you need to know?",
                reminder: "I wanted you to collect 50 gold.",
                completed: "Your work is most dilligent. Here, take these potions as a reward for your effort.",
            }, () => true, () => level.players[0].status.gold >= 50, () => false, null, () => {
                const im = level.players[0].invManager;
                im.addToInv(new MinorHpPotion());
                im.addToInv(new MinorHpPotion());
                im.addToInv(new MinorHpPotion());
                level.players[0].spendGold(50);
                this.modOpinion("player", 20);
            }),
            new Quest("gospel", "Spread the Word", {
                request: "I would like to spread the word of God to more people.",
                description: "People have not been coming to the church very often. Can you talk to them about attending service?",
                accept: "God bless you.",
                reject: "Oh. Very well.",
                update: "What do you need to know?",
                reminder: "I would simply like you to talk to people about coming to church.",
                completed: "How wonderful! Thank you for your service.",
            }, () => true, () => level.players[0].spreadWordCount >= 2, () => false,
            () => {
                const alexander = level.findByName("Alexander", "npcs")
                const joseph = level.findByName("Joseph", "npcs");
                alexander.churchTaskComplete = false;
                joseph.churchTaskComplete = false;
                level.players[0].spreadWordCount = 0;
                const newReply = new Reply("The priest requests your presence at church.", speaker => {
                    if(speaker.getOpinion("George") >= 0)
                        return "churchSucc";
                    else
                        return "churchFail";
                }, speaker => {
                    speaker.churchTaskComplete = true;
                    level.players[0].spreadWordCount++;
                    if(speaker.getOpinion("George") >= 0) {
                        speaker.modOpinion("player", 5);
                        speaker.modOpinion("George", 5);
                    }
                    else {
                        speaker.modOpinion("player", -5);
                        speaker.modOpinion("George", -5);
                    }
                }, speaker => !speaker.churchTaskComplete);
                alexander.addReplyToTopic(newReply, "greet");
                alexander.addReplyToTopic(newReply, "newTopic");
                joseph.addReplyToTopic(newReply, "greet");
                joseph.addReplyToTopic(newReply, "newTopic");
            }, () => {
                this.modOpinion("player", 20);
            }),
        ];
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "I appreciate your dedication.", 5);
        tg.addSmallTalk("ins1", "You seem pretty annoying.", -5);
        tg.addSmallTalk("comp2", "Nice haircut.", -3);
        tg.addSmallTalk("chat1", "This church is beautiful!", 10);
        tg.addInfo("quesName", "What is your name?", "ansName", "My name is George.");
        tg.addInfo("ques2", "What do you do?", "ans2", "I serve God as a priest.");
        tg.addInfo("quesGear", "Do you have any weapons or armor?", "ansGear", "No, I am a healer, not a fighter.");
        tg.addInfo("ques3", "Are people very religious around here?", "ans3", "Most come to church every once in a while, but beyond that I cannot say.");
        tg.addInfo("ques4", "Do you approve of killing?", "ans4", "I abide by the commandment to not murder any human. However, I care less for the wicked monsters outside these walls.");
        tg.addInfo("ques5", "Do you approve of drinking?", "ans5", "Drinking turns saints into sinners. I do not condone it.");
        this.topics = tg.generate();
        this.topics.forgiveFail = new Topic("I don't believe that he has done enough to deserve that. Return to me once he has changed his ways.", [
            new Reply("Very well.", "newTopic")
        ]);
        this.topics.forgiveSucc = new Topic("Very well. By the power of God, I declare his sins forgiven.", [
            new Reply("Thank you.", "newTopic")
        ]);
        this.setOpinion("player", 0);
        this.setOpinion("Alexander", 10);
        this.setOpinion("Joseph", -10);
        this.onEvent("drink alcohol", () => {
            this.opinions.player -= 2;
            this.addGreeting("I can smell the alcohol on your breath. Please do not enter the house of God with such disdain for proper conduct.");
        });
        this.onEvent("provide alcohol", () => {
            this.opinions.player -= 2;
            this.addGreeting("I see you have been peddling alcohol to others. I would advise you stay away from that sort of thing.");
        });
    }
}
class Watchman extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/guard_front_stand.png", walk1: "npcs/guard_front_move1.png", walk2: "npcs/guard_front_move2.png"}};
        super("Alexander", x, y, 60, 60, imgs, {moveSpd: 50}, []);
        this.doorOpened = false;
    }
    init() {
        this.stationary = true;
        this.quests = [
            new Quest("getbeer", "Get Beer", {
                request: "I would like somebody to bring me some beer.",
                description: "Standing out here in the sun all day has got me thirsty. Do you think you could get me some beer to drink?",
                accept: "Thanks, I knew you would understand!",
                reject: "That is unfortunate. I hope you change your mind.",
                update: "Do you have the beer? My throat is so parched...",
                reminder: "I wanted you to get me some beer, if possible.",
                completed: "*Gulp* Ah... That really hits the spot. thank you so much! I don't have much to give you in return, but here's a few spare coins.",
            }, () => true, () => level.players[0].invManager.hasItem("Beer"), () => false, null, () => {
                const im = level.players[0].invManager;
                im.removeFromInv(im.findByName("Beer"));
                level.players[0].collectGold(10);
                this.modOpinion("player", 20);
                main.broadcastEvent("provide alcohol");
            }),
            new Quest("newhelmet", "New Helmet", {
                request: "I could use a new helmet.",
                description: "This helmet has gotten rather old and frail over time. I could use a new one.",
                accept: "Thank you. I'm not sure where you can find one, but you might try talking to other people or fighting enemies.",
                reject: "That is unfortunate. I hope you change your mind.",
                update: "Do you have a new helmet for me?",
                reminder: "I wanted you to get me a new helmet. I believe certain monsters may them. You could also try to talking to people.",
                completed: "Thank you very much. Here is your reward.",
            }, () => true, () => level.players[0].invManager.hasItem("Plated Helmet"), () => false, null, () => {
                const im = level.players[0].invManager;
                im.removeFromInv(im.findByName("Plated Helmet"));
                level.players[0].collectGold(10);
                this.modOpinion("player", 20);
            }),
            new Quest("confession", "Confession", {
                request: "I need someone to make a confession for me.",
                description: "Back when when I was younger I killed many men, which I now regret. But whenever I try to talk to the priest, I cannot find the words. Can you ask for forgiveness on my behalf?",
                accept: "I greatly appreciate it.",
                reject: "I understand. It is an unusual task, I must admit.",
                update: "Has the priest bestowed upon me forgiveness?",
                reminder: "I would like you to ask the priest for forgiveness from former bloodlust. Please make great haste, I cannot bear the guilt much longer.",
                completed: "Thank you. Your kindness is exceedingly great.",
            }, () => {
                return this.getOpinion("player") >= 10 && this.getOpinion("George") >= 0;
            }, () => {
                return level.players[0].receivedForgiveness;
            }, () => {
                return false;
            }, () => {
                level.players[0].receivedForgiveness = false;
                const george = level.findByName("George", "npcs");
                const newReply = new Reply("The watchman Alexander begs for forgiveness from you.", speaker => {
                    if(speaker.getOpinion("Alexander") > 20)
                        return "forgiveSucc";
                    else
                        return "forgiveFail";
                }, speaker => {
                    if(speaker.getOpinion("Alexander") > 20)
                        level.players[0].receivedForgiveness = true;
                }, () => {
                    return !level.players[0].receivedForgiveness;
                });
                george.addReplyToTopic(newReply, "greet");
                george.addReplyToTopic(newReply, "newTopic");
            }, () => {
                this.modOpinion("player", 20);
            }),
        ];
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "That's some nice looking equipment!", 5);
        tg.addSmallTalk("ins2", "That armor looks stupid.", -10);
        tg.addSmallTalk("comp2", "You must have a lot of dedication. I like that.", 2);
        tg.addSmallTalk("neut1", "I'm glad I'm not you! standing out here in the sun seems pretty boring.", 0);
        tg.addSmallTalk("ins1", "I can't believe you would serve such a corrupt establishment.", -5);
        tg.addInfo("quesName", "What is your name?", "ansName", "I am Alexander, Captain of the Watch.");
        tg.addInfo("ques1", "What do you do?", "ans1", "I guard the castle against intruders.");
        tg.addInfo("quesGear", "Do you have any weapons or armor?", "ansGear", "Only that which I am currently using.");
        tg.addInfo("ques2", "Do you like your job?", "ans2", "It's okay, but can get a bit tiresome.");
        tg.addInfo("ques3", "Who do you serve?", "ans3", "His Majesty King Peter, lord of this realm.");
        tg.addInfo("ques4", "What do you think about fighting monsters?", "ans4", "The more of those foul beasts are killed the better.");
        tg.addInfo("quesDoor", "What is this door?", "door", null, null, speaker => !speaker.doorOpened);
        tg.addStartReply(new Reply("Can you tell me about this door?", "door"));
        this.topics = tg.generate();
        this.topics.door = new Topic("This is the entry to the king's castle.", [
            new Reply("Can I enter?", "entrySucc", speaker => {
                level.changeMapTile(15, 19, new Tile("stone_floor.png", false));
                const framePos = level.map.tileIndexToCoords(15, 19);
                level.environment.push(new DoorFrame(framePos.x, framePos.y));
                const msg = "Thanks for playing! If you have a moments, please fill out the shorty survey linked on the left. Note: the area beyond this point is incomplete, and may not work as intended.";
                console.log(this.pos.x, this.pos.y);
                level.texts.push(new WideText(1000, 1320, msg, "rgb(230, 230, 230)", 0, Infinity));
                speaker.doorOpened = true;
            }, speaker => speaker.getOpinion("player") >= 50),
            new Reply("Can I enter?", "entryFail", null, speaker => speaker.getOpinion("player") < 50),
            new Reply("Let's talk about something else.", "newTopic")
        ]);
        this.topics.entrySucc = new Topic("Oh... yes, I think I trust you enough. Go right in.", [
            new Reply("Wait, I still want to talk to you.", "newTopic"),
            new Reply("Thanks! I will.", "goodbye")
        ]);
        this.topics.entryFail = new Topic("No, I'm afraid I don't trust you enough for that.", [
            new Reply("That's too bad. But let's talk about something else.", "newTopic"),
            new Reply("Oh, well in that case I should be going.", "goodbye")
        ]);
        this.topics.payFines = new Topic("Very well. He owes 50 gold.", [
            new Reply("50! That is outrageous! Surely he doesn't deserve that...", () => {
                if(this.opinions.player < 15)
                    return "persuadeFail1";
                else if(this.opinions["Joseph"] <= -20)
                    return "persuadeFail2";
                else
                    return "persuadeSuccess";
            }, () => {
                if(this.opinions.player < 20 || this.opinions["Joseph"] < -20)
                    this.modOpinion("player", -5);
                else
                    this.modOpinion("player", 5);
            }),
            new Reply("Very well. Here's the gold.", "payedOff", () => {
                level.players[0].spendGold(50),
                level.findByName("Joseph", "npcs").finesPayed = true;
            }, () => level.players[0].status.gold >= 50),
            new Reply("I'm sorry, I can't afford that right now. I'll come back later.", "goodbye")
        ]);
        this.topics.persuadeFail1 = new Topic("You can't sweet talk me. I am the law.", [
            new Reply("Okay, let's start over.", "payFines"),
            new Reply("I'll be leaving then.", "goodbye")
        ]);
        this.topics.persuadeFail2 = new Topic("No way. That reprobate deserves to pay every last coin.", [
            new Reply("Okay, let's start over.", "payFines"),
            new Reply("I'll be leaving then.", "goodbye")
        ]);
        this.topics.persuadeSuccess = new Topic("Oh... I suppose I am in a good mood. I'll lower it to 15 gold.", [
            new Reply("Thank you! I have 15 right here.", "payedOff", () => {
                const player = level.players[0];
                player.spendGold(15);
                level.findByName("Joseph", "npcs").finesPayed = true;
            }, () => level.players[0].status.gold >= 15),
            new Reply("I'm sorry, I can't afford that right now. I'll come back later.", "goodbye")
        ]);
        this.topics.payedOff = new Topic("Thank you citizen. I hereby declare the fines lifted.", [
            new Reply("Thank you, goodbye!", "goodbye")
        ]);
        this.topics.churchFail = new Topic("I'm afraid I've grown too old for that dusty place. No, tell the priest that I cannot make it.", [
            new Reply("Okay.", "newTopic")
        ]);
        this.topics.churchSucc = new Topic("Thank you for reminding me! Yes, I must return to the church more frequently.", [
            new Reply("Great!", "newTopic")
        ]);
        this.setOpinion("King Peter", 50);
        this.setOpinion("Joseph", 10);
        this.setOpinion("George", 10);
        this.setOpinion("player", 0);
        this.onEvent("kill", () => {
            this.opinions.player += 1;
            if(this.opinions.player > 20)
                this.addGreeting("Has yet another monster fallen by your hand? Great work, noble fighter!");
        });
    }
}
class Odyss extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/blacksmith_front_stand.png", walk1: "npcs/blacksmith_front_move1.png", walk2: "npcs/blacksmith_front_move2.png"}};
        super("Odyss", x, y, 60, 60, imgs, {moveSpd: 50}, [], [
            new Dagger(),
            new Sword(),
            new Shield(),
            new PlateArmor(),
            new MetalHelmet(),
            new SkyArmor(),
            new SkyDagger(),
            new SkySword()
        ]);
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "You must be so strong!", 3);
        tg.addSmallTalk("ins1", "Brute strength is not as important as intelligence, you know.", -5);
        tg.addSmallTalk("comp2", "I admire the work you do.", 8);
        tg.addInfo("ques1", "What is your name?", "ans1", "My name is Odyss.");
        tg.addInfo("ques2", "What do you do?", "ans2", "I am the castle blacksmith. I make weapons, armor, and tools for people around here.");
        this.topics = tg.generate();
        this.setOpinion("Joseph", 10);
    }
}
class Sarah extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/farmer2_front_stand.png", walk1: "npcs/farmer2_front_move1.png", walk2: "npcs/farmer2_front_move2.png"}};
        super("Sarah", x, y, 60, 60, imgs, {moveSpd: 50}, []);
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "You look pretty!", 5);
        tg.addSmallTalk("ins1", "You look ugly.", -5);
        tg.addInfo("ques1", "What do you do?", "ans1", "I mostly just tend to everyday chores.");
        this.topics = tg.generate();
        this.setOpinion("Princess Lilly", 20);
        this.setOpinion("Joseph", 5);
    }
}
class Lexor extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/entertainer_front_stand.png", walk1: "npcs/entertainer_front_move1.png", walk2: "npcs/entertainer_front_move2.png"}};
        super("Lexor", x, y, 60, 60, imgs, {moveSpd: 50}, []);
        
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("hat", "That's a weird looking hat.", -10);
        tg.addInfo("ques1", "What do you do?", "ans1", "I keep the king entertained!");
        this.topics = tg.generate();
        this.setOpinion("King Peter", 10);
        this.setOpinion("Joseph", -15);
    }
}
class Hamar extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/cook_front_stand.png", walk1: "npcs/cook_front_move1.png", walk2: "npcs/cook_front_move2.png"}};
        super("Hamar", x, y, 60, 60, imgs, {moveSpd: 50}, []);
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("comp1", "You must love food! I think that's great.", 5);
        tg.addInfo("ques1", "What do you do?", "ans1", "I prepare all the food for the castle.");
        this.topics = tg.generate();
        this.setOpinion("King Peter", 10);
        this.setOpinion("Joseph", 10);
    }
}
class King extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/king_front_stand.png", walk1: "npcs/king_front_move1.png", walk2: "npcs/king_front_move2.png"}};
        const topics = {
            greet: new Topic("Oh hello. How can I help you?", [
                new Reply("Could I have a word with you?", speaker => {
                    if(speaker.opinions.player < 30) return "greetFail";
                    else return "greetSuccess";
                }),
                new Reply("Nevermind, your majesty.", "goodbye"),
            ]),
            goodbye: new Topic("Farewell then.", [
                new Reply("Farewell.")
            ]),
            greetFail: new Topic("I'm afraid I'm not much one for casual conversation. You might try speaking to one of my subjects instead.", [
                new Reply("Very well, your majesty.", "goodbye"),
                new Reply("Wow, that's rude. Goodbye.", null, speaker => speaker.modOpinion("player", -2))
            ]),
            greetSuccess: new Topic("Very well. I trust it is worth my while. What do you have to say?", [
                new Reply("Honor to you my king! You rule with truth and justice!", "flattery"),
                new Reply("Nice weather we have been having, wouldn't you say?", "chat"),
                new Reply("You are a disgrace to this kingdom!", "insult", speaker => speaker.modOpinion("player", -10)),
                new Reply("May I have your daughter's hand in marriage?", speaker => {
                    if(speaker.opinions.player < 100) return "marryFail";
                    else return "marrySucces";
                }),
            ]),
            flattery: new Topic("I appreciate your loyalty, but I tire of idle praises. If you wish to impress me, treat my subjects with kindness.", [
                new Reply("Very well, your majesty. I will do so at once.", "goodbye"),
                new Reply("I see. Can I say something else though?", "greetSuccess"),
            ]),
            chat: new Topic("I don't have time for such pointless chatter. If you would like to talk about such things, please do so with somebody else.", [
                new Reply("As you say, your majesty. I must be going.", "goodbye"),
                new Reply("I see. Can I say something else though?", "greetSuccess"),
            ]),
            insult: new Topic("What? How dare you speak such slander in my own household!", [
                new Reply("How dare you act like such a stupid, miserable ruler!", "insultMore", speaker => speaker.modOpinion("player", -10)),
                new Reply("That's just my opinion. I'll leave now."),
                new Reply("I'm sorry, I don't know why I said that.", "apologize", speaker => speaker.modOpinion("player", 5))
            ]),
            insultMore: new Topic("Such impudence! Don't let your mouth get away with you.", [
                new Reply("You're a disgusting pig!", "insultEvenMore", speaker => speaker.modOpinion("player", -20)),
                new Reply("That's all. Goodbye."),
                new Reply("I'm really sorry, that might have been a bit excessive.", "apologize", speaker => speaker.modOpinion("player", 5))
            ]),
            insultEvenMore: new Topic("I see there is no reasoning with you. If this is your behaviour, then I have nothing more to say to you.", [
                new Reply("Whatever piggy. Oink.", null, speaker => speaker.modOpinion("player", -5)),
                new Reply("Goodbye.")
            ]),
            apologize: new Topic("I see. While I cannot entirely forgive your disgraceful words, I do appreciate the attempt at humility.", [
                new Reply("Thank you. I must be going now.", "goodbye")
            ]),
            marryFail: new Topic("I'm afraid I cannot simply hand over my daughter to any suitor who desires her. You must prove yourself more first.", [
                new Reply("I shall indeed! I will return soon, your majesty.", "goodbye"),
                new Reply("Eh, honestly that kind of stuff isn't really for me. I must go now.", "goodbye")
            ]),
            marrySucces: new Topic("Truth be told, I could not think of a better person for my daughter to marry! I will arrange the wedding at once!", [
                new Reply("Oh thank you! I look forward to it.")
            ])
        }
        super("King Peter", x, y, 60, 60, imgs, {moveSpd: 30}, topics);
    }
    init() {
        this.setOpinion("Princess Lilly", 100);
        this.stationary = true;
    }
}
class Princess extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/princess_front_stand.png", walk1: "npcs/princess_front_move1.png", walk2: "npcs/princess_front_move2.png"}};
        super("Princess Lilly", x, y, 60, 60, imgs, {moveSpd: 40}, []);
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("flirt1", "Hey sexy...", -10);
        tg.addSmallTalk("flirt2", "Aww! You look so cute!", -5);
        tg.addSmallTalk("flirt3", "That's a nice dress.", 2);
        tg.addInfo("ques1", "What do you do?", "ans1", "I'm the daughter of King Peter, and attend the appropriate royal duties as such.");
        this.topics = tg.generate();
        this.setOpinion("King Peter", 20);
    }
}
class Duchess extends Npc {
    constructor(x, y) {
        const imgs = {front: {stand: "npcs/duchess_front_stand.png", walk1: "npcs/duchess_front_move1.png", walk2: "npcs/duchess_front_move2.png"}};
        super("Duchess Elizabeth", x, y, 60, 60, imgs, {moveSpd: 40}, []);
    }
    init() {
        const tg = new TopicGenerator(getNpcList(this.name), this.quests);
        tg.addSmallTalk("flirt1", "Hey, you seem nice!", -5);
        tg.addInfo("ques1", "What do you do?", "ans1", "I'm one the Duchess of Lostershire. I have come to see the king on important business on behalf of my husband.");
        this.topics = tg.generate();
        this.setOpinion("King Peter", 10);
        this.setOpinion("Princess Lilly", -10);
    }
}

// Cheats
function resetAllGossip() {
    level.npcs.forEach(npc => npc.resetGossip());
}
