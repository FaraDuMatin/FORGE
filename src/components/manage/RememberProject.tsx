"use client";

import { useEffect } from "react";
import { rememberMyProject } from "@/lib/myProjects";

// Renders nothing. Mounted on a valid manage page so this device remembers the
// project (so the maintainer can jump back in later without the link). Local only.
export function RememberProject({ slug, title, token }: { slug: string; title: string; token: string }) {
  useEffect(() => {
    rememberMyProject({ slug, title, token });
  }, [slug, title, token]);
  return null;
}
