// Links on a signed waiver: printable copy (server HTML in the browser), linked Know Your Dog form, linked dog
// (open it, or link / change / unlink with PATCH /waivers/:id { dogId } - admin only, waivers.manage).
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { waiversApi } from '@/api/endpoints';
import type { Waiver } from '@/api/types';
import { AppText, Button, Card, SelectSheet } from '@/components/common';
import { useDog, useDogOptions } from '@/features/dogs/hooks';
import { openLink } from '@/features/questionnaires/contact';
import { showAlert } from '@/lib/dialog';
import { makeStyles } from '@/theme';
import { useUpdateWaiver } from './hooks';

export function WaiverLinks({ waiver: w, canManage }: { waiver: Waiver; canManage: boolean }) {
  const styles = useStyles();
  const update = useUpdateWaiver(w.id);
  const dog = useDog(w.dogId ?? undefined);
  const [picking, setPicking] = useState(false);
  const dogOptions = useDogOptions(true);

  const setDog = (dogId: string | null) =>
    update.mutate({ dogId }, { onError: (e) => showAlert('Could not update the waiver', e.message) });

  const openPrintable = () => {
    const url = waiversApi.documentUrl(w.id);
    if (!url) return showAlert('Not available', 'The printable copy is made by the server. It is not available in mock mode.');
    void openLink(url);
  };

  return (
    <Card>
      <AppText variant="label" color="textMuted">DOCUMENT AND LINKS</AppText>
      <View style={styles.actions}>
        <Button title="Open printable copy" icon="printer-outline" variant="outline" onPress={openPrintable} />
        {!!w.questionnaireId && (
          <Button
            title="Know Your Dog form"
            icon="clipboard-text-outline"
            variant="outline"
            onPress={() => router.push({ pathname: '/admin/forms/[id]', params: { id: w.questionnaireId! } })}
          />
        )}
      </View>

      <View style={styles.dog}>
        <AppText variant="label" color="textMuted">DOG PROFILE</AppText>
        {w.dogId ? (
          <View style={styles.actions}>
            <Button
              title={dog.data ? `Open ${dog.data.name}` : 'Open dog'}
              icon="paw"
              variant="outline"
              onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: w.dogId! } })}
            />
            {canManage && <Button title="Change" variant="ghost" size="sm" onPress={() => setPicking(true)} disabled={update.isPending} />}
            {canManage && <Button title="Unlink" variant="ghost" size="sm" onPress={() => setDog(null)} loading={update.isPending} disabled={update.isPending} />}
          </View>
        ) : canManage ? (
          <View style={styles.actions}>
            <Button title="Link to dog" icon="link-variant" onPress={() => setPicking(true)} loading={update.isPending} disabled={update.isPending} />
          </View>
        ) : (
          <AppText variant="caption">Not linked to a dog profile yet.</AppText>
        )}
      </View>

      <SelectSheet
        visible={picking}
        onDismiss={() => setPicking(false)}
        title="Link to dog"
        options={dogOptions.options}
        value={w.dogId}
        onSelect={(id) => {
          setPicking(false);
          if (id !== w.dogId) setDog(id);
        }}
        searchable
        emptyText={dogOptions.isLoading ? 'Loading dogs…' : 'No dogs found'}
      />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.xs },
  dog: { marginTop: t.spacing.md, gap: t.spacing.xxs },
}));
