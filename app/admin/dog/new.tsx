import { router } from 'expo-router';
import { Screen } from '@/components/common';
import { DogForm } from '@/features/dogs/DogForm';
import { useCreateDog } from '@/features/dogs/hooks';

export default function NewDog() {
  const create = useCreateDog();
  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <DogForm
        submitLabel="Save dog"
        submitting={create.isPending}
        onSubmit={async (input) => {
          await create.mutateAsync(input);
          router.back();
        }}
      />
    </Screen>
  );
}
