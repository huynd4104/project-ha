import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../../../../models/models.dart';

class SubscriptionService {
  SubscriptionService({
    FirebaseFirestore? db,
    FirebaseFunctions? functions,
  })  : _db = db ?? FirebaseFirestore.instance,
        _functions = functions ??
            FirebaseFunctions.instanceFor(region: 'asia-southeast1');

  final FirebaseFirestore _db;
  final FirebaseFunctions _functions;

  /// Fetches the user subscription summary directly from Firestore users/{uid}.
  Future<SubscriptionSummary?> getSubscriptionSummary(String uid) async {
    try {
      final snap = await _db.collection('users').doc(uid).get();
      if (snap.exists && snap.data() != null) {
        final data = snap.data()!;
        if (data.containsKey('subscriptionSummary')) {
          return SubscriptionSummary.fromMap(
            Map<String, dynamic>.from(data['subscriptionSummary']),
          );
        }
      }
      return const SubscriptionSummary();
    } catch (e) {
      print('Error fetching subscription summary: $e');
      return const SubscriptionSummary();
    }
  }

  /// Triggers the Cloud Function to upgrade the current logged-in user to Premium (mock/demo).
  Future<bool> demoUpgradePremium() async {
    try {
      final result = await _functions.httpsCallable('demoUpgradePremium').call();
      if (result.data != null && result.data['ok'] == true) {
        return true;
      }
      return false;
    } catch (e) {
      print('Error upgrading demo premium: $e');
      rethrow;
    }
  }
}
