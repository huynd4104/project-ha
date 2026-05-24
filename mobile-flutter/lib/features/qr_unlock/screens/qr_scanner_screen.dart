import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/firebase_error_mapper.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_text_field.dart';
import '../data/activation_repository.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final TabController tab = TabController(length: 2, vsync: this);
  final code = TextEditingController();
  final repo = ActivationRepository();
  final scannerController = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
  );
  bool loading = false;
  bool scanned = false;
  String? error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    tab.addListener(_handleTabChange);
  }

  void _handleTabChange() {
    if (tab.indexIsChanging) return;
    if (tab.index == 0) {
      scannerController.start();
    } else {
      scannerController.stop();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (tab.index != 0) return; // Only control scanner if on scan tab
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      scannerController.stop();
    } else if (state == AppLifecycleState.resumed) {
      scannerController.start();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    tab.removeListener(_handleTabChange);
    scannerController.stop();
    scannerController.dispose();
    tab.dispose();
    code.dispose();
    super.dispose();
  }

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
      if (mounted) {
        setState(() {
          error = friendlyFirebaseError(e);
          scanned = false; // Reset scanned state on error so user can try again
        });
        scannerController.start(); // Restart scanner on error
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Quét QR', style: AppTextStyles.headline),
                const SizedBox(height: 10),
                const AppCard(
                  color: AppColors.cream,
                  child: Text(
                    'Quét mã QR trên thẻ để mở khóa bạn đồng hành mới.',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                const SizedBox(height: 12),
                TabBar(
                  controller: tab,
                  tabs: const [
                    Tab(text: 'Quét mã'),
                    Tab(text: 'Nhập mã'),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: tab,
              children: [
                Stack(
                  children: [
                    MobileScanner(
                      controller: scannerController,
                      onDetect: (capture) {
                        if (scanned) return;
                        final value = capture.barcodes.firstOrNull?.rawValue;
                        if (value == null) return;
                        scanned = true;
                        scannerController.stop();
                        unlock(value);
                      },
                    ),
                    Center(
                      child: Container(
                        width: 250,
                        height: 250,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.yellow, width: 5),
                          borderRadius: BorderRadius.circular(32),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.yellow.withValues(alpha: .18),
                              blurRadius: 22,
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (loading)
                      const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
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
                        child: AppCard(
                          color: AppColors.coral.withValues(alpha: .10),
                          child: Text(
                            error!,
                            style: const TextStyle(
                              color: AppColors.coral,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
