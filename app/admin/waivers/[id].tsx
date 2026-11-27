// One signed boarding waiver, read-only: signer, signed time and version, every consent with its exact label,
// photo opt-out, the drawn signature and typed name, and links (printable copy, Know Your Dog form, dog profile).
// One call: GET /waivers/:id. Linking a dog (PATCH) is admin only.
import { RefreshControl, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { usePermission } from '@/auth/permissions';
import { AppText, Badge, Card, Icon, InlineAlert, Screen, SignatureView, StateView } from '@/components/common';
import { PhoneLinks } from '@/features/questionnaires/AnswerSections';
import { formatSignedAt } from '@/features/waivers/WaiverCard';
import { WaiverLinks } from '@/features/waivers/WaiverLinks';
import { useWaiver } from '@/features/waivers/hooks';
import { makeStyles, useTheme } from '@/theme';

export default function WaiverDetail() {
  const theme = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const can = usePermission();
  const { data: w, isLoading, error, refetch, isRefetching } = useWaiver(id);

  if (isLoading || error || !w) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  const agreed = w.consents.filter((c) => c.value).length;

  return (
    <Screen edges={['bottom']} style={styles.noPad}>
      <Stack.Screen options={{ title: `Waiver · ${w.dogName}` }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.between}>
            <AppText variant="heading" style={styles.flex}>{w.dogName}</AppText>
            <Badge label="Signed" tone="success" />
          </View>
          <AppText variant="caption">
            {[w.signedAt && `Signed ${formatSignedAt(w.signedAt)}`, w.version && `Version ${w.version}`].filter(Boolean).join(' · ')}
          </AppText>
          <View style={styles.section}>
            <AppText variant="label" color="textMuted">PET PARENT</AppText>
            <AppText variant="bodyStrong">{[w.parentName, w.phone].filter(Boolean).join(' · ')}</AppText>
            {!!w.phone && <PhoneLinks phone={w.phone} />}
          </View>
        </Card>

        {w.photosOptOut ? (
          <InlineAlert tone="warning" message="Photos opt-out: do not post this dog's photos or videos on Instagram or WhatsApp." />
        ) : (
          <InlineAlert tone="info" message="Photos and videos of this dog may be shared." />
        )}

        <Card>
          <AppText variant="label" color="textMuted">CONSENTS ({agreed} OF {w.consents.length} TICKED)</AppText>
          {w.consents.map((c) => (
            <View key={c.key} style={styles.consent} accessibilityLabel={`${c.value ? 'Ticked' : 'Not ticked'}: ${c.label}`}>
              <Icon
                name={c.value ? 'check-circle' : 'close-circle-outline'}
                color={c.value ? 'success' : c.key === 'photosOptOut' ? 'textSubtle' : 'danger'}
                size={theme.sizes.icon}
              />
              <AppText variant="body" style={styles.flex}>{c.label}</AppText>
            </View>
          ))}
        </Card>

        <Card>
          <AppText variant="label" color="textMuted">SIGNATURE</AppText>
          <SignatureView signature={w.signature} accessibilityLabel={`Signature of ${w.parentName}`} style={styles.signature} />
          <View style={styles.section}>
            <AppText variant="label" color="textMuted">TYPED NAME</AppText>
            <AppText variant="bodyStrong">{w.typedSignature || '-'}</AppText>
          </View>
        </Card>

        <WaiverLinks waiver={w} canManage={can('waivers.manage')} />

        <Card>
          <AppText variant="label" color="textMuted">RECORD</AppText>
          <AppText variant="caption" selectable>Reference {w.id}</AppText>
          {!!w.contentHash && <AppText variant="caption" selectable>Text fingerprint {w.contentHash.slice(0, 16)}</AppText>}
          {!!w.userAgent && <AppText variant="caption" selectable numberOfLines={2}>Device {w.userAgent}</AppText>}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  noPad: { padding: 0 },
  content: { padding: t.spacing.xl, gap: t.spacing.md, paddingBottom: t.spacing.xxxl },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  section: { gap: t.spacing.xxs, marginTop: t.spacing.sm },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm, paddingVertical: t.spacing.xs },
  signature: { marginTop: t.spacing.xs },
}));
