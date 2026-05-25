import '../../../core/api/api_client.dart';
import '../../../models/subscription_summary.dart';

class SubscriptionService {
  SubscriptionService({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  Future<SubscriptionSummary?> getSubscriptionSummary([String? userId]) async {
    final data = await _api.get('/api/me/subscription');
    if (data == null) return null;
    return SubscriptionSummary.fromMap(Map<String, dynamic>.from(data as Map));
  }

  Future<void> demoUpgradePremium() async {
    await _api.post('/api/me/subscription/demo-upgrade');
  }
}
