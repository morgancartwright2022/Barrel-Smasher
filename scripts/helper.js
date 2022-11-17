const helper = {
	posToAng: function(x1, y1, x2, y2) {
		//converts position points to an angle
		let angle = Math.atan((y2 - y1)/(x2 - x1));
		if(x2 < x1)
			angle += Math.PI;
		else if(y2 > y1)
			angle += 2*Math.PI;
		return angle
	},
	impStdDirImgs: function(baseSrc) {
		//Quick way to get all images for a directional sprite using a template
		//One unfortunate side effect is that it assumes all images are present
		const format = ".png";
		return {
			front: {
				stand: baseSrc + "_front" + format,
				preAtk: baseSrc + "_front_atk1" + format,
				atk: baseSrc + "_front_atk2" + format,
				preOffAtk: baseSrc + "_front_atk3" + format,
				offAtk: baseSrc + "_front_atk4" + format,
				walk1: baseSrc + "_front_move1" + format,
				walk2: baseSrc + "_front_move2" + format,
				use: baseSrc + "_front_use" + format,
				blk: baseSrc + "_front_blk" + format,
				crouch: baseSrc + "_front_crouch" + format
			},
			side: {
				stand: baseSrc + "_side" + format,
				preAtk: baseSrc + "_side_atk1" + format,
				atk: baseSrc + "_side_atk2" + format,
				preOffAtk: baseSrc + "_side_atk3" + format,
				offAtk: baseSrc + "_side_atk4" + format,
				walk1: baseSrc + "_side_move1" + format,
				walk2: baseSrc + "_side_move2" + format,
				use: baseSrc + "_side_use" + format,
				blk: baseSrc + "_side_blk" + format,
				crouch: baseSrc + "_side_crouch" + format
			},
			back: {
				stand: baseSrc + "_back" + format,
				preAtk: baseSrc + "_back_atk1" + format,
				atk: baseSrc + "_back_atk2" + format,
				preOffAtk: baseSrc + "_back_atk3" + format,
				offAtk: baseSrc + "_back_atk4" + format,
				walk1: baseSrc + "_back_move1" + format,
				walk2: baseSrc + "_back_move2" + format,
				use: baseSrc + "_back_use" + format,
				blk: baseSrc + "_back_blk" + format,
				crouch: baseSrc + "_back_crouch" + format
			},
		};
	},
	impRandomImg: function(imgArr) {
		return imgArr[Math.floor(Math.random() * imgArr.length)]
	},
};