import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { VaultFileDelete } from "@/components/vault/vault-file-delete";
import { VaultSearch } from "@/components/vault/vault-search";
import { VaultUploadForm } from "@/components/vault/vault-upload-form";
import { getCurrentUser } from "@/lib/auth";
import { canUpload } from "@/lib/roles";
import { formatBytes, listVaultFiles } from "@/lib/vault";

export default async function AppFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const rows = await listVaultFiles(query || undefined);
  const uploader = canUpload(user.role);

  return (
    <>
      <AppNav user={user} current="/app/files" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>File vault</h2>
            <p className="muted">
              Shared uploads on the droplet. Managers and above can upload or
              remove files; all members can download.
            </p>
          </div>
        </div>

        <VaultSearch query={query} />

        {uploader ? (
          <details className="music-details" open={rows.length === 0}>
            <summary>Upload a file</summary>
            <VaultUploadForm />
          </details>
        ) : null}

        {rows.length === 0 ? (
          <p className="muted music-empty">
            {query ? `No files match “${query}”.` : "Vault is empty."}
          </p>
        ) : (
          <div className="vault-list">
            {rows.map((file) => (
              <article key={file.id} className="vault-row">
                <div>
                  <h3>
                    <a href={`/api/vault/files/${file.id}`}>{file.name}</a>
                  </h3>
                  <p className="muted">
                    {formatBytes(file.sizeBytes)} · uploaded by{" "}
                    {file.uploadedByName} ·{" "}
                    {file.createdAt.toLocaleDateString("en-US", {
                      timeZone: "America/Detroit",
                    })}
                  </p>
                </div>
                <div className="vault-row__actions">
                  <a className="btn btn-quiet" href={`/api/vault/files/${file.id}`}>
                    Download
                  </a>
                  {uploader ? <VaultFileDelete fileId={file.id} /> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
