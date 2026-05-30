extends Node

var save_path: String = "user://savegame_slot1.save"
var active_slot: int = 1:
	set(val):
		active_slot = val
		save_path = "user://savegame_slot" + str(active_slot) + ".save"

var supabase_url: String = ""
var supabase_key: String = ""
var http_node: HTTPRequest

func _ready() -> void:
	# Migrate legacy single save to slot 1 if slot 1 doesn't exist yet
	var old_path = "user://savegame.save"
	var slot1_path = "user://savegame_slot1.save"
	if FileAccess.file_exists(old_path) and not FileAccess.file_exists(slot1_path):
		var dir = DirAccess.open("user://")
		if dir:
			dir.rename(old_path, slot1_path)
			print("SaveSystem: Migrated legacy save file to Slot 1.")

	# Load credentials from environment or config file
	supabase_url = OS.get_environment("SUPABASE_URL")
	supabase_key = OS.get_environment("SUPABASE_KEY")
	
	if supabase_url.is_empty() or supabase_key.is_empty():
		_load_config_file()
		
	if is_supabase_enabled():
		print("SaveSystem: Supabase credentials found. Cloud saving active.")
		http_node = HTTPRequest.new()
		add_child(http_node)
		http_node.request_completed.connect(_on_request_completed)
	else:
		print("SaveSystem: Supabase credentials not found. Operating in Local-only mode.")

func _load_config_file() -> void:
	var cfg_path = "res://supabase_config.json"
	if FileAccess.file_exists(cfg_path):
		var file = FileAccess.open(cfg_path, FileAccess.READ)
		var json = JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data = json.get_data()
			supabase_url = data.get("supabase_url", "")
			supabase_key = data.get("supabase_key", "")

func is_supabase_enabled() -> bool:
	return not supabase_url.is_empty() and not supabase_key.is_empty()

func save_game() -> void:
	# 1. Save locally first (always robust)
	var save_data = {
		"health": GameManager.current_health,
		"quests": QuestManager.active_quests,
		"completed": QuestManager.completed_quests,
		"inventory": InventoryManager.items,
		"timestamp": Time.get_unix_time_from_system()
	}
	
	var file = FileAccess.open(save_path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		print("Game saved successfully to local file: ", save_path)
	else:
		print("Error saving game locally.")
		
	# 2. Asynchronously sync to Supabase if enabled
	if is_supabase_enabled():
		_sync_to_supabase(save_data)

func _sync_to_supabase(save_data: Dictionary) -> void:
	if not http_node:
		return
		
	var url = supabase_url.trim_suffix("/") + "/rest/v1/game_saves"
	var headers = [
		"apikey: " + supabase_key,
		"Authorization: Bearer " + supabase_key,
		"Content-Type: application/json",
		"Prefer: resolution=merge-duplicates"
	]
	
	var payload = {
		"id": "default_player_slot" + str(active_slot),
		"save_data": save_data,
		"updated_at": Time.get_datetime_string_from_system(true)
	}
	
	var json_payload = JSON.stringify(payload)
	var err = http_node.request(url, headers, HTTPClient.METHOD_POST, json_payload)
	if err != OK:
		print("Failed to initiate Supabase sync request, error code: ", err)

func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS:
		print("Supabase Save Sync failed due to network or connection issue.")
		return
		
	if response_code >= 200 and response_code < 300:
		print("Supabase Save Sync Succeeded! Response code: ", response_code)
	else:
		var response_text = body.get_string_from_utf8()
		print("Supabase Save Sync returned error response: ", response_code, " Body: ", response_text)

var has_loaded: bool = false

func has_save_file() -> bool:
	return FileAccess.file_exists(save_path)

func has_save_file_in_slot(slot: int) -> bool:
	return FileAccess.file_exists("user://savegame_slot" + str(slot) + ".save")

func load_game() -> void:
	if has_loaded:
		return
	has_loaded = true
	
	# 1. Load locally first for instant access
	if FileAccess.file_exists(save_path):
		var file = FileAccess.open(save_path, FileAccess.READ)
		var json = JSON.new()
		var error = json.parse(file.get_as_text())
		if error == OK:
			var data = json.get_data()
			_apply_save_data(data)
			print("Game loaded successfully from local save.")

			
	# 2. If Supabase is enabled, we can fetch the latest save from cloud
	if is_supabase_enabled():
		_fetch_from_supabase()

func _fetch_from_supabase() -> void:
	var temp_http = HTTPRequest.new()
	add_child(temp_http)
	temp_http.request_completed.connect(func(result, response_code, headers, body):
		if result == HTTPRequest.RESULT_SUCCESS and response_code == 200:
			var json = JSON.new()
			if json.parse(body.get_string_from_utf8()) == OK:
				var data_array = json.get_data()
				if data_array is Array and data_array.size() > 0:
					var cloud_data = data_array[0].get("save_data", {})
					var cloud_time = cloud_data.get("timestamp", 0.0)
					
					# Compare timestamps to load the newest one
					var local_time = 0.0
					if FileAccess.file_exists(save_path):
						var file = FileAccess.open(save_path, FileAccess.READ)
						var json_local = JSON.new()
						if json_local.parse(file.get_as_text()) == OK:
							local_time = json_local.get_data().get("timestamp", 0.0)
							
					if cloud_time > local_time:
						print("Cloud save is newer than local save. Applying cloud save.")
						_apply_save_data(cloud_data)
						# Update local cache
						var cache_file = FileAccess.open(save_path, FileAccess.WRITE)
						if cache_file:
							cache_file.store_string(JSON.stringify(cloud_data))
					else:
						print("Local save is up-to-date or newer than cloud save.")
		temp_http.queue_free()
	)
	
	var url = supabase_url.trim_suffix("/") + "/rest/v1/game_saves?id=eq.default_player_slot" + str(active_slot) + "&select=*"
	var headers = [
		"apikey: " + supabase_key,
		"Authorization: Bearer " + supabase_key
	]
	temp_http.request(url, headers, HTTPClient.METHOD_GET)

func _apply_save_data(data: Dictionary) -> void:
	GameManager.current_health = data.get("health", 100)
	QuestManager.active_quests = data.get("quests", [])
	QuestManager.completed_quests = data.get("completed", [])
	InventoryManager.items = data.get("inventory", {})
	if get_tree().root.has_node("Main/HUD"):
		get_tree().root.get_node("Main/HUD").update_ui()

