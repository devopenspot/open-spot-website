"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostForm } from "./PostForm";
import { PostSuccessScreen } from "./PostSuccessScreen";

export default function PostTab() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (isSubmitted) {
    return (
      <PostSuccessScreen
        onPostAnother={() => {
          setIsSubmitted(false);
          setFormKey((k) => k + 1);
        }}
        onReturnToDirectory={() => router.push("/")}
      />
    );
  }

  return <PostForm key={formKey} onSubmitted={() => setIsSubmitted(true)} />;
}