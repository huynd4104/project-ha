import 'dart:math';
import 'package:flutter/material.dart';

class ParentGate {
  /// Displays a simple math gate dialog.
  /// If the user answers correctly, [onPassed] is executed.
  static void show(BuildContext context, VoidCallback onPassed) {
    final random = Random();
    final num1 = random.nextInt(8) + 2; // 2 to 9
    final num2 = random.nextInt(8) + 2; // 2 to 9
    final correctAnswer = num1 * num2;

    // Generate incorrect choices
    final options = <int>{correctAnswer};
    while (options.length < 3) {
      options.add((random.nextInt(8) + 2) * (random.nextInt(8) + 2));
    }

    final sortedOptions = options.toList()..sort();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.lock_rounded, color: Colors.amber),
            SizedBox(width: 8),
            Text('Khu vực Phụ huynh'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Vui lòng giải phép tính sau để xác nhận bạn là phụ huynh:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 20),
            Center(
              child: Text(
                '$num1 x $num2 = ?',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        actions: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: sortedOptions.map((opt) {
              return ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close parent gate dialog
                  if (opt == correctAnswer) {
                    onPassed();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Xác nhận không đúng. Vui lòng thử lại.'),
                        backgroundColor: Colors.redAccent,
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                child: Text(
                  '$opt',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              );
            }).toList(),
          ),
          Center(
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Hủy', style: TextStyle(color: Colors.grey)),
            ),
          ),
        ],
      ),
    );
  }
}
