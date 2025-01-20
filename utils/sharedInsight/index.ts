import { XanoClient } from "@xano/js-sdk";
import { InsightResponse, UserFollowingAndFavourite } from "../../types";
import { debounce, formatCuratedDate, qs, qsa } from "..";
export async function sharedInsightPageCode({
  dataSource,
}: {
  dataSource: "live" | "dev";
}) {
  const route = dataSource === "dev" ? "/dev" : "";
  console.log("share-insight-dev");
  const xano_shared_insight_pages = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:L71qefry",
  }).setDataSource(dataSource);
  // const x = new XanoClient({
  //   apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:CvEH0ZFk",
  // }).setDataSource(dataSource);
  // const xano_wmx = new XanoClient({
  //   apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:6Ie7e140",
  // }).setDataSource(dataSource);
  // const xano_userFeed = new XanoClient({
  //   apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:Hv8ldLVU",
  // }).setDataSource(dataSource);
  const insightTagTemplate = qs(`[dev-template="insight-tag"]`);

  // let userFollowingAndFavourite: UserFollowingAndFavourite | null = null;
  // let xanoToken: string | null = null;

  const insightTemplate = qs(`[dev-target="insight-template"]`);
  const companyCards = qsa(`[dev-target="company-card"]`);
  const peopleCards = qsa(`[dev-target="people-card"]`);
  const eventCards = qsa(`[dev-target="event-card"]`);
  const sourceDocumentCard = qs(`[dev-target="source-document-card"]`);
  // const shareCard = qs(`[dev-target="share-card"]`);

  const searchParams = new URLSearchParams(window.location.search);
  const shareToken = searchParams.get("share-token");
  // const lsUserFollowingFavourite = localStorage.getItem(
  //   "user-following-favourite"
  // );
  // const lsXanoAuthToken = localStorage.getItem("AuthToken");
  // if (lsXanoAuthToken) {
  //   xanoToken = lsXanoAuthToken;
  // }

  // if (shareCard) {
  //   shareInit(shareCard);
  // }

  // if (lsUserFollowingFavourite) {
  //   userFollowingAndFavourite = JSON.parse(lsUserFollowingFavourite);
  // }

  if (!shareToken) {
    return console.error("shareToken not found");
  }

  // const memberStackUserToken = localStorage.getItem("_ms-mid");
  // if (!memberStackUserToken) {
  //   return console.error("No memberstack token");
  // }

  // if (xanoToken) {
  //   xano_userFeed.setAuthToken(xanoToken);
  //   x.setAuthToken(xanoToken);
  //   getXanoAccessToken(memberStackUserToken);
  // } else {
  //   await getXanoAccessToken(memberStackUserToken);
  // }
  // lsUserFollowingFavourite
  //   ? getUserFollowingAndFavourite()
  //   : await getUserFollowingAndFavourite();
  insightPageInit(shareToken);

  // function shareInit(shareCard: HTMLDivElement) {
  //   const shareForm = shareCard.querySelector<HTMLFormElement>(
  //     "[dev-target=share-form]"
  //   );
  //   const shareInput = shareForm?.querySelector<HTMLInputElement>(
  //     "[dev-target=share-input]"
  //   );
  //   if (!shareForm || !shareInput)
  //     return console.error("shareForm or shareInput missing");
  //   shareForm.addEventListener("submit", (e) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     console.log({ value: shareInput.value, insightSlug });
  //   });
  // }

  async function insightPageInit(token: string) {
    const insight = await getInsight(token);
    if (insight) {
      const companyItemTemplate = companyCards
        .item(0)
        .querySelector<HTMLDivElement>(
          `[dev-target="company-template"]`
        ) as HTMLDivElement;
      const peopleItemTemplate = peopleCards
        .item(0)
        .querySelector<HTMLDivElement>(
          `[dev-target="people-template"]`
        ) as HTMLDivElement;
      const sourceDocumentItemTemplate =
        sourceDocumentCard.querySelector<HTMLDivElement>(
          `[dev-target="source-document-template"]`
        ) as HTMLDivElement;
      const eventItemTemplate = eventCards
        .item(0)
        .querySelector<HTMLDivElement>(
          `[dev-target="event-link"]`
        ) as HTMLDivElement;
      // const eventItemTemplate = sourceDocumentCard.querySelector<HTMLDivElement>(
      //   `[dev-target="event-link"]`
      // ) as HTMLDivElement;
      const tagsWrapperTarget = insightTemplate.querySelector<HTMLDivElement>(
        `[dev-target=tags-container]`
      );
      const insightName = insightTemplate.querySelector(
        `[dev-target="insight-name"]`
      );
      const insightRichtext = insightTemplate.querySelector(
        `[dev-target="rich-text"]`
      );
      const companyImage = insightTemplate.querySelector<HTMLImageElement>(
        `[dev-target=company-image]`
      );
      const companyLink = insightTemplate.querySelector<HTMLLinkElement>(
        `[dev-target=company-link]`
      );
      const companyPictureLink = insightTemplate.querySelector<HTMLLinkElement>(
        `[dev-target=company-picture-link]`
      );
      const curatedDateTargetWrapper = insightTemplate.querySelector(
        `[dev-target="curated-date-wrapper"]`
      );
      const curatedDateTarget = insightTemplate.querySelector(
        `[dev-target="curated-date"]`
      );
      const publishedDateTargetWrapper = insightTemplate.querySelectorAll(
        `[dev-target="published-date-wrapper"]`
      );
      const publishedDateTarget = insightTemplate.querySelector(
        `[dev-target="published-date"]`
      );
      const sourceTargetWrapper = insightTemplate.querySelector(
        `[dev-target="source-name-link-wrapper"]`
      );
      const sourceTarget = insightTemplate.querySelector(
        `[dev-target="source-name-link"]`
      );
      const sourceAuthorTargetWrapper = insightTemplate.querySelectorAll(
        `[dev-target="source-author-wrapper"]`
      );
      const sourceAuthorTarget = insightTemplate.querySelector(
        `[dev-target="source-author"]`
      );
      const curatedDate = insight.curated
        ? formatCuratedDate(insight.curated)
        : "";
      const publishedDate = insight["source-publication-date"]
        ? formatPublishedDate(insight["source-publication-date"])
        : "";

      const favouriteInputs =
        insightTemplate.querySelectorAll<HTMLInputElement>(
          `[dev-target=favourite-input]`
        );
      const companyInputs = insightTemplate.querySelectorAll<HTMLInputElement>(
        `[dev-target=company-input]`
      );

      companyInputs.forEach((companyInput) => {
        // fakeCheckboxToggle(companyInput!);
        companyInput?.setAttribute("dev-input-type", "company_id");
        if (insight.company_id) {
          companyInput?.setAttribute(
            "dev-input-id",
            insight.company_id.toString()
          );
        } else {
          const inputForm = companyInput.closest("form");
          if (inputForm) {
            inputForm.style.display = "none";
          }
        }
        // companyInput?.setAttribute(
        //   "dev-input-id",
        //   insight.company_id.toString()
        // );
        // companyInput && followFavouriteLogic(companyInput);
        // companyInput &&
        //   setCheckboxesInitialState(
        //     companyInput,
        //     convertArrayOfObjToNumber(
        //       userFollowingAndFavourite!.user_following.company_id
        //     )
        //   );
      });
      // favouriteInputs.forEach((favouriteInput) => {
      //   fakeCheckboxToggle(favouriteInput!);

      //   favouriteInput?.setAttribute("dev-input-type", "favourite");
      //   favouriteInput?.setAttribute("dev-input-id", insight.id.toString());

      //   // favouriteInput && followFavouriteLogic(favouriteInput);

      //   // favouriteInput &&
      //   //   setCheckboxesInitialState(
      //   //     favouriteInput,
      //   //     userFollowingAndFavourite!.user_favourite.insight_id
      //   //   );
      // });

      if (insight.company_details.company_logo) {
        companyImage!.src = insight.company_details.company_logo.url;
      } else {
        companyImage!.src =
          "https://logo.clearbit.com/" +
          insight.company_details["company-website"];
        fetch(
          "https://logo.clearbit.com/" +
            insight.company_details["company-website"]
        ).catch(
          () =>
            (companyImage!.src =
              "https://uploads-ssl.webflow.com/64a2a18ba276228b93b991d7/64c7c26d6639a8e16ee7797f_Frame%20427318722.webp")
        );
      }
      curatedDateTargetWrapper?.classList[curatedDate ? "remove" : "add"](
        "hide"
      );
      curatedDateTarget!.textContent = curatedDate ?? "";
      publishedDateTarget!.textContent = publishedDate ?? "";
      publishedDateTargetWrapper.forEach((item) =>
        item.classList[publishedDate ? "remove" : "add"]("hide")
      );
      sourceTarget!.setAttribute("href", "/login");
      // sourceTarget!.setAttribute("href", insight["source-url"]);
      sourceTargetWrapper?.classList[insight["source-url"] ? "remove" : "add"](
        "hide"
      );
      sourceTarget!.textContent = insight.source;
      sourceAuthorTargetWrapper.forEach((item) =>
        item.classList[insight.source_author ? "remove" : "add"]("hide")
      );
      sourceAuthorTarget!.textContent = insight.source_author;
      insightName!.textContent = insight.name;
      companyLink!.textContent = insight.company_details.name;
      companyLink!.href = "/login";
      // companyLink!.href = `${route}/company/` + insight.company_details.slug;
      // companyPictureLink!.href =
      //   `${route}/company/` + insight.company_details.slug;
      companyPictureLink!.href = "/login";
      insightRichtext!.innerHTML = insight["insight-detail"];
      addTagsToInsight(insight.company_type_id, tagsWrapperTarget!, false);
      addTagsToInsight(insight.source_category_id, tagsWrapperTarget!, false);
      // addTagsToInsight(insight.line_of_business_id, tagsWrapperTarget!, false);
      addTagsToInsight(
        insight.insight_classification_id,
        tagsWrapperTarget!,
        false
      );
      addTagsToInsight(
        insight.technology_category_id,
        tagsWrapperTarget!,
        true,
        "technology_category_id"
      );

      const companyWrappers = Array.from(companyCards).map((companyCard) =>
        companyCard.querySelector(`[dev-target="company-wrapper"]`)
      );
      companyWrappers.forEach((companyWrapper) => {
        if (
          insight.companies_mentioned &&
          insight.companies_mentioned.length > 0
        ) {
          insight.companies_mentioned.forEach((item) => {
            if (item === null) return;
            const companyItem = companyItemTemplate.cloneNode(
              true
            ) as HTMLDivElement;
            const companyPictureLink =
              companyItem.querySelector<HTMLLinkElement>(
                `[dev-target="company-picture-link"]`
              );
            const companyLink = companyItem.querySelector<HTMLLinkElement>(
              `[dev-target="company-link"]`
            );
            const companyInput = companyItem.querySelector<HTMLInputElement>(
              `[dev-target="company-input"]`
            );
            const companyImage = companyItem.querySelector<HTMLImageElement>(
              `[dev-target="company-image"]`
            );
            if (item.company_logo) {
              companyImage!.src = item.company_logo.url;
            } else {
              companyImage!.src =
                "https://logo.clearbit.com/" + item["company-website"];
              fetch(
                "https://logo.clearbit.com/" + item["company-website"]
              ).catch(
                () =>
                  (companyImage!.src =
                    "https://uploads-ssl.webflow.com/64a2a18ba276228b93b991d7/64c7c26d6639a8e16ee7797f_Frame%20427318722.webp")
              );
            }
            // companyPictureLink!.href = `${route}/company/` + item.slug;
            // companyLink!.href = `${route}/company/` + item.slug;
            companyPictureLink!.href = "/login";
            companyLink!.href = "/login";
            companyLink!.textContent = item.name;
            // fakeCheckboxToggle(companyInput!);
            companyInput?.setAttribute("dev-input-type", "company_id");
            companyInput?.setAttribute("dev-input-id", item.id.toString());
            // companyInput && followFavouriteLogic(companyInput);
            // companyInput &&
            //   setCheckboxesInitialState(
            //     companyInput,
            //     convertArrayOfObjToNumber(
            //       userFollowingAndFavourite!.user_following.company_id
            //     )
            //   );

            companyWrapper?.appendChild(companyItem);
          });

          companyCards.forEach((companyCard) =>
            companyCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.add("hide")
          );
        } else {
          companyCards.forEach((companyCard) =>
            companyCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.remove("hide")
          );
          companyWrapper?.classList.add("hide");
        }
      });

      const sourceDocumentWrapper = sourceDocumentCard.querySelector(
        `[dev-target="source-document-wrapper"]`
      );
      if (insight.source_document_id && insight.source_document_id.length > 0) {
        insight.source_document_id.forEach((sourceDocument) => {
          if (sourceDocument === null) return;
          const sourceDocumentItem = sourceDocumentItemTemplate.cloneNode(
            true
          ) as HTMLDivElement;
          const sourceDocumentItemLink =
            sourceDocumentItem.querySelector<HTMLLinkElement>(
              `[dev-target="source-document-link"]`
            );

          sourceDocumentItemLink!.textContent = sourceDocument.name;
          sourceDocumentItemLink!.href = "/login";
          // sourceDocumentItemLink!.href = sourceDocument.document
          //   ? sourceDocument.document.url
          //   : sourceDocument.document_url;

          sourceDocumentWrapper?.appendChild(sourceDocumentItem);
        });
        sourceDocumentCard
          .querySelector(`[dev-target="empty-state"]`)
          ?.classList.add("hide");
      } else {
        sourceDocumentCard
          .querySelector(`[dev-target="empty-state"]`)
          ?.classList.remove("hide");
        sourceDocumentWrapper?.classList.add("hide");
      }

      const peopleWrappers = Array.from(peopleCards).map(
        (peopleCard) =>
          peopleCard.querySelector(`[dev-target="people-wrapper"]`)!
      );
      peopleWrappers.forEach((peopleWrapper) => {
        if (insight.people_id && insight.people_id.length > 0) {
          insight.people_id.forEach((person) => {
            if (person === null) return;
            const peopleItem = peopleItemTemplate.cloneNode(
              true
            ) as HTMLDivElement;
            const personItemLink = peopleItem.querySelector<HTMLLinkElement>(
              `[dev-target="people-link"]`
            );
            const companyItemLink = peopleItem.querySelector<HTMLLinkElement>(
              `[dev-target="company-link"]`
            );
            const personTitleName = person.title;
            const personName = `${person.name}${
              personTitleName && ", " + truncateText(personTitleName, 30)
            }`;
            const personLink = `${route}/person/` + person.slug;
            const companyName = person._company?.name;
            const companyLink = `${route}/company/` + person._company?.slug;

            personItemLink!.textContent = personName;
            personItemLink!.href = "/login";
            // personItemLink!.href = personLink;
            if (companyName) {
              companyItemLink!.textContent = companyName;
            }
            companyItemLink!.href = "/login";
            // companyItemLink!.href = companyLink;

            peopleWrapper?.appendChild(peopleItem);
          });
          peopleCards.forEach((peopleCard) =>
            peopleCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.add("hide")
          );
        } else {
          peopleCards.forEach((peopleCard) =>
            peopleCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.remove("hide")
          );
          peopleWrapper?.classList.add("hide");
        }
      });

      const eventWrappers = Array.from(eventCards).map(
        (eventCard) => eventCard.querySelector(`[dev-target="event-wrapper"]`)!
      );
      eventWrappers.forEach((eventWrapper) => {
        if (insight.event_details) {
          const eventItem = eventItemTemplate.cloneNode(
            true
          ) as HTMLLinkElement;
          eventItem.textContent = insight.event_details.name;
          eventItem.href = "/login";
          // eventItem.href = `${route}/event/` + insight.event_details.slug;

          eventWrapper?.append(eventItem);
          eventCards.forEach((eventCard) =>
            eventCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.add("hide")
          );
        } else {
          eventCards.forEach((eventCard) =>
            eventCard
              .querySelector(`[dev-target="empty-state"]`)
              ?.classList.remove("hide")
          );
          eventWrapper?.classList.add("hide");
        }
      });

      insightTemplate.classList.remove("hide-template");
    }
  }

  async function getInsight(token: string) {
    try {
      const res = await xano_shared_insight_pages.get("/get_shared_insight", {
        token,
      });
      const insightResponse = res.getBody() as InsightResponse;
      if (insightResponse === null) {
        window.location.href = "/404";
      }
      qs("title").textContent = insightResponse.name;

      // console.log("insightResponse", insightResponse);
      return insightResponse;
    } catch (error) {
      console.log("getInsight_error", error);
      return null;
    }
  }

  // async function getXanoAccessToken(memberstackToken: string) {
  //   try {
  //     const res = await xano_wmx.post("/auth-user", {
  //       memberstack_token: memberstackToken,
  //     });
  //     const xanoAuthToken = res.getBody().authToken as string;
  //     xano_individual_pages.setAuthToken(xanoAuthToken);
  //     xano_userFeed.setAuthToken(xanoAuthToken);
  //     return xanoAuthToken;
  //   } catch (error) {
  //     console.log("getXanoAccessToken_error", error);
  //     return null;
  //   }
  // }

  // function fakeCheckboxToggle(input: HTMLInputElement) {
  //   input.addEventListener("change", () => {
  //     const inputWrapper = input.closest(
  //       "[dev-fake-checkbox-wrapper]"
  //     ) as HTMLDivElement;
  //     inputWrapper.classList[input.checked ? "add" : "remove"]("checked");
  //   });
  // }

  function truncateText(input: string, maxLength: number) {
    return input.length > maxLength ? input.slice(0, maxLength) + "..." : input;
  }

  function addTagsToInsight(
    tagArray: (
      | 0
      | {
          id: number;
          name: string;
          slug: string;
        }
      | null
    )[],
    targetWrapper: HTMLDivElement,
    showCheckbox: boolean,
    type?: "technology_category_id"
  ) {
    tagArray.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        const newTag = insightTagTemplate.cloneNode(true) as HTMLDivElement;
        const tagCheckbox = newTag.querySelector<HTMLDivElement>(
          `[dev-target=fake-checkbox]`
        );
        const tagInput = newTag.querySelector<HTMLInputElement>(
          `[dev-target=tag-input]`
        );
        // showCheckbox && tagInput && fakeCheckboxToggle(tagInput);
        showCheckbox &&
          type &&
          tagInput &&
          tagInput.setAttribute("dev-input-type", type);
        showCheckbox &&
          tagInput &&
          tagInput.setAttribute("dev-input-id", item.id.toString());
        // showCheckbox && tagInput && followFavouriteLogic(tagInput);
        newTag.querySelector(`[dev-target=tag-name]`)!.textContent =
          item?.name!;

        if (showCheckbox) {
          const tagSpan = newTag.querySelector<HTMLSpanElement>(
            `[dev-target="tag-name"]`
          );
          newTag.style.cursor = "pointer";
          newTag.querySelector<HTMLLabelElement>(
            `[dev-fake-checkbox-wrapper]`
          )!.style.cursor = "pointer";
          const anchor = document.createElement("a");
          anchor.href = "/login";
          // anchor.href = `${route}/technology/${item.slug}`;
          anchor.textContent = tagSpan!.textContent;
          anchor.style.cursor = "pointer";
          anchor.classList.add("tag-span-name");
          tagSpan?.replaceWith(anchor);
        }

        if (tagCheckbox && !showCheckbox) {
          tagCheckbox.style.display = "none";
        }
        // if (showCheckbox && tagInput && userFollowingAndFavourite) {
        //   setCheckboxesInitialState(
        //     tagInput,
        //     convertArrayOfObjToNumber(
        //       userFollowingAndFavourite?.user_following.technology_category_id
        //     )
        //   );
        // }

        targetWrapper?.appendChild(newTag);
      }
    });
  }

  // async function getUserFollowingAndFavourite() {
  //   try {
  //     const res = await xano_userFeed.get("/user-following-and-favourite");
  //     const followingAndFavourite = res.getBody() as UserFollowingAndFavourite;
  //     userFollowingAndFavourite = followingAndFavourite;
  //     localStorage.setItem(
  //       "user-following-favourite",
  //       JSON.stringify(followingAndFavourite)
  //     );

  //     return followingAndFavourite;
  //   } catch (error) {
  //     console.error(`getUserFollowingAndFavourite_error`, error);
  //     return null;
  //   }
  // }

  // const followFavouriteDebounce = debounce(followFavouriteListener, 300);

  // async function followFavouriteListener(input: HTMLInputElement) {
  //   const type = input.getAttribute("dev-input-type")!;
  //   const id = input.getAttribute("dev-input-id")!;
  //   const endPoint =
  //     type === "favourite" ? "/toggle-favourite" : "/toggle-follow";
  //   try {
  //     await xano_userFeed.get(endPoint, {
  //       id: Number(id),
  //       target: type,
  //     });
  //     console.log("userFollowingAndFavourite-1", userFollowingAndFavourite);
  //     await getUserFollowingAndFavourite();
  //     // run function to updated all-tab inputs
  //     console.log("userFollowingAndFavourite-2", userFollowingAndFavourite);

  //     // update company checkboxes
  //     const companyInputs = qsa<HTMLInputElement>(
  //       `[dev-input-type="company_id"]`
  //     );
  //     companyInputs.forEach((companyInput) => {
  //       companyInput &&
  //         setCheckboxesInitialState(
  //           companyInput,
  //           convertArrayOfObjToNumber(
  //             userFollowingAndFavourite?.user_following.company_id!
  //           )
  //         );
  //     });
  //   } catch (error) {
  //     console.error(`followFavouriteLogic${endPoint}_error`, error);
  //     return null;
  //   }
  // }

  // function followFavouriteLogic(input: HTMLInputElement) {
  //   input.addEventListener("change", async () =>
  //     followFavouriteDebounce(input)
  //   );
  // }
  function convertArrayOfObjToNumber(data: { id: number }[]) {
    return data.map((item) => item.id);
  }
  // function setCheckboxesInitialState(
  //   input: HTMLInputElement,
  //   slugArray: number[]
  // ) {
  //   const inputId = input.getAttribute("dev-input-id");

  //   if (slugArray.includes(Number(inputId))) {
  //     input.checked = true;
  //     input
  //       .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
  //       ?.classList.add("checked");
  //   } else {
  //     input.checked = false;
  //     input
  //       .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
  //       ?.classList.remove("checked");
  //   }
  // }

  function formatPublishedDate(inputDate: Date) {
    const date = new Date(inputDate);
    return `${date.toLocaleString("default", {
      month: "long",
      timeZone: "UTC",
    })} ${date.getUTCDate()}, ${date.getFullYear()}`;
  }

  // function debounce(func: (...args: any[]) => void, delay: number) {
  //   let debounceTimer: ReturnType<typeof setTimeout>;
  //   return function (this: any, ...args: any[]) {
  //     const context = this;
  //     clearTimeout(debounceTimer);
  //     debounceTimer = setTimeout(() => func.apply(context, args), delay);
  //   };
  // }

  // // Function for querying a single element by selector
  // function qs<T extends HTMLElement = HTMLDivElement>(selector: string): T {
  //   return document.querySelector(selector) as T;
  // }

  // // Function for querying multiple elements by selector
  // function qsa<T extends HTMLElement = HTMLDivElement>(
  //   selector: string
  // ): NodeListOf<T> {
  //   return document.querySelectorAll(selector) as NodeListOf<T>;
  // }
}
