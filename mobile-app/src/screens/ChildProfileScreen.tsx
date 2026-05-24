import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, StyleSheet } from "react-native";
import { childApi } from "../api/childApi";
import { useAuth } from "../context/AuthContext";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { Child } from "../types";
import { common } from "./common";

export function ChildProfileScreen() {
  const { checkChildren } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("4");
  const [gender, setGender] = useState("Nam");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    childApi.list()
      .then((res) => {
        const c = res.data.data[0];
        if (c) {
          setChild(c);
          setName(c.name);
          setAge(String(c.age));
          setGender(c.gender || "");
          setNote(c.note || "");
        }
      })
      .catch((err) => console.log("Error loading child list:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert("Lỗi nhập liệu", "Tên bé phải dài tối thiểu 2 ký tự.");
      return;
    }
    
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 10) {
      Alert.alert("Tuổi không hợp lệ", "Độ tuổi của bé phải trong khoảng từ 1 đến 10.");
      return;
    }

    if (!gender.trim()) {
      Alert.alert("Lỗi nhập liệu", "Vui lòng nhập giới tính của bé.");
      return;
    }

    const performSave = async () => {
      try {
        const payload = { 
          name: name.trim(), 
          age: ageNum, 
          gender: gender.trim(), 
          note: note.trim() 
        };
        const res = child 
          ? await childApi.update(child.id, payload) 
          : await childApi.create(payload);
        
        setChild(res.data.data);
        await checkChildren(); // Sync AuthContext navigation state
        Alert.alert("Thành công", "Đã lưu hồ sơ của bé.");
      } catch (err: any) {
        Alert.alert("Lỗi khi lưu", err.message || "Không thể lưu thông tin hồ sơ.");
      }
    };

    // Warning for age outside 2-6
    if (ageNum === 1 || ageNum > 6) {
      Alert.alert(
        "Lưu ý độ tuổi",
        `Nội dung học tập được thiết kế tối ưu nhất cho bé từ 2 đến 6 tuổi. Bé hiện tại ${ageNum} tuổi có thể gặp nội dung chưa thực sự phù hợp. Bố mẹ vẫn muốn lưu?`,
        [
          { text: "Quay lại chỉnh sửa", style: "cancel" },
          { text: "Đồng ý lưu", onPress: performSave }
        ]
      );
    } else {
      await performSave();
    }
  };

  if (loading) {
    return (
      <View style={[common.screen, styles.center]}>
        <Text style={styles.loadingText}>Đang tải thông tin hồ sơ...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={common.title}>Hồ sơ của bé</Text>
      <Text style={common.subtitle}>
        Bố mẹ cung cấp thông tin để chúng tôi cá nhân hóa lộ trình học phù hợp nhất cho bé nhé!
      </Text>

      <View style={common.panel}>
        <Text style={common.label}>Tên gọi của bé *</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Nhập tên bé (Ví dụ: Bon, Bin, Tép)" />

        <Text style={[common.label, { marginTop: 12 }]}>Độ tuổi của bé (1 - 10) *</Text>
        <AppInput value={age} onChangeText={setAge} placeholder="Nhập tuổi" keyboardType="number-pad" />

        <Text style={[common.label, { marginTop: 12 }]}>Giới tính *</Text>
        <AppInput value={gender} onChangeText={setGender} placeholder="Ví dụ: Nam, Nữ" />

        <Text style={[common.label, { marginTop: 12 }]}>Ghi chú thêm (Sở thích, đặc điểm của bé)</Text>
        <AppInput value={note} onChangeText={setNote} placeholder="Sở thích của bé, đặc điểm cần lưu ý..." multiline style={styles.multilineInput} />
        
        <View style={styles.buttonSpacing} />
        <AppButton title="Lưu hồ sơ" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#6B7280",
    fontWeight: "700"
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top"
  },
  buttonSpacing: {
    height: 12
  }
});
