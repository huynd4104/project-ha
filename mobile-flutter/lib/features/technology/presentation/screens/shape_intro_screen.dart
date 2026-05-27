import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';

class ShapeIntroScreen extends StatefulWidget {
  const ShapeIntroScreen({super.key});

  @override
  State<ShapeIntroScreen> createState() => _ShapeIntroScreenState();
}

class _ShapeIntroScreenState extends State<ShapeIntroScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _selectedItem;
  bool _isLoading = true;

  static const _shapeMapping = {
    'CIRCLE': 'Hình tròn',
    'SQUARE': 'Hình vuông',
    'TRIANGLE': 'Hình tam giác',
    'RECTANGLE': 'Hình chữ nhật',
    'STAR': 'Hình sao',
    'HEART': 'Hình trái tim',
    'OVAL': 'Hình bầu dục',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final items = await _repository.getShapes();
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _onItemSelected(Map<String, dynamic> item) {
    setState(() => _selectedItem = item);
    TtsService.instance.speak(item['labelVn']);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Khám phá hình khối'),
        centerTitle: true,
        actions: [buildNfcStatusIcon()],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_selectedItem != null) _buildDetailView(),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(20),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 20,
                      mainAxisSpacing: 20,
                      childAspectRatio: 1.1,
                    ),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      final isSelected = _selectedItem?['id'] == item['id'];
                      return _buildGridItem(item, isSelected);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildDetailView() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blue.shade200, width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.category_rounded, size: 100, color: Colors.blue.shade400),
          const SizedBox(height: 16),
          Text(
            _selectedItem!['labelVn'],
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.blue),
          ),
        ],
      ),
    );
  }

  Widget _buildGridItem(Map<String, dynamic> item, bool isSelected) {
    return InkWell(
      onTap: () => _onItemSelected(item),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? Colors.blue : Colors.grey.shade300, width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.interests_rounded,
              size: 40,
              color: isSelected ? Colors.white : Colors.blue.shade700,
            ),
            const SizedBox(height: 12),
            Text(
              item['labelVn'],
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildNfcStatusIcon() {
    return StreamBuilder<NfcState>(
      stream: NfcService.instance.stateStream,
      initialData: NfcState.ready,
      builder: (context, snapshot) {
        final state = snapshot.data ?? NfcState.ready;
        IconData icon = Icons.nfc_rounded;
        Color color = Colors.grey;
        if (state == NfcState.ready) {
          icon = Icons.nfc_rounded;
          color = Colors.green;
        } else if (state == NfcState.reading) {
          icon = Icons.hourglass_empty_rounded;
          color = Colors.amber;
        } else if (state == NfcState.success) {
          icon = Icons.check_circle_rounded;
          color = Colors.blue;
        } else if (state == NfcState.error) {
          icon = Icons.error_outline_rounded;
          color = Colors.red;
        }
        return Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Icon(icon, color: color),
        );
      },
    );
  }

  void showFeedback(bool correct, String message) {
    speakEvaluationFeedback(correct, customFeedback: message);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: correct ? Colors.green : Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  void onNfcTagScanned(NfcResolvedTag tagData) {
    if (tagData.tagType == 'SHAPE' && tagData.payloadValue != null) {
      final code = tagData.payloadValue!.toUpperCase();
      final mappedName = _shapeMapping[code];
      final matchedItem = _items.cast<Map<String, dynamic>?>().firstWhere(
            (item) => item!['labelVn'].toString().toLowerCase() == mappedName?.toLowerCase(),
            orElse: () => null,
          );

      if (matchedItem != null) {
        _onItemSelected(matchedItem);
        showFeedback(true, 'Đây là ${matchedItem['labelVn']}.');
      } else {
        showFeedback(false, 'Thẻ hình $code chưa được hỗ trợ.');
      }
    } else {
      if (tagData.spokenText != null) {
        TtsService.instance.speak(tagData.spokenText!);
      } else {
        showFeedback(false, 'Đây không phải là thẻ hình khối.');
      }
    }
  }
}
