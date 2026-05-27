import '../../../../core/api/api_client.dart';

class TechnologyRepository {
  final ApiClient _api = ApiClient.instance;

  List<Map<String, dynamic>> _extractList(dynamic response, String preferredKey) {
    if (response is Map) {
      if (response.containsKey(preferredKey) && response[preferredKey] is List) {
        return List<Map<String, dynamic>>.from(response[preferredKey]);
      }
      if (response.containsKey('data') && response['data'] is List) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getNumbers() async {
    final response = await _api.get('/api/technology/numbers');
    final list = _extractList(response, 'items');
    return list.map((item) {
      return {
        ...item,
        'labelVn': item['title'] ?? item['labelVn'],
      };
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getNumberCountingQuestions() async {
    final response = await _api.get('/api/technology/numbers/counting-questions');
    final list = _extractList(response, 'questions');
    return list.map((item) {
      return {
        ...item,
        'numberValue': item['correctNumber'] ?? item['numberValue'],
      };
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getShapes() async {
    final response = await _api.get('/api/technology/shapes');
    final list = _extractList(response, 'items');
    return list.map((item) {
      return {
        ...item,
        'labelVn': item['shapeName'] ?? item['labelVn'],
      };
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getShapeRecognitionQuestions() async {
    final response = await _api.get('/api/technology/shapes/recognition-questions');
    final list = _extractList(response, 'questions');
    return list.map((item) {
      return {
        ...item,
        'shapeCode': item['correctShapeCode'] ?? item['shapeCode'],
      };
    }).toList();
  }

  Future<List<Map<String, dynamic>>> getPecsCards({String? category}) async {
    final path = category != null ? '/api/technology/pecs?category=$category' : '/api/technology/pecs';
    final response = await _api.get(path);
    return _extractList(response, 'items');
  }
}
