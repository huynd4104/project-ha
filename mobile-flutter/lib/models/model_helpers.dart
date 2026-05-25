DateTime? readDate(Object? value) {
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}

int readInt(Object? value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse('$value') ?? fallback;
}

double readDouble(Object? value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  return double.tryParse('$value') ?? fallback;
}

List<String> readStringList(Object? value) {
  if (value is Iterable) {
    return value
        .map((item) => '$item'.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }
  if (value is String && value.trim().isNotEmpty) {
    return value
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }
  return const [];
}

Map<String, dynamic> readMap(Object? value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

T readEnum<T extends Enum>(Iterable<T> values, Object? value, T fallback) {
  final normalized = '${value ?? ''}'.trim().toUpperCase();
  for (final item in values) {
    if (item.name.toUpperCase() == normalized) return item;
  }
  return fallback;
}

List<T> readEnumList<T extends Enum>(Iterable<T> values, Object? value) {
  final names = readStringList(value).map((item) => item.toUpperCase()).toSet();
  return values
      .where((item) => names.contains(item.name.toUpperCase()))
      .toList();
}
