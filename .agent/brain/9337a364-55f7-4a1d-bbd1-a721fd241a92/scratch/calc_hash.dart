
int isarHash(String name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash ^= name.codeUnitAt(i);
    hash *= 0x01000193;
    hash &= 0xFFFFFFFFFFFFFFFF; // 64-bit
  }
  return hash;
}

void main() {
  final names = ['User', 'Pool', 'PoolMember', 'Round', 'PaymentStatus', 'AppUser', 'HPUser', 'HpUser'];
  for (final name in names) {
    final h = isarHash(name);
    print('$name: $h (${h.toRadixString(16)})');
  }
}
