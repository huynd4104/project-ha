import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SoundService {
  SoundService._();
  static final instance = SoundService._();

  final Map<String, AudioPlayer> _players = {};
  final AudioPlayer _remotePlayer = AudioPlayer();
  bool enabled = true;
  DateTime? _lastPlayTime;

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

    final now = DateTime.now();
    if (_lastPlayTime != null &&
        now.difference(_lastPlayTime!).inMilliseconds < 150) {
      return; // Ignore rapid taps to prevent native audio thread lockups/crashes
    }
    _lastPlayTime = now;

    try {
      var player = _players[key];
      if (player == null) {
        player = AudioPlayer();
        _players[key] = player;
      }
      await player.play(AssetSource('sounds/$key.wav'));
    } catch (_) {
      // Sound is optional in this phase.
    }
  }

  Future<bool> playUrl(String? url) async {
    final trimmed = url?.trim() ?? '';
    if (!enabled || trimmed.isEmpty) return false;
    try {
      await _remotePlayer.stop();
      await _remotePlayer.play(UrlSource(trimmed));
      return true;
    } catch (_) {
      return false;
    }
  }

  void dispose() {
    for (final player in _players.values) {
      player.dispose();
    }
    _remotePlayer.dispose();
    _players.clear();
  }
}
