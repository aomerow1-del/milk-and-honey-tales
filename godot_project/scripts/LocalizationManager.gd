extends Node

var current_lang: String = "en"
var is_rtl: bool = false

var translations: Dictionary = {
	"en": {},
	"he": {}
}

func _ready() -> void:
	load_translations()
	print("LocalizationManager initialized from CSV.")

func load_translations() -> void:
	var path = "res://localization.csv"
	if not FileAccess.file_exists(path):
		print("Warning: localization.csv not found at res://localization.csv")
		# Fallback hardcoded values in case of file issues
		translations = {
			"en": {
				"greeting": "Hello, traveler! Welcome to the Negev.",
				"quest_start": "Find the ancient Bamba Golem.",
				"boon_offer": "Choose a Divine Boon.",
				"health": "Health",
				"gold": "Gold",
				"inventory": "Inventory",
				"shop": "Shop",
				"buy": "Buy"
			},
			"he": {
				"greeting": "שלום עובר אורח! ברוך הבא לנגב.",
				"quest_start": "מצא את גולם הבמבה העתיק.",
				"boon_offer": "בחר ברכה אלוהית.",
				"health": "בריאות",
				"gold": "זהב",
				"inventory": "מלאי",
				"shop": "חנות",
				"buy": "קנה"
			}
		}
		return

	var file = FileAccess.open(path, FileAccess.READ)
	if not file:
		print("Error opening localization.csv")
		return

	# Skip header line (keys,en,he)
	var _header = file.get_csv_line()

	while not file.eof_reached():
		var fields = file.get_csv_line()
		if fields.size() >= 3:
			var key = fields[0].strip_edges()
			if key.is_empty():
				continue
			var en_val = fields[1]
			var he_val = fields[2]
			translations["en"][key] = en_val
			translations["he"][key] = he_val

func toggle_language() -> void:
	if current_lang == "en":
		current_lang = "he"
		is_rtl = true
	else:
		current_lang = "en"
		is_rtl = false
	print("Language changed to: " + current_lang)

func get_string(key: String) -> String:
	if translations.has(current_lang) and translations[current_lang].has(key):
		return translations[current_lang][key]
	return key

