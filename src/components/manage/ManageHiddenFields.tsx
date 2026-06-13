// The identifiers every manage action needs: which project, the secret token
// (maintainer auth), and the slug + locale for path revalidation.
export type ManageContext = {
  projectId: string;
  token: string;
  slug: string;
  locale: string;
};

export function ManageHiddenFields({ projectId, token, slug, locale }: ManageContext) {
  return (
    <>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
    </>
  );
}
