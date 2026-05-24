import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/utils/firebase_error_mapper.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../data/activation_repository.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with SingleTickerProviderStateMixin {
  late final TabController tab = TabController(length: 2, vsync: this);
  final code = TextEditingController();
  final repo = ActivationRepository();
  bool loading = false;
  bool scanned = false;
  String? error;

  Future<void> unlock(String value) async {
    if (value.trim().isEmpty || loading) return;
    final state = context.read<AppState>();
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final result = await repo.unlockByCode(
        value,
        state.firebaseUser!.uid,
        state.activeChild!.id,
      );
      await state.refreshStats();
      if (mounted) context.go('/unlock-success', extra: result);
    } catch (e) {
      setState(() => error = friendlyFirebaseError(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Mở khóa Mascot'),
      bottom: TabBar(
        controller: tab,
        tabs: const [
          Tab(text: 'Scan QR'),
          Tab(text: 'Nhập mã'),
        ],
      ),
    ),
    body: TabBarView(
      controller: tab,
      children: [
        Stack(
          children: [
            MobileScanner(
              onDetect: (capture) {
                if (scanned) return;
                final value = capture.barcodes.firstOrNull?.rawValue;
                if (value == null) return;
                scanned = true;
                unlock(value);
              },
            ),
            Center(
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 4),
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            ),
          ],
        ),
        ListView(
          padding: const EdgeInsets.all(24),
          children: [
            AppTextField(
              controller: code,
              label: 'Mã QR demo',
              icon: Icons.qr_code_rounded,
            ),
            const SizedBox(height: 14),
            AppButton(
              label: 'Mở khóa',
              icon: Icons.lock_open_rounded,
              loading: loading,
              onPressed: () => unlock(code.text),
            ),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: Text(
                  error!,
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            const SizedBox(height: 20),
            const Text(
              'Kiến trúc đã tách ActivationRepository.unlockByCode(code), nên NFC/Bluetooth phase sau chỉ cần truyền code vào cùng logic này.',
            ),
          ],
        ),
      ],
    ),
  );
}
