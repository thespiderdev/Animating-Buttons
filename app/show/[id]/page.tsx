import { notFound } from "next/navigation";
import PageShell from "@/components/community/page-shell";
import ButtonEditor from "@/components/community/editor";
import ButtonInfo from "@/components/seo/button-info";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { getPublicButton } from "@/lib/public-community";
import { buttonTitle } from "@/lib/button-code";
import {
  buttonDescription,
  buttonSchema,
  pageMetadata,
  webPageSchema,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import ReactButtonViewer from "@/components/community/react-button-viewer";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await getPublicButton(id);
  if (result.state === "missing") notFound();
  if (result.state !== "public")
    return pageMetadata({
      title: "Private button playground",
      description: "Sign in to manage your own button submission.",
      path: `/show/${encodeURIComponent(id)}`,
      index: false,
    });
  const button = result.button;
  return {
    ...pageMetadata({
      title: `${buttonTitle(button).slice(0, 60)} by @${button.githubUsername}`,
      description: buttonDescription(button),
      path: `/show/${id}`,
    }),
    authors: [
      {
        name: button.githubUsername,
        ...(button.source
          ? !button.source.authorUrl.includes("uiverse.io")
            ? { url: button.source.authorUrl }
            : {}
          : {
              url: `${SITE_URL}/user/${encodeURIComponent(button.githubUsername)}`,
            }),
      },
    ],
    creator: button.githubUsername,
  };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const result = await getPublicButton(id);
  if (result.state === "missing") notFound();
  const button = result.state === "public" ? result.button : undefined;
  return (
    <PageShell wide>
      {button && (
        <>
          <JsonLd data={buttonSchema(button)} />
          <JsonLd
            data={webPageSchema(
              `/show/${id}`,
              buttonTitle(button),
              buttonDescription(button),
            )}
          />
        </>
      )}
      {button?.reactSource ? (
        <ReactButtonViewer button={{ ...button, html: "", js: "" }} />
      ) : (
        <ButtonEditor key={id} id={id} initialButton={button} />
      )}
      {button && <ButtonInfo button={button} />}
      {button && (
        <div className="mt-8">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Buttons", path: "/buttons" },
              { name: buttonTitle(button), path: `/show/${id}` },
            ]}
          />
        </div>
      )}
    </PageShell>
  );
}
