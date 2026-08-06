import { CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Image } from "expo-image";
import { ArrowLeft, Camera, Flashlight, FlashlightOff, RotateCcw, Settings, Upload } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigButton } from "@/components/BigButton";
import { analyzeMedicine } from "@/services/gemini";
import { savePendingScan } from "@/services/db";
import { chooseMedicineImage } from "@/services/images";
import { useApp } from "@/src/context/AppContext";
import { colors, radii } from "@/src/theme";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [permissionSheet, setPermissionSheet] = useState(!permission?.granted);
  const [torch, setTorch] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [gallerySheet, setGallerySheet] = useState(false);
  const [galleryBlocked, setGalleryBlocked] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const scanLine = useRef(new Animated.Value(0)).current;
  const { speak } = useApp();

  useEffect(() => {
    void activateKeepAwakeAsync("medicpal-camera").catch(() => undefined);
    return () => { void deactivateKeepAwake("medicpal-camera").catch(() => undefined); };
  }, []);
  useEffect(() => { if (permission?.granted) setPermissionSheet(false); }, [permission?.granted]);
  useEffect(() => {
    if (!processing) { scanLine.stopAnimation(); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanLine, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(scanLine, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [processing, scanLine]);

  const process = async (base64: string, uri: string) => {
    setProcessing(true); setError(""); speak("Reading your medicine");
    try {
      const result = await analyzeMedicine(base64);
      await savePendingScan({ photoUri: uri, result });
      router.replace("/scan/confirm");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read this label. Please try again.");
      speak("Could not read clearly. Please try again in better light.");
    } finally { setProcessing(false); }
  };

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8, skipProcessing: false });
    if (!photo?.uri) return;
    const resized = await manipulateAsync(photo.uri, [{ resize: { width: 1024 } }], { compress: 0.8, format: SaveFormat.JPEG, base64: true });
    if (!resized.base64) return;
    setCapturedUri(resized.uri); setImageBase64(resized.base64);
    await process(resized.base64, resized.uri);
  };

  const selectFromGallery = async () => {
    setGallerySheet(false);
    try {
      const selected = await chooseMedicineImage();
      if (!selected) return;
      setCapturedUri(selected.uri); setImageBase64(selected.base64);
      await process(selected.base64, selected.uri);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open this photo. Please choose another image.");
    }
  };

  const beginGallerySelection = async () => {
    if (Platform.OS === "web") return selectFromGallery();
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return selectFromGallery();
    setGalleryBlocked(!current.canAskAgain);
    setGallerySheet(true);
  };

  const requestGalleryPermission = async () => {
    const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (response.granted) return selectFromGallery();
    setGalleryBlocked(!response.canAskAgain);
  };

  const galleryPermissionModal = (
    <Modal visible={gallerySheet} transparent animationType="slide" onRequestClose={() => setGallerySheet(false)}>
      <View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Upload size={52} color={colors.primary} /><Text style={styles.sheetTitle}>{galleryBlocked ? "Photo access is off" : "Choose a medicine photo?"}</Text><Text style={styles.sheetText}>{galleryBlocked ? "Open device settings to choose a packaging photo." : "Select a clear box, bottle, blister strip, prescription, or label. MedicPal reads visible printed text and does not identify loose tablets by appearance."}</Text>{galleryBlocked ? <BigButton testID="open-photo-settings-button" label="Open device settings" icon={Settings} onPress={() => { setGallerySheet(false); void Linking.openSettings(); }} /> : <BigButton testID="request-photo-permission-button" label="Allow photo access" icon={Upload} onPress={requestGalleryPermission} />}<BigButton testID="cancel-photo-upload-button" label="Not now" icon={ArrowLeft} variant="secondary" onPress={() => setGallerySheet(false)} /></View></View>
    </Modal>
  );

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen} edges={["top", "bottom"]}>
        <View style={styles.permissionIcon}><Camera size={54} color={colors.primary} /></View>
        <Text style={styles.permissionTitle}>Photograph your medicine label</Text>
        <Text style={styles.permissionText}>Use the camera, or upload a clear photo of a medicine box, bottle, or blister strip.</Text>
        {!!error && <View testID="permission-upload-error" style={styles.permissionError}><Text style={styles.errorTitle}>Photo could not be opened</Text><Text style={styles.errorText}>{error}</Text></View>}
        {!permission?.canAskAgain && <BigButton testID="open-camera-settings-button" label="Open device settings" icon={Settings} onPress={() => Linking.openSettings()} />}
        <BigButton testID="permission-screen-upload-button" label="Upload packaging photo" icon={Upload} variant="secondary" onPress={beginGallerySelection} />
        <BigButton testID="camera-back-button" label="Go back" icon={ArrowLeft} variant="secondary" onPress={() => router.replace("/(tabs)")} />
        <Modal visible={permissionSheet && permission?.canAskAgain !== false} transparent animationType="slide">
          <View style={styles.backdrop}><View style={styles.sheet}><View style={styles.handle} /><Camera size={52} color={colors.primary} /><Text style={styles.sheetTitle}>Allow camera access?</Text><Text style={styles.sheetText}>This lets you photograph medicine packaging instead of typing it.</Text><BigButton testID="request-camera-permission-button" label="Allow camera" icon={Camera} onPress={async () => { const result = await requestPermission(); if (!result.granted && !result.canAskAgain) setPermissionSheet(false); }} /><BigButton testID="camera-sheet-upload-button" label="Choose existing photo" icon={Upload} variant="secondary" onPress={() => { setPermissionSheet(false); void beginGallerySelection(); }} /><BigButton testID="cancel-camera-permission-button" label="Not now" icon={ArrowLeft} variant="secondary" onPress={() => { setPermissionSheet(false); router.replace("/(tabs)"); }} /></View></View>
        </Modal>
        {galleryPermissionModal}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      {capturedUri ? <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} autofocus="on" />}
      <View style={styles.scrim} />
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable testID="camera-close-button" onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.control, { opacity: pressed ? 0.7 : 1 }]}><ArrowLeft size={23} color={colors.white} /><Text style={styles.controlText}>Back</Text></Pressable>
          <Pressable testID="camera-flash-button" onPress={() => setTorch((value) => !value)} style={({ pressed }) => [styles.control, { opacity: pressed ? 0.7 : 1 }]}>{torch ? <FlashlightOff size={23} color={colors.white} /> : <Flashlight size={23} color={colors.white} />}<Text style={styles.controlText}>{torch ? "Flash off" : "Flash on"}</Text></Pressable>
        </View>
        <View style={styles.instructions}><Text style={styles.cameraTitle}>{processing ? "Reading your medicine..." : "Place the packaging inside the frame"}</Text><Text style={styles.cameraHint}>{processing ? "Keep this screen open" : "Keep the printed name and expiry date clear"}</Text></View>
        <View style={styles.frame}>
          {processing && <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [-145, 145] }) }] }]} />}
        </View>
        <View style={styles.bottom}>
          {!!error && <View testID="scan-error-message" style={styles.errorCard}><Text style={styles.errorTitle}>We could not read that clearly</Text><Text style={styles.errorText}>{error}</Text></View>}
          {capturedUri && !processing ? <View style={styles.retryRow}><BigButton testID="scan-retry-button" label="Try again" icon={RotateCcw} onPress={() => process(imageBase64, capturedUri)} /></View> : !processing ? (
            <View style={styles.captureActions}><Pressable testID="camera-capture-button" accessibilityLabel="Take photo" onPress={capture} style={({ pressed }) => [styles.captureWrap, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}><View style={styles.capture}><Camera size={32} color={colors.primary} /></View><Text style={styles.captureLabel}>Take photo</Text></Pressable><Pressable testID="camera-upload-button" accessibilityRole="button" accessibilityLabel="Upload packaging photo" onPress={beginGallerySelection} style={({ pressed }) => [styles.uploadWrap, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}><View style={styles.uploadCircle}><Upload size={28} color={colors.primary} /></View><Text style={styles.captureLabel}>Upload photo</Text></Pressable></View>
          ) : <View style={styles.processingPill}><View style={styles.pulse} /><Text style={styles.processingText}>AI is checking the label</Text></View>}
        </View>
      </SafeAreaView>
      {galleryPermissionModal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.text }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(26,58,92,0.28)" }, overlay: { flex: 1, justifyContent: "space-between" },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }, control: { minHeight: 60, minWidth: 90, borderRadius: 18, backgroundColor: "rgba(14,43,74,0.78)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12 }, controlText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  instructions: { alignItems: "center", paddingHorizontal: 24 }, cameraTitle: { color: colors.white, fontSize: 24, fontWeight: "900", textAlign: "center" }, cameraHint: { color: colors.white, fontSize: 17, fontWeight: "600", marginTop: 7, textAlign: "center" },
  frame: { height: 310, marginHorizontal: 24, borderRadius: 24, borderWidth: 4, borderColor: colors.white, overflow: "hidden" }, scanLine: { position: "absolute", left: 8, right: 8, top: "50%", height: 4, borderRadius: 2, backgroundColor: colors.secondary, shadowColor: colors.white, shadowOpacity: 1, shadowRadius: 8 },
  bottom: { minHeight: 160, alignItems: "center", justifyContent: "center", padding: 16 }, captureActions: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28 }, captureWrap: { minWidth: 112, minHeight: 110, alignItems: "center", justifyContent: "center" }, capture: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white, borderWidth: 7, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }, uploadWrap: { minWidth: 112, minHeight: 110, alignItems: "center", justifyContent: "center" }, uploadCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.secondary, alignItems: "center", justifyContent: "center" }, captureLabel: { color: colors.white, fontSize: 17, fontWeight: "900", marginTop: 7 },
  processingPill: { minHeight: 64, borderRadius: 32, paddingHorizontal: 22, backgroundColor: "rgba(14,43,74,0.9)", flexDirection: "row", alignItems: "center", gap: 12 }, pulse: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.secondary }, processingText: { color: colors.white, fontSize: 18, fontWeight: "800" }, retryRow: { width: "100%" },
  errorCard: { width: "100%", backgroundColor: colors.white, borderRadius: radii.md, padding: 14, marginBottom: 10 }, errorTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, errorText: { color: colors.textSecondary, fontSize: 15, marginTop: 3 },
  permissionScreen: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center", gap: 18 }, permissionIcon: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.card, alignSelf: "center", alignItems: "center", justifyContent: "center" }, permissionTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center" }, permissionText: { color: colors.textSecondary, fontSize: 19, lineHeight: 28, textAlign: "center", marginBottom: 10 },
  permissionError: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.warning, borderRadius: radii.md, padding: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(14,43,74,0.45)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center", justifyContent: "center", gap: 15 }, handle: { position: "absolute", top: 12, width: 54, height: 5, borderRadius: 3, backgroundColor: colors.border }, sheetTitle: { color: colors.text, fontSize: 27, fontWeight: "900" }, sheetText: { color: colors.textSecondary, fontSize: 18, lineHeight: 26, textAlign: "center", marginBottom: 8 },
});