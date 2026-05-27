import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';

class NumberRecognitionScreen extends StatefulWidget {
  const NumberRecognitionScreen({super.key});

  @override
  State<NumberRecognitionScreen> createState() => _NumberRecognitionScreenState();
}

class _NumberRecognitionScreenState extends State<NumberRecognitionScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _selectedItem;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final items = await _repository.getNumbers();
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải dữ liệu: $e')),
        );
      }
    }
  }

  void _onItemSelected(Map<String, dynamic> item) {
    setState(() => _selectedItem = item);
    final text = '${item['numberValue']}. ${item['labelVn']}';
    TtsService.instance.speak(text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhận diện số'),
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
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
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
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.shade200, width: 2),
      ),
      child: Column(
        children: [
          Text(
            _selectedItem!['numberValue'].toString(),
            style: const TextStyle(
              fontSize: 80,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _selectedItem!['labelVn'],
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          if (_selectedItem!['imageUrl'] != null && _selectedItem!['imageUrl'].isNotEmpty) ...[
            const SizedBox(height: 16),
            Image.network(
              _selectedItem!['imageUrl'],
              height: 120,
              errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGridItem(Map<String, dynamic> item, bool isSelected) {
    return InkWell(
      onTap: () => _onItemSelected(item),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? Colors.orange : Colors.grey.shade300,
            width: 2,
          ),
          boxShadow: [
            if (!isSelected)
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Center(
          child: Text(
            item['numberValue'].toString(),
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : Colors.orange.shade700,
            ),
          ),
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
    if (tagData.tagType == 'NUMBER' && tagData.payloadValue != null) {
      final numberStr = tagData.payloadValue!;
      final matchedItem = _items.cast<Map<String, dynamic>?>().firstWhere(
            (item) => item!['numberValue'].toString() == numberStr,
            orElse: () => null,
          );

      if (matchedItem != null) {
        _onItemSelected(matchedItem);
        showFeedback(true, 'Đúng rồi! Đây là số $numberStr.');
      } else {
        showFeedback(false, 'Thẻ NFC số $numberStr không có trong danh sách bài học này.');
      }
    } else {
      if (tagData.spokenText != null) {
         TtsService.instance.speak(tagData.spokenText!);
      } else {
         showFeedback(false, 'Đây không phải là thẻ số.');
      }
    }
  }
}
