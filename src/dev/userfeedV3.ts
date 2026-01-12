import { userFeedCode } from "../../utils/userFeedV3";

const initUserFeedPage = async () => {
  console.log("[INFO] userfeedV3.ts called");
  userFeedCode({ dataSource: "dev" });
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", async () => {
  initUserFeedPage();
}) : initUserFeedPage();
