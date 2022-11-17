let itemId = 0;
class Item {
	constructor(name, desc, img, value, weight, stats, slot, type, sounds) {
		this.name = name;
		this.id = name + itemId;
		itemId++;
		this.desc = desc;
		this.img = img;
		this.value = value;
		this.weight = weight;
		this.slot = slot;
		this.stats = stats;
		this.type = type;
		this.sounds = sounds
	}
	onUse() {}
}
class WoodStaff extends Item {
	constructor() {
		super("Wooden Staff", "A long, stout staff of sturdy wood.", "wood_staff.png", 10, 5, {minDmg: 30, maxDmg: 45, atkSpd: 60, range: 16}, "mainHand", "staff");
	}
}
class DarkStaff extends Item {
	constructor() {
		super("Deepwood Staff", "A dark staff that emanates an unknown power.", "dark_staff.png", 50, 5, {minDmg: 35, maxDmg: 55, atkSpd: 50, range: 17}, "mainHand", "staff");
	}
}
class Dagger extends Item {
	constructor() {
		super("Dagger", "A small blade of metal. Its edges are fairly sharp, and it can be wielded with speed.", "dagger.png", 10, 3, {minDmg: 20, maxDmg: 40, atkSpd: 75, range: 9}, "mainHand", "dagger");
	}
}
class SkyDagger extends Item {
	constructor() {
		super("Skyforge Dagger", "A lightweight dagger made of artisan tempered blue steel and sharpened to a fine edge.", "sky_dagger.png", 40, 3, {minDmg: 25, maxDmg: 45, atkSpd: 80, range: 9}, "mainHand", "dagger");
	}
}
class Sword extends Item {
	constructor() {
		super("Short Sword", "A short, broad sword such as is commonly used by most warriors.", "sword.png", 10, 14, {minDmg: 45, maxDmg: 65, atkSpd: 45, range: 13}, "mainHand", "sword");
	}
}
class SkySword extends Item {
	constructor() {
		super("Skyforge Sword", "A lightweight sword of blue steel that is fast to swing and cuts deep.", "sky_sword.png", 50, 14, {minDmg: 50, maxDmg: 75, atkSpd: 50, range: 13}, "mainHand", "sword");
	}
}
class Bow extends Item {
	constructor() {
		super("Short Bow", "A small bow for launching arrows. It's made of dark, limber wood.", "bow.png", 10, 5, {minDmg: 25, maxDmg: 35, atkSpd: 50, range: 60}, "mainHand", "bow");
	}
}
class DarkBow extends Item {
	constructor() {
		super("Deepwood Bow", "A strange bow of dark wood which is both strong and flexible.", "dark_bow.png", 50, 5, {minDmg: 30, maxDmg: 45, atkSpd: 50, range: 65}, "mainHand", "bow");
	}
}
class Arrows extends Item {
	constructor() {
		super("Dull Arrows", "Ordinary arrows with simple shafts and fletching and tipped with somewhat dull heads.", "arrows.png", 10, 4, {dmg: 5, range: 5}, "offHand", "arrows");
	}
}
class OldOrb extends Item {
	constructor() {
		super("Dusty Orb", "An old orb which slightly increases your casting ability.", "old_orb.png", 40, 2, {spellpower: 1}, "offHand", "orb");
	}
}
class Shield extends Item {
	constructor() {
		super("Templar's Shield", "A metal shield with a holy symbol inscribed upon it.", "shield.png", 10, 25, {def: 4, blk: 35}, "offHand", "shield");
	}
}
class BarkShield extends Item {
	constructor() {
		super("Bark Shield", "A rather large shield of rough bark. It's heavy, but fairly protective.", "ogre_shield.png", 35, 30, {def: 7, blk: 40, moveSpd: -2}, "offHand", "shield");
	}
}
class WardenShield extends Item {
	constructor() {
		super("Warden's Shield", "A thick shield used by the guardian's of the temple treasuries. While very good at protecting the user, it is somewhat heavy.", "warden_shield.png", 50, 32, {def: 5, blk: 50, moveSpd: -2}, "offHand", "shield");
	}
}
class OldCase extends Item {
	constructor() {
		super("Aged Scroll Case", "A case which can carry spell scrolls. It has aged with time.", "old_case.png", 30, 1, {mp: 40, spellpower: 5, castDelay: 45}, "spells", "scroll case");
	}
}
class HolyFocus extends Item {
	constructor() {
		super("Divine Focus", "A work of beautiful metals which radiates light. It receives and directs divine energies for the user.", "holy_focus.png", 30, 1, {mp: 40, spellpower: 4, castDelay: 25}, "spells", "holy focus");
	}
}
class Cloak extends Item {
	constructor() {
		super("Shadow Cloak", "A magical cloak of black fabric, which grants its user speed and may provide invisibility from enemies.", "cloak.png", 30, 4, {mp: 30, spellpower: 4, castDelay: 20, moveSpd: 20}, "spells", "cloak");
	}
}
class Satchel extends Item {
	constructor() {
		super("Hunter's Satchel", "A bag full of wild vegetation that contains magical properties.", "satchel.png", 30, 4, {mp: 30, spellpower: 4, castDelay: 30}, "spells", "satchel");
	}
}
class Robe extends Item {
	constructor() {
		super("Brown Robe", "A simple brown robe, often used by commoners, as well as low ranking magic users.", "robe.png", 20, 6, {hp: 30, mp: 30}, "body", "robe");
	}
}
class MagusRobe extends Item {
	constructor() {
		super("Magus Robe", "A magical robe imbued with arcane runes.", "magus_robe.png", 20, 6, {hp: 40, mp: 50}, "body", "robe");
	}
}
class LeatherArmor extends Item {
	constructor() {
		super("Leather Armor", "A tunic of hardened leather which provides light defense against attacks.", "leather_armor.png", 25, 20, {hp: 40, def: 3}, "body", "light armor");
	}
}
class StuddedLeatherArmor extends Item {
	constructor() {
		super("Studded Leather Armor", "A coat studded with metal and bound together with leather. It is very protective while still being light enough for quick movement.", "studded_leather_armor.png", 40, 30, {hp: 50, def: 5}, "body", "light armor");
	}
}
class PlateArmor extends Item {
	constructor() {
		super("Plate Armor", "A heavy coat of metal plates which greatly protects the user from blows. It is quite heavy however, reducing the speed of the wearer.", "plate_armor.png", 30, 45, {hp: 50, def: 8, moveSpd: -8}, "body", "heavy armor");
	}
}
class SkyArmor extends Item {
	constructor() {
		super("Skyforge Armor", "A set of blue steel armor that feels fairly light for its considerable bulk.", "sky_armor.png", 30, 45, {hp: 60, def: 10, moveSpd: -5}, "body", "heavy armor");
	}
}
class OldHat extends Item {
	constructor() {
		super("Tattered Wizard Hat", "A hat, which has little defensive or magical capabilities left.", "old_hat.png", 15, 2, {hp: 10, mp: 20}, "head", "hat");
	}
}
class LeatherHelmet extends Item {
	constructor() {
		super("Leather Helmet", "Protective headgear made of tough leather and bound together with thick cords.", "leather_helmet.png", 20, 5, {hp: 15, def: 2}, "head", "light helmet");
	}
}
class MetalHelmet extends Item {
	constructor() {
		super("Plated Helmet", "A solid helm of metal plates with iron bands connecting them. It provides fairly good protection to the head.", "metal_helmet.png", 30, 10, {hp: 30, def:  3, moveSpd: -3}, "head", "heavy helmet");
	}
}
class LesserMpRing extends Item {
	constructor() {
		super("Lesser Magus Ring", "An old copper ring inset with an lightly enchanted amethyst which grants some magical energy to its wearer.", "purple_ring1.png", 25, 0, {mp: 20}, "ring1", "ring");
	}
}
class LesserHpRing extends Item {
	constructor() {
		super("Lesser Health Ring", "An old copper ring with a dull ruby on it, which grants additional health.", "red_ring1.png", 25, 0, {hp: 20}, "ring1", "ring");
	}
}
class DualRing extends Item {
	constructor() {
		super("Ring of Duality", "A silver ring which strengthens both body and mind.", "rp_ring.png", 100, 0, {hp: 20, mp: 20}, "ring1", "ring");
	}
}
class LesserSpdRing extends Item {
	constructor() {
		super("Lesser Speed Ring", "A small band of copper with a jade stone which grants its wearer slightly faster movement speed.", "teal_ring1.png", 30, 0, {moveSpd: 3}, "ring1", "ring");
	}
}
class InsaneSpdRing extends Item {
	constructor() {
		super("Ring of Insane Spd", "A ring which makes you super super fast.", "teal_ring1.png", 20000, 0, {moveSpd: 500}, "ring1", "ring");
	}
}
class LesserWarriorAmulet extends Item {
	constructor() {
		super("Lesser Warrior Amulet", "A small copper necklace with an enchanted gem on it, which seems to glow like an ember. It increases attack speed and damage.", "orange_amulet1.png", 35, 1, {atkSpd: 3, dmg: 5}, "neck", "amulet");
	}
}
class BarbarianNecklace extends Item {
	constructor() {
		super("Necklace of the Barbarian", "A thick cord bearing ferocious teeth. It seems to eminate a savage power.", "tooth_necklace.png", 40, 1, {hp: 20, atkSpd: -3, dmg: 8}, "neck", "amulet");
	}
}
class MinorHpPotion extends Item {
	constructor() {
		super("Minor Healing Potion", "A potion of swirling magical liquid which cures small wounds.", "red_potion1.png", 10, 1, {minHpRes: 25, maxHpRes: 40}, "none", "consumable", {use: "gulp.wav"});
	}
}
class MinorMpPotion extends Item {
	constructor() {
		super("Minor Magus Potion", "A shimmering potion of magical elixir which restores magus.", "purple_potion1.png", 10, 1, {minMpRes: 25, maxMpRes: 40}, "none", "consumable", {use: "gulp.wav"});
	}
}
class Beer extends Item {
	constructor() {
		super("Beer", "A mug of good foamy ale. It smells of barley and hops.", "beer.png", 5, 1, {minHpRes: 5, maxHpRes: 5}, "none", "consumable", {use: "gulp.wav"})
	}
	onUse() {
		main.broadcastEvent("drink alcohol");
	}
}