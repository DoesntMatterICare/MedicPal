import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PreparedMedicineImage = { uri: string; base64: string };

export async function chooseMedicineImage(): Promise<PreparedMedicineImage | null> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 0.8,
    selectionLimit: 1,
  });
  if (selection.canceled || !selection.assets[0]) return null;
  const asset = selection.assets[0];
  const actions = asset.width > 1024 ? [{ resize: { width: 1024 } }] : [];
  const prepared = await manipulateAsync(asset.uri, actions, {
    compress: 0.8,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!prepared.base64) throw new Error("Could not prepare this photo. Please choose another image.");
  return { uri: prepared.uri, base64: prepared.base64 };
}