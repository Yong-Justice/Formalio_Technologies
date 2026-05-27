import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { legalDocuments, type LegalDocumentKey, type LegalContentItem } from '@/constants/legalDocuments';

const PRIMARY_GREEN = '#1B5E37';

type LegalDocumentScreenProps = {
  documentKey: LegalDocumentKey;
  onBack?: () => void;
};

function getTextStyle(item: LegalContentItem) {
  switch (item.kind) {
    case 'heading':
      return styles.sectionTitle;
    case 'bullet':
      return styles.bulletPoint;
    case 'meta':
      return styles.metaText;
    case 'tableCell':
      return styles.tableCell;
    default:
      return styles.bodyText;
  }
}

function renderPrefix(item: LegalContentItem) {
  return item.kind === 'bullet' ? '• ' : '';
}

export default function LegalDocumentScreen({ documentKey, onBack }: LegalDocumentScreenProps) {
  const legalDocument = legalDocuments[documentKey];

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Retour">
          <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {legalDocument.displayTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.documentTitle}>{legalDocument.sourceTitle}</Text>
        {legalDocument.lastUpdated ? (
          <Text style={styles.lastUpdated}>Dernière mise à jour : {legalDocument.lastUpdated}</Text>
        ) : null}

        {legalDocument.items.map((item, index) => (
          <Text key={`${documentKey}-${index}`} style={getTextStyle(item)}>
            {renderPrefix(item)}
            {item.text}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0,
    shadowRadius: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    lineHeight: 23,
  },
  headerSpacer: {
    width: 42,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
  documentTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: PRIMARY_GREEN,
    lineHeight: 27,
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY_GREEN,
    lineHeight: 24,
    marginTop: 24,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 6,
    paddingLeft: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  tableCell: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 23,
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D1FAE5',
  },
});
