import 'package:flutter/material.dart';
import 'number_recognition_screen.dart';
import 'number_counting_screen.dart';
import 'shape_intro_screen.dart';
import 'shape_recognition_screen.dart';

class TechnologySelectionScreen extends StatelessWidget {
  const TechnologySelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Công nghệ học tập'),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade50, Colors.white],
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildSection(
              context,
              title: 'BỘ SỐ',
              icon: Icons.numbers,
              color: Colors.orange,
              items: [
                _buildItem(
                  context,
                  label: 'Nhận diện số',
                  subtitle: 'Làm quen với các con số',
                  icon: Icons.grid_view_rounded,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NumberRecognitionScreen()),
                  ),
                ),
                _buildItem(
                  context,
                  label: 'Tập đếm số',
                  subtitle: 'Đếm vật thể bằng thẻ NFC',
                  icon: Icons.calculate_rounded,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NumberCountingScreen()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
            _buildSection(
              context,
              title: 'BỘ HÌNH',
              icon: Icons.category_rounded,
              color: Colors.blue,
              items: [
                _buildItem(
                  context,
                  label: 'Giới thiệu hình',
                  subtitle: 'Khám phá các hình khối',
                  icon: Icons.auto_awesome_mosaic_rounded,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ShapeIntroScreen()),
                  ),
                ),
                _buildItem(
                  context,
                  label: 'Nhận diện hình',
                  subtitle: 'Thử thách tìm hình bằng thẻ NFC',
                  icon: Icons.search_rounded,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ShapeRecognitionScreen()),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required MaterialColor color,
    required List<Widget> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color.shade800,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        ...items,
      ],
    );
  }

  Widget _buildItem(
    BuildContext context, {
    required String label,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.blueGrey, size: 30),
        ),
        title: Text(
          label,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: Colors.grey.shade600),
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 18),
        onTap: onTap,
      ),
    );
  }
}
