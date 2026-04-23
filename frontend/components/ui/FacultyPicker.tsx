import { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, Platform, StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors } from "@/constants/theme";

type FacultyOption = { id: string; name: string; code: string };

interface FacultyPickerProps {
  value: FacultyOption | null;
  onChange: (faculty: FacultyOption) => void;
  error?: string;
}

export function FacultyPicker({ value, onChange, error }: FacultyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: faculties = [], isLoading } = useQuery<FacultyOption[]>({
    queryKey: ["faculties"],
    queryFn: () => api.get("/users/faculties").then((r) => r.data),
    staleTime: Infinity,
  });

  const filtered = faculties.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ width: "100%", gap: 6 }}>
      <Text style={s.label}>Carrera / Facultad</Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[s.trigger, error ? { borderColor: colors.error } : { borderColor: colors.border }]}
      >
        <Text style={[s.triggerText, !value && { color: colors.muted }]}>
          {value ? value.name : "Selecciona tu carrera"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>▾</Text>
      </TouchableOpacity>

      {error && <Text style={s.errorText}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Tu carrera</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setSearch(""); }}>
                <Text style={s.sheetDone}>Listo</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar carrera..."
                placeholderTextColor={colors.muted}
                style={s.searchInput}
                autoFocus
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = value?.id === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => { onChange(item); setOpen(false); setSearch(""); }}
                    style={[s.row, selected && { backgroundColor: colors.primary + "12" }]}
                  >
                    <View style={s.codeBox}>
                      <Text style={s.codeText}>{item.code.slice(0, 4)}</Text>
                    </View>
                    <Text style={[s.rowName, selected && { color: colors.primary, fontFamily: "Inter-Bold" }]}>
                      {item.name}
                    </Text>
                    {selected && <Text style={{ color: colors.primary, fontFamily: "Inter-Bold" }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={s.emptyText}>
                  {isLoading ? "Cargando carreras..." : "Sin resultados"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: colors.muted,
  },
  trigger: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerText: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.error,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 18,
    color: colors.text,
  },
  sheetDone: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  searchInput: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  codeBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  codeText: {
    fontFamily: "Inter-Bold",
    fontSize: 9,
    color: colors.primary,
  },
  rowName: {
    flex: 1,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: colors.text,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 32,
  },
});
