import { renderHomePageHtml } from "./page-model.js";

export default async function Page() {
  return <div dangerouslySetInnerHTML={{ __html: await renderHomePageHtml() }} />;
}
