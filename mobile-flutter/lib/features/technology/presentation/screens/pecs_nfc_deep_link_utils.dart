import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../../core/api/api_client.dart';
import 'technology_selection_screen.dart';

void logPecsDeepLinkDebug({
  required String screenName,
  required String stage,
  required String payload,
  required String mode,
  String? resolvedCategory,
  String? spokenText,
  bool? willSpeak,
  String? note,
}) {
  if (!kDebugMode) return;

  final buffer = StringBuffer('[PECS NFC][$screenName][$stage]');
  buffer.write(' payload=$payload');
  buffer.write(' mode=$mode');
  if (resolvedCategory != null && resolvedCategory.isNotEmpty) {
    buffer.write(' category=$resolvedCategory');
  }
  if (spokenText != null && spokenText.isNotEmpty) {
    buffer.write(' spokenText=$spokenText');
  }
  if (willSpeak != null) {
    buffer.write(' speak=$willSpeak');
  }
  if (note != null && note.isNotEmpty) {
    buffer.write(' note=$note');
  }
  debugPrint(buffer.toString());
}

Widget buildPecsNavigationButton(BuildContext context) {
  final canPop = Navigator.of(context).canPop();
  final foregroundColor =
      Theme.of(context).appBarTheme.foregroundColor ??
      Theme.of(context).colorScheme.onSurface;

  void handlePressed() {
    if (canPop) {
      Navigator.of(context).pop();
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const TechnologySelectionScreen(),
      ),
    );
  }

  return BackButton(
    color: foregroundColor,
    onPressed: handlePressed,
  );
}

Future<Map<String, dynamic>> resolveNfcPayload(String payload) async {
  final response = await ApiClient.instance.post('/api/nfc/resolve', {
    'payload': payload,
  });

  final responseMap = response is Map ? Map<String, dynamic>.from(response) : null;
  if (responseMap != null && responseMap['success'] == true) {
    final data = responseMap['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
  }

  throw Exception(
    responseMap?['message']?.toString() ?? 'Không thể giải mã thẻ NFC.',
  );
}

Map<String, dynamic> buildPecsResolvedCard(Map<String, dynamic> resolvedData) {
  final metadata = resolvedData['metadata'];
  final metadataMap = metadata is Map
      ? Map<String, dynamic>.from(metadata)
      : <String, dynamic>{};
  final spokenText = resolvedData['spokenText']?.toString() ??
      metadataMap['spokenText']?.toString() ??
      '';

  return {
    'title': metadataMap['title']?.toString() ??
        resolvedData['displayName']?.toString() ??
        '',
    'imageUrl': metadataMap['imageUrl']?.toString(),
    'spokenText': spokenText,
    'payloadValue': resolvedData['payloadValue']?.toString() ??
        metadataMap['payloadValue']?.toString() ??
        '',
    'category': metadataMap['category']?.toString(),
    'metadata': metadataMap,
  };
}

String? resolvedPecsCategory(Map<String, dynamic> resolvedData) {
  final metadata = resolvedData['metadata'];
  if (metadata is Map) {
    final category = metadata['category']?.toString().trim();
    if (category != null && category.isNotEmpty) {
      return category.toUpperCase();
    }
  }

  final category = resolvedData['category']?.toString().trim();
  if (category != null && category.isNotEmpty) {
    return category.toUpperCase();
  }

  return null;
}