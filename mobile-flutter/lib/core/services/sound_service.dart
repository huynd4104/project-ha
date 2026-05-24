import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SoundService {
  SoundService._();
  static final instance = SoundService._();

  final _player = AudioPlayer();
  bool enabled = true;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    enabled = prefs.getBool('sound_enabled') ?? true;
  }

  Future<void> setEnabled(bool value) async {
    enabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('sound_enabled', value);
  }

  Future<void> play(String key) async {
    if (!enabled) return;
    try {
      await _player.play(AssetSource('sounds/$key.wav'));
    } catch (_) {
      // Sound is optional in this phase.
    }
  }
}
