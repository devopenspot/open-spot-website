import PostTab from '@/components/post/PostTab';
import { requireUserOrRedirect } from '@/lib/auth/server';

export const metadata = {
  title: 'Post a Spot',
  description:
    'Contribute to the cartography. Map your local ledges, stairs, DIYs, or pools.',
};

export default async function PostPage() {
  await requireUserOrRedirect('/post');
  return <PostTab />;
}
