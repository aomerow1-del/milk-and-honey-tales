extends Node

var current_lang: String = "en"
var is_rtl: bool = false

var translations: Dictionary = {
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

func _ready() -> void:
    print("LocalizationManager initialized.")

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
