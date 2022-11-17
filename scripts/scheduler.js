"use strict"
const scheduler = {
	events: [],
	addTimeout: function(func, life) {
		scheduler.events.push({type: "timeout", func: func, life: life});
	},
	addInterval: function(func, life, interval) {
		scheduler.events.push({type: "interval", func: func, life: life, interval: interval});
	},
	incrementTime: function() {
		for(let i = scheduler.events.length - 1; i >= 0; i--) {
			const ev = scheduler.events[i];
			ev.life--;
			if(ev.type == "interval" && ev.life % ev.interval == 0)
				ev.func();
			if(ev.life < 1) {
				if(ev.type == "timeout")
					ev.func();
				scheduler.events.splice(i, 1);
			}
		}
	}
};