import 'package:flutter/material.dart';
import 'pecs_emotion_screen.dart';
import 'pecs_daily_activity_screen.dart';
import 'pecs_non_topic_screen.dart';

class PecsSelectionScreen extends StatelessWidget {
  const PecsSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Giao tiếp PECS'),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.teal.shade50, Colors.white],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 12),
                Text(
                  'Chọn chủ đề để giao tiếp',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal.shade900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Chạm vào chủ đề con muốn nói',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.teal.shade700,
                  ),
                ),
                const SizedBox(height: 32),
                Expanded(
                  child: ListView(
                    physics: const BouncingScrollPhysics(),
                    children: [
                      _buildTopicCard(
                        context,
                        title: 'Cảm xúc',
                        subtitle: 'Hôm nay con cảm thấy thế nào?',
                        icon: Icons.emoji_emotions_rounded,
                        gradient: LinearGradient(
                          colors: [Colors.amber.shade400, Colors.orange.shade500],
                        ),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const PecsEmotionScreen()),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildTopicCard(
                        context,
                        title: 'Sinh hoạt hằng ngày',
                        subtitle: 'Con đã làm gì hoặc muốn làm gì?',
                        icon: Icons.wb_sunny_rounded,
                        gradient: LinearGradient(
                          colors: [Colors.lightBlue.shade400, Colors.blue.shade600],
                        ),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const PecsDailyActivityScreen()),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildTopicCard(
                        context,
                        title: 'Nhu cầu (Non-topic)',
                        subtitle: 'Những điều con muốn nói ngay',
                        icon: Icons.chat_bubble_rounded,
                        gradient: LinearGradient(
                          colors: [Colors.teal.shade400, Colors.emerald.shade600],
                        ),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const PecsNonTopicScreen()),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopicCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          decoration: BoxDecoration(
            gradient: gradient,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Colors.white24,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 40,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.whiteee,
                        opacity: 0.9,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios_rounded,
                color: Colors.white,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
class Colors {
  static const Color whiteee = Color(0xFFF5F5F5);
}
