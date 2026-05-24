import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/services/app_state.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Object? firebaseError;

  try {
    final options = DefaultFirebaseOptions.currentPlatform;
    if (options.apiKey.isEmpty || options.appId.isEmpty) {
      throw Exception(
        'Firebase configuration is missing or incomplete.\n\n'
        'Please configure native Firebase (google-services.json / GoogleService-Info.plist) '
        'or run the app passing the environment variables via --dart-define:\n'
        '  flutter run \\\n'
        '    --dart-define=FIREBASE_API_KEY=... \\\n'
        '    --dart-define=FIREBASE_APP_ID=...',
      );
    }
    await Firebase.initializeApp(options: options);
  } catch (error) {
    firebaseError = error;
  }

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(firebaseError: firebaseError)..start(),
      child: const ProjectHaApp(),
    ),
  );
}
