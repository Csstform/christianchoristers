import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PublicShell({
  children,
  solidHeader = false,
}: {
  children: React.ReactNode;
  solidHeader?: boolean;
}) {
  return (
    <div className="public-shell">
      <SiteHeader solid={solidHeader} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
