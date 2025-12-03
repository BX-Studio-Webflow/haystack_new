import { insightPageCode } from "../../utils/insight";

const initInsightPage = async () => {
  console.log("[INFO] insight.ts called");
  insightPageCode({ dataSource: "dev" });
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", async () => {
  initInsightPage();
}) : initInsightPage();
