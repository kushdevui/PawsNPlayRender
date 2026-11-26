// Add dog. With ?fromForm=<questionnaire id> the form is prefilled from a Know Your Dog submission,
// and the submission is linked to the new dog after saving.
import { router, useLocalSearchParams } from 'expo-router';
import { InlineAlert, Screen, StateView } from '@/components/common';
import { DogForm } from '@/features/dogs/DogForm';
import { useCreateDog } from '@/features/dogs/hooks';
import { dogFromAnswers } from '@/features/questionnaires/answers';
import { useQuestionnaire, useUpdateQuestionnaire } from '@/features/questionnaires/hooks';
import { showAlert } from '@/lib/dialog';

export default function NewDog() {
  const { fromForm } = useLocalSearchParams<{ fromForm?: string }>();
  const create = useCreateDog();
  const form = useQuestionnaire(fromForm);
  const linkForm = useUpdateQuestionnaire(fromForm ?? '');

  if (fromForm && form.isLoading) {
    return (
      <Screen>
        <StateView loading />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      {!!fromForm && form.data && <InlineAlert tone="info" message="Filled in from the Know Your Dog form. Check the details before saving." />}
      {!!fromForm && form.error && <InlineAlert tone="warning" message={`Could not load the form answers: ${form.error.message}`} />}
      <DogForm
        initial={form.data ? dogFromAnswers(form.data.answers) : undefined}
        submitLabel="Save dog"
        submitting={create.isPending || linkForm.isPending}
        onSubmit={async (input) => {
          const dog = await create.mutateAsync(input);
          if (fromForm && form.data) {
            try {
              await linkForm.mutateAsync({ dogId: dog.id });
            } catch (e) {
              showAlert('Dog saved', `${dog.name} was added, but the form could not be linked: ${(e as Error).message}`);
            }
          }
          router.back();
        }}
      />
    </Screen>
  );
}
