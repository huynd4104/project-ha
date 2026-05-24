import 'package:intl/intl.dart';

String todayKey() => DateFormat('yyyy-MM-dd').format(DateTime.now());
String yesterdayKey() => DateFormat(
  'yyyy-MM-dd',
).format(DateTime.now().subtract(const Duration(days: 1)));

String formatShortDate(Object? value) {
  final date = value is DateTime ? value : null;
  if (date == null) return '';
  return DateFormat('dd/MM/yyyy').format(date);
}
