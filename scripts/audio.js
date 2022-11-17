const audio = {
	musicOn: localStorage.getItem("musicOn") == "true",
	soundOn: localStorage.getItem("soundOn") == "true",
	play: function(sound, wait) {
		if(audio.soundOn) {
			if(wait === undefined) wait = 0;
			scheduler.addTimeout(() => {
				const audio = new Audio("sounds/" + sound);
				audio.play();
			}, wait);
		}
	},
	toggleMusic: function() {
		const music = document.getElementById("music");
		if(audio.musicOn) {
			audio.musicOn = false;
			music.pause();
		}
		else {
			audio.musicOn = true;
			music.play();
		}
		localStorage.setItem("musicOn", audio.musicOn.toString());
		renderer.toggleMusicBtn(audio.musicOn);
	},
	toggleSound: function() {
		if(audio.soundOn)
			audio.soundOn = false;
		else
			audio.soundOn = true;
		localStorage.setItem("soundOn", audio.soundOn.toString());
		renderer.toggleSoundBtn(audio.soundOn);
	},
	initSound: function() {
		if(audio.musicOn === undefined)
			musicOn = true;
		if(audio.soundOn === undefined)
			soundOn = true;
		renderer.toggleMusicBtn(audio.musicOn);
		renderer.toggleSoundBtn(audio.soundOn);
		const music = document.getElementById("music");
		if(audio.musicOn)
			music.play();
		const musicCtrl = document.getElementById("music-control");
		musicCtrl.onclick = audio.toggleMusic;
		const soundCtrl = document.getElementById("sound-control");
		soundCtrl.onclick = audio.toggleSound;
	},
};