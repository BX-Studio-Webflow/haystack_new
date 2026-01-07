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
  const insightTagTemplate = qs(`[dev-template="insight-tag"]`);

  const insightTemplate = qs(`[dev-target="insight-template"]`);
  const companyCards = qsa(`[dev-target="company-card"]`);
  const peopleCards = qsa(`[dev-target="people-card"]`);
  const eventCards = qsa(`[dev-target="event-card"]`);
  const sourceDocumentCard = qs(`[dev-target="source-document-card"]`);

  const searchParams = new URLSearchParams(window.location.search);
  const shareToken = searchParams.get("share-token");

  if (!shareToken) {
    console.error("shareToken not found");
  }

  sharedInsightPageInit(shareToken);
  tooltipInit();

  async function sharedInsightPageInit(token: string | null) {
    const shareWrap = qs("[dev-target=share-wrap]");
    const introWrap = qs("[dev-target=intro-wrapper]");
    const introTextWrap = qs("[dev-target=intro-text-wrap]");
    const introWarn = qs("[dev-target=intro-warn]");
    const introLoader = qs("[dev-target=intro-loader]");
    const introBtn = introWrap.querySelector<HTMLDivElement>(
      "[dev-target=insight-btn]"
    );
    introBtn?.addEventListener("click", () => {
      introWrap.remove();
      shareWrap.setAttribute("dev-hide", "false");
    });
    try {
      if (!token) {
        console.error("Token not found");
        throw new Error("Token not found");
      }
      const insight = await getInsight(token);
      if (insight) {
        introLoader.remove();
        introTextWrap.setAttribute("dev-hide", "false");
        introTextWrap.querySelector("[dev-target=insight-text]")!.textContent =
          insight.name;
        introWrap.appendChild(introTextWrap);
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
        const companyPictureLink =
          insightTemplate.querySelector<HTMLLinkElement>(
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
        const companyInputs =
          insightTemplate.querySelectorAll<HTMLInputElement>(
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
        });

        if (insight.company_details?.company_logo) {
          companyImage!.src = insight.company_details.company_logo.url;
        } else {
          if (insight?.company_details) {
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
          } else {
            companyImage!.src =
              "https://uploads-ssl.webflow.com/64a2a18ba276228b93b991d7/64c7c26d6639a8e16ee7797f_Frame%20427318722.webp";
          }
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
        sourceTargetWrapper?.classList[
          insight["source-url"] ? "remove" : "add"
        ]("hide");
        sourceTarget!.textContent = insight.source;
        sourceAuthorTargetWrapper.forEach((item) =>
          item.classList[insight.source_author ? "remove" : "add"]("hide")
        );
        sourceAuthorTarget!.textContent = insight.source_author;
        insightName!.textContent = insight.name;
        companyLink!.textContent = insight?.company_details
          ? insight.company_details.name
          : "";
        companyLink!.href = "/login";
        companyPictureLink!.href = "/login";
        insightRichtext!.innerHTML = insight["insight-detail"];
        addTagsToInsight(insight.company_type_id, tagsWrapperTarget!, false);
        addTagsToInsight(insight.source_category_id, tagsWrapperTarget!, false);
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
              companyInput?.setAttribute("dev-input-type", "company_id");
              companyInput?.setAttribute("dev-input-id", item.id.toString());

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
        if (
          insight.source_document_id &&
          insight.source_document_id.length > 0
        ) {
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
          (eventCard) =>
            eventCard.querySelector(`[dev-target="event-wrapper"]`)!
        );
        eventWrappers.forEach((eventWrapper) => {
          if (insight.event_details) {
            const eventItem = eventItemTemplate.cloneNode(
              true
            ) as HTMLLinkElement;
            eventItem.textContent = insight.event_details.name;
            eventItem.href = "/login";

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

        // Initialize table scroll
        initTableScroll();
      } else {
        throw new Error("No insight returned");
      }
    } catch (error) {
      console.log({ error });
      introLoader.remove();
      introTextWrap.remove();
      introWarn.setAttribute("dev-hide", "false");
    }
  }

  function initTableScroll() {
    const figure = document.querySelector('figure.table') as HTMLElement;
    if (!figure) return;

    // Make sure the table can scroll horizontally
    figure.style.overflowX = 'auto';

    // Prevent double injection
    if (figure.previousElementSibling?.classList.contains('top-scroll')) return;

    // Create elements
    const topScroll = document.createElement('div');
    const topInner = document.createElement('div');

    topScroll.className = 'top-scroll';
    topInner.className = 'top-scroll-inner';

    topScroll.appendChild(topInner);

    // Required styles
    Object.assign(topScroll.style, {
      overflowX: 'auto',
      overflowY: 'hidden',
      width: `${figure.clientWidth}px`,
      height: 'auto',
    });

    Object.assign(topInner.style, {
      width: figure.scrollWidth + 'px',
      height: '10px',
    });

    const style = document.createElement('style');
    style.id = 'top-scrollbar-style';
    style.innerHTML = `
      .top-scroll::-webkit-scrollbar {
        height: 7px;
      }
      .top-scroll::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 8px;
      }
      .top-scroll::-webkit-scrollbar-track {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);

    // Inject ABOVE figure
    figure.parentNode?.insertBefore(topScroll, figure);

    // Sync sizes
    const sync = () => {
      topScroll.style.width = figure.clientWidth + 'px';
      topInner.style.width = figure.scrollWidth + 'px';

      // Hide if no overflow
      topScroll.style.display =
        figure.scrollWidth > figure.clientWidth ? 'block' : 'none';
    };

    // Sync scroll positions
    topScroll.addEventListener('scroll', () => {
      figure.scrollLeft = topScroll.scrollLeft;
    });

    figure.addEventListener('scroll', () => {
      topScroll.scrollLeft = figure.scrollLeft;
    });

    // Observe changes
    new ResizeObserver(sync).observe(figure);
    sync();

    // Also sync after images load
    window.addEventListener('load', sync);
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

      return insightResponse;
    } catch (error) {
      console.log("getInsight_error", error);
      return null;
    }
  }

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
        showCheckbox &&
          type &&
          tagInput &&
          tagInput.setAttribute("dev-input-type", type);
        showCheckbox &&
          tagInput &&
          tagInput.setAttribute("dev-input-id", item.id.toString());
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
          anchor.setAttribute("dev-tooltip", "");
          anchor.textContent = tagSpan!.textContent;
          anchor.style.cursor = "pointer";
          anchor.classList.add("tag-span-name");
          tagSpan?.replaceWith(anchor);
        }

        if (tagCheckbox && !showCheckbox) {
          tagCheckbox.style.display = "none";
        }

        targetWrapper?.appendChild(newTag);
      }
    });
  }

  const addTippyAttributes = (element: HTMLElement, content: string) => {
    element.setAttribute("data-tippy-content", content);
    element.setAttribute("data-tippy-placement", "left");
    element.setAttribute("data-tippy-arrow", "true");
    element.setAttribute("data-tippy-duration", "300");
  };

  function formatPublishedDate(inputDate: Date) {
    const date = new Date(inputDate);
    return `${date.toLocaleString("default", {
      month: "long",
      timeZone: "UTC",
    })} ${date.getUTCDate()}, ${date.getFullYear()}`;
  }

  function tooltipInit() {
    const customTooltip = qs("[dev-target=custom-tooltip]");

    document.addEventListener("mouseover", function (event) {
      let target =
        event.target instanceof HTMLElement
          ? event.target.closest("[dev-tooltip]")
          : null;
      if (!target) return;

      customTooltip.textContent =
        target.getAttribute("dev-tooltip") ||
        "Haystack license required to access this link";
      customTooltip.classList.add("visible");

      let rect = target.getBoundingClientRect();
      let tooltipRect = customTooltip.getBoundingClientRect();

      let left =
        rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
      let top = rect.top + window.scrollY - tooltipRect.height - 10; // 10px gap

      customTooltip.style.left = `${left}px`;
      customTooltip.style.top = `${top}px`;
    });

    document.addEventListener("mouseout", function (event) {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("[dev-tooltip]")
      ) {
        customTooltip.classList.remove("visible");
      }
    });
  }
}
