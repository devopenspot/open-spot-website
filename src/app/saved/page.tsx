import SavedTab from '@/components/saved/SavedTab';
import { requireUserOrRedirect } from '@/lib/auth/server';

export const metadata = {
  title: 'Saved Spots',
  description: 'Your bookmarked skate spots. Sync across sessions.',
};

export default async function SavedPage() {
  await requireUserOrRedirect('/saved');
  return <SavedTab />;
}
