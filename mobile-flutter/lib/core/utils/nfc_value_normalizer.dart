String normalizeNfcComparable(String value) {
  return stripVietnameseDiacritics(value).replaceAll(RegExp(r'[^a-z0-9]'), '');
}

String slugifyNfcValue(String value) {
  return stripVietnameseDiacritics(value)
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');
}

bool nfcValuesMatch(String left, String right) {
  return normalizeNfcComparable(left) == normalizeNfcComparable(right);
}

String stripVietnameseDiacritics(String value) {
  final text = value.toLowerCase();
  return text
      .replaceAll(RegExp(r'[àáạảãâầấậẩẫăằắặẳẵ]'), 'a')
      .replaceAll(RegExp(r'[èéẹẻẽêềếệểễ]'), 'e')
      .replaceAll(RegExp(r'[ìíịỉĩ]'), 'i')
      .replaceAll(RegExp(r'[òóọỏõôồốộổỗơờớợởỡ]'), 'o')
      .replaceAll(RegExp(r'[ùúụủũưừứựửữ]'), 'u')
      .replaceAll(RegExp(r'[ỳýỵỷỹ]'), 'y')
      .replaceAll('đ', 'd');
}
