import { PostClosedNotice } from "@/components/post/PostClosedNotice";
import { requireUserOrRedirect } from "@/lib/auth/server";

export const metadata = {
  title: "Post a Spot",
  description:
    "Public spot submissions are paused. Use the admin dashboard to add a new spot to the directory.",
};

export default async function PostPage() {
  await requireUserOrRedirect("/post");
  return <PostClosedNotice />;
}
