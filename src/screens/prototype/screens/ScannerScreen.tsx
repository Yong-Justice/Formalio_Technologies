import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  RefreshCw,
  ScanLine,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react-native';

import { getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { formalioBackend } from '@/services/api/formalioBackend';
import { styles } from '../styles';
import { c } from '../theme';
import type { ScannedTicketData } from '../contracts';
import {
  Card,
  Grid,
  Icon,
  ModalShell,
  PaymentMethodInline,
  Pill,
  PrimaryButton,
  Row,
  Tap,
  Txt,
  ValueBar,
  useToast,
} from '../shared';

type ScannerImageAsset = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  source?: 'camera' | 'upload' | 'drop';
};

const OCR_MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const OCR_SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function cleanBase64(value: string) {
  return value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
}

function estimateBase64Bytes(base64: string) {
  const cleaned = cleanBase64(base64).replace(/\s/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

function inferImageMimeType(uri?: string | null, fallback = 'image/jpeg') {
  const lower = (uri ?? '').split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return fallback;
}

function normalizeOcrMimeType(mimeType?: string | null, uri?: string | null) {
  const normalized = (mimeType || inferImageMimeType(uri)).toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  return normalized;
}

function validateOcrImage(mimeType: string, byteLength: number) {
  if (!OCR_SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Format non pris en charge. Importez une image JPG, PNG ou WebP.');
  }
  if (byteLength > OCR_MAX_IMAGE_BYTES) {
    throw new Error('Image trop lourde. Importez une image plus légère, idéalement sous 6 Mo.');
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const web = globalThis as typeof globalThis & { btoa?: (value: string) => string };
  if (!web.btoa) throw new Error('Encodage image indisponible dans ce navigateur.');
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return web.btoa(binary);
}

async function readImageUriAsBase64(uri: string) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Impossible de lire cette image dans le navigateur.');
    const blob = await response.blob();
    validateOcrImage(normalizeOcrMimeType(blob.type, uri), blob.size);
    return arrayBufferToBase64(await blob.arrayBuffer());
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function scannerImageToOcrPayload(asset: ScannerImageAsset) {
  const mimeType = normalizeOcrMimeType(asset.mimeType, asset.fileName ?? asset.uri);
  let imageBase64 = asset.base64 ? cleanBase64(asset.base64) : '';
  if (!imageBase64) imageBase64 = await readImageUriAsBase64(asset.uri);
  validateOcrImage(mimeType, asset.fileSize ?? estimateBase64Bytes(imageBase64));
  return {
    imageBase64,
    mimeType,
    imagePath: asset.uri,
    fileName: asset.fileName ?? 'formalio-document.jpg',
    sourcePlatform: Platform.OS,
    source: asset.source ?? 'camera',
  };
}

type WebFileLike = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer?: () => Promise<ArrayBuffer>;
};

async function webFileToScannerAsset(file: WebFileLike): Promise<ScannerImageAsset> {
  if (!file?.arrayBuffer) throw new Error('Fichier image illisible.');
  const mimeType = normalizeOcrMimeType(file.type, file.name);
  validateOcrImage(mimeType, file.size ?? 0);
  const web = globalThis as typeof globalThis & { URL?: typeof URL };
  const uri = typeof web.URL?.createObjectURL === 'function' ? web.URL.createObjectURL(file as Blob) : `web-upload://${file.name ?? 'document'}`;
  return {
    uri,
    base64: arrayBufferToBase64(await file.arrayBuffer()),
    mimeType,
    fileName: file.name ?? 'formalio-document.jpg',
    fileSize: file.size,
    source: 'upload',
  };
}

function pickWebScannerImage() {
  const web = globalThis as typeof globalThis & { document?: Document };
  if (!web.document) throw new Error('Sélecteur de fichiers indisponible dans ce navigateur.');
  return new Promise<ScannerImageAsset | null>((resolve, reject) => {
    const input = web.document?.createElement('input');
    if (!input) {
      reject(new Error('Sélecteur de fichiers indisponible dans ce navigateur.'));
      return;
    }
    input.type = 'file';
    input.accept = OCR_SUPPORTED_MIME_TYPES.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      webFileToScannerAsset(file).then(resolve).catch(reject);
    };
    input.click();
  });
}

function getFriendlyOcrError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();
  if (lower.includes('session') || lower.includes('cloud')) return 'Reconnectez-vous pour analyser ce document avec le moteur OCR cloud.';
  if (lower.includes('format non pris') || lower.includes('image trop lourde') || lower.includes('fichier image illisible')) return message;
  if (lower.includes('provider') || lower.includes('openai') || lower.includes('api_key') || lower.includes('configured')) {
    return 'Le moteur OCR cloud n’est pas encore configuré. Vous pouvez importer une autre image ou saisir la transaction manuellement.';
  }
  if (Platform.OS === 'web') {
    return 'Impossible d’analyser cette image dans le navigateur. Essayez une image JPG/PNG plus légère ou utilisez la saisie manuelle.';
  }
  return 'Impossible d’analyser ce document pour le moment. Réessayez ou utilisez la saisie manuelle.';
}

type ScannerPhase = 'permission' | 'scanning' | 'processing' | 'detected' | 'error';

export function ScannerModal({ isOpen, onClose, onSave, companyId }: { isOpen: boolean; onClose: () => void; onSave: (ticket: ScannedTicketData) => void; companyId: string | null }) {
  const [permission, requestPermission] = useCameraPermissions();
  const { showToast } = useToast();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<ScannerPhase>('permission');
  const [progress, setProgress] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [captureUri, setCaptureUri] = useState<string | undefined>();
  const [detected, setDetected] = useState<ScannedTicketData | null>(null);
  const mockTickets = useMemo<ScannedTicketData[]>(() => [
    {
      type: 'expense',
      amount: 28500,
      description: 'Achat stock wax - ticket scanné',
      category: 'Achats',
      method: 'Espèces',
      ticketNumber: 'TK-4829-AC',
      date: '2026-05-19',
      merchant: 'Marché Central Douala',
      referenceNumber: 'REF-84Q7-2201',
      details: '12 articles textile, remise fournisseur détectée, TVA non indiquée.',
    },
    {
      type: 'income',
      amount: 76000,
      description: 'Vente comptoir - reçu scanné',
      category: 'Ventes',
      method: 'Orange Money',
      ticketNumber: 'RC-9051-OM',
      date: '2026-05-19',
      merchant: 'Boutique Élégance',
      referenceNumber: 'OM-226-771-902',
      details: 'Paiement mobile confirmé, client récurrent, marge estimée élevée.',
    },
  ], []);
  void mockTickets;

  const resetScanner = useCallback(() => {
    setProgress(0);
    setFlashOn(false);
    setCaptureUri(undefined);
    setDetected(null);
    setPhase('permission');
  }, []);

  const finishDetection = useCallback(async (asset?: ScannerImageAsset) => {
    setPhase('processing');
    try {
      if (!asset?.uri || !companyId) throw new Error('Image ou session cloud indisponible.');
      const payload = await scannerImageToOcrPayload(asset);
      const result = await formalioBackend.scanDocument(companyId, payload);
      if (!result?.extracted) throw new Error('OCR indisponible.');
      const extracted = result.extracted;
      const nextTicket: ScannedTicketData = {
        type: extracted.type,
        amount: extracted.amount,
        description: extracted.transactionDetails || `Document scanné - ${extracted.merchant}`,
        category: extracted.category,
        method: extracted.method,
        ticketNumber: extracted.ticketNumber,
        date: extracted.date,
        merchant: extracted.merchant,
        referenceNumber: extracted.referenceNumber,
        details: `${extracted.transactionDetails || 'Données extraites du document.'} Confiance OCR: ${extracted.confidence}%.`,
        imageUri: asset.uri,
      };
      setDetected(nextTicket);
      setCaptureUri(asset.uri);
      setPhase('detected');
    } catch (error) {
      console.warn('[Formalio OCR]', error);
      setPhase('error');
      showToast({ type: 'error', title: 'OCR indisponible', message: getFriendlyOcrError(error) });
    }
  }, [companyId, showToast]);

  const pickScannerImage = useCallback(async () => {
    try {
      setPhase('processing');
      const asset = Platform.OS === 'web'
        ? await pickWebScannerImage()
        : await (async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) throw new Error('Autorisez l’accès aux fichiers pour importer une image.');
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.76,
              base64: true,
            });
            if (result.canceled || !result.assets[0]?.uri) return null;
            const picked = result.assets[0] as ScannerImageAsset;
            return { ...picked, source: 'upload' as const };
          })();
      if (!asset) {
        setPhase(permission?.granted ? 'scanning' : 'permission');
        return;
      }
      await finishDetection(asset);
    } catch (error) {
      console.warn('[Formalio OCR upload]', error);
      setPhase('error');
      showToast({ type: 'error', title: 'Import OCR impossible', message: getFriendlyOcrError(error) });
    }
  }, [finishDetection, permission?.granted, showToast]);

  const handleWebDrop = useCallback((event: unknown) => {
    if (Platform.OS !== 'web') return;
    const dropEvent = event as { preventDefault?: () => void; dataTransfer?: { files?: ArrayLike<WebFileLike> } };
    dropEvent.preventDefault?.();
    const file = dropEvent.dataTransfer?.files?.[0];
    if (!file) return;
    void webFileToScannerAsset(file)
      .then((asset) => finishDetection({ ...asset, source: 'drop' }))
      .catch((error) => {
        console.warn('[Formalio OCR drop]', error);
        setPhase('error');
        showToast({ type: 'error', title: 'Import OCR impossible', message: getFriendlyOcrError(error) });
      });
  }, [finishDetection, showToast]);

  const webDropProps = Platform.OS === 'web'
    ? ({
        onDragOver: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
        onDrop: handleWebDrop,
      } as Record<string, unknown>)
    : {};

  const startScanner = useCallback(async () => {
    setDetected(null);
    setCaptureUri(undefined);
    setProgress(0);
    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission.granted) {
      setPhase('permission');
      return;
    }
    setPhase('scanning');
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isOpen) void startScanner();
    else resetScanner();
  }, [isOpen, resetScanner, startScanner]);

  useEffect(() => {
    if (!isOpen || phase !== 'scanning') return;
    setProgress(0);
    const interval = setInterval(() => setProgress((value) => Math.min(100, value + 7 + Math.random() * 9)), 180);
    const timer = setTimeout(() => {
      void (async () => {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.72, shutterSound: false, base64: Platform.OS === 'web' }) as ScannerImageAsset | undefined;
        await finishDetection(photo ?? (captureUri ? { uri: captureUri, mimeType: 'image/jpeg', source: 'camera' } : undefined));
      })();
    }, 2850);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [captureUri, finishDetection, isOpen, phase]);

  const captureTicket = async () => {
    try {
      setPhase('processing');
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.72, shutterSound: false, base64: Platform.OS === 'web' }) as ScannerImageAsset | undefined;
      await finishDetection(photo ? { ...photo, source: 'camera' } : undefined);
    } catch {
      setPhase('error');
    }
  };

  const confirmTicket = () => {
    if (!detected) return;
    onSave(detected);
  };

  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={styles.ocrModal}>
        <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.ocrHeader}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <Row style={{ gap: 10, flex: 1 }}>
              <View style={styles.glassIconSmall}><Icon icon={ScanLine} size={20} color={c.white} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="black" style={{ color: c.white, fontSize: 16 }}>Ticket Scanner AI</Txt>
                <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 3 }}>Camera OCR · structured transaction extraction</Txt>
              </View>
            </Row>
            <Tap onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.white} /></Tap>
          </Row>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
          {Platform.OS === 'web' ? (
            <Pressable onPress={pickScannerImage} {...webDropProps} style={styles.ocrDropZone}>
              <Icon icon={Upload} size={18} color={c.info700} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="bold" style={{ color: c.info700, fontSize: 12 }}>Importer ou glisser une image</Txt>
                <Txt style={{ color: c.info700, fontSize: 10, marginTop: 2 }}>JPG, PNG ou WebP · traitement OCR cloud sécurisé</Txt>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.ocrCameraBox}>
            {permission?.granted && phase !== 'detected' ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" autofocus="on" enableTorch={flashOn} />
            ) : null}
            {phase === 'detected' && captureUri ? <Image source={{ uri: captureUri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
            <LinearGradient colors={['rgba(2,6,23,.16)', 'rgba(2,6,23,.72)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.ocrFrame}>
              <View style={[styles.ocrCorner, styles.ocrCornerTopLeft]} />
              <View style={[styles.ocrCorner, styles.ocrCornerTopRight]} />
              <View style={[styles.ocrCorner, styles.ocrCornerBottomLeft]} />
              <View style={[styles.ocrCorner, styles.ocrCornerBottomRight]} />
            </View>
            {phase === 'scanning' ? <Animated.View entering={FadeIn.duration(180)} style={styles.ocrScanLine} /> : null}
            <View style={styles.ocrCameraOverlay}>
              {phase === 'permission' ? (
                <View style={styles.ocrPermissionCard}>
                  <Icon icon={Camera} size={30} color={c.formalio700} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Autorisation caméra requise</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4 }}>Ouvrez la caméra ou importez une image du document.</Txt>
                  <PrimaryButton label="Activer la caméra" icon={Camera} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
                  <PrimaryButton label="Importer une image" tone="surface" icon={Upload} onPress={pickScannerImage} style={{ minHeight: 40, borderRadius: 12, marginTop: 8 }} />
                </View>
              ) : null}
              {phase === 'scanning' ? (
                <View style={{ alignItems: 'center' }}>
                  <Pill tone="blue">Scanning...</Pill>
                  <Txt weight="bold" style={{ color: c.white, fontSize: 15, marginTop: 10 }}>Alignez le ticket dans le cadre</Txt>
                  <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 4 }}>Détection du marchand, montant, date et référence</Txt>
                </View>
              ) : null}
              {phase === 'processing' ? (
                <View style={styles.ocrProcessingCard}>
                  <ActivityIndicator color={c.formalio600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Extraction des données...</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>Analyse OCR du document</Txt>
                </View>
              ) : null}
              {phase === 'detected' ? (
                <View style={styles.ocrSuccessBadge}>
                  <Icon icon={CheckCircle2} size={22} color={c.white} />
                  <Txt weight="black" style={{ color: c.white, fontSize: 12 }}>Détecté</Txt>
                </View>
              ) : null}
              {phase === 'error' ? (
                <View style={styles.ocrPermissionCard}>
                  <Icon icon={AlertTriangle} size={28} color={c.danger600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Analyse impossible</Txt>
                  <PrimaryButton label="Relancer le scan" icon={RefreshCw} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
                  <PrimaryButton label="Importer une image" tone="surface" icon={Upload} onPress={pickScannerImage} style={{ minHeight: 40, borderRadius: 12, marginTop: 8 }} />
                </View>
              ) : null}
            </View>
          </View>

          <Card style={styles.ocrSignalCard}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Row style={{ gap: 7 }}><Icon icon={Sparkles} size={15} color={c.info700} /><Txt weight="black" style={{ color: c.info700, fontSize: 12 }}>OCR Confidence</Txt></Row>
              <Txt weight="black" style={{ color: c.info700, fontSize: 12 }}>{phase === 'detected' ? '98%' : `${Math.round(progress)}%`}</Txt>
            </Row>
            <ValueBar value={phase === 'detected' ? 98 : progress} color={phase === 'detected' ? c.formalio500 : c.info500} />
          </Card>

          {detected ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.ocrResultCard}>
              <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <View>
                  <Txt weight="black" style={{ fontSize: 14 }}>{detected.merchant}</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{detected.ticketNumber}</Txt>
                </View>
                <Txt weight="black" style={{ color: detected.type === 'income' ? c.formalio700 : c.danger600, fontSize: 16 }}>{detected.amount.toLocaleString('fr-FR')} FCFA</Txt>
              </Row>
              <Grid columns={2} gap={8}>
                <ScannerDataCell label="Date" value={detected.date} />
                <ScannerDataCell label="Reference" value={detected.referenceNumber} />
                <ScannerDataCell label="Category" value={detected.category} />
                <ScannerDataCell label="Method" value={detected.method} />
              </Grid>
              <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 10 }}>{detected.details}</Txt>
            </Animated.View>
          ) : null}

          <Row style={{ gap: 8 }}>
            <Tap onPress={() => setFlashOn((value) => !value)} style={[styles.ocrToolButton, flashOn && { borderColor: c.gold500, backgroundColor: c.gold50 }]}>
              <Icon icon={Zap} size={16} color={flashOn ? c.gold700 : c.surface600} />
            </Tap>
            <Tap onPress={startScanner} style={styles.ocrToolButton}><Icon icon={RefreshCw} size={16} color={c.surface600} /></Tap>
            <Tap onPress={pickScannerImage} style={styles.ocrToolButton}><Icon icon={Upload} size={16} color={c.surface600} /></Tap>
            <PrimaryButton label={phase === 'detected' ? 'Confirmer le remplissage' : 'Capturer le ticket'} icon={phase === 'detected' ? Check : Camera} onPress={phase === 'detected' ? confirmTicket : captureTicket} style={{ flex: 1, minHeight: 44, borderRadius: 13 }} />
          </Row>
          <Tap onPress={onClose} style={styles.ocrManualFallback}>
            <Icon icon={FileText} size={14} color={c.surface500} />
            <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Saisie manuelle</Txt>
          </Tap>
        </ScrollView>
      </View>
    </ModalShell>
  );
}

function ScannerDataCell({ label, value }: { label: string; value: string }) {
  const provider = getMobileMoneyProvider(value);
  return (
    <View style={styles.ocrDataCell}>
      <Txt style={{ color: c.surface400, fontSize: 10 }}>{label}</Txt>
      {provider ? (
        <View style={{ marginTop: 2 }}>
          <PaymentMethodInline method={value} color={c.surface800} />
        </View>
      ) : (
        <Txt weight="bold" numberOfLines={1} style={{ color: c.surface800, fontSize: 11, marginTop: 2 }}>{value}</Txt>
      )}
    </View>
  );
}
