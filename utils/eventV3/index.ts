import { XanoClient } from "@xano/js-sdk";
import {
  FilterResponse,
  InsightPayload,
  PersonInsightResponse,
  SearchObject,
  UserFollowingAndFavourite,
} from "../../types";
import { debounce, formatCuratedDate, qs, qsa } from "..";

export async function eventPageCode({
  dataSource,
}: {
  dataSource: "live" | "dev";
}) {
  const pathName = window.location.pathname;
  const route =
    dataSource === "dev" ? "/dev" : pathName.includes("/demo") ? "/demo" : "";
  const xano_individual_pages = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:CvEH0ZFk",
  }).setDataSource(dataSource);
  const xano_wmx = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:6Ie7e140",
  }).setDataSource(dataSource);
  const xano_userFeed = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:Hv8ldLVU",
  }).setDataSource(dataSource);

  const searchObject: SearchObject = {
    search: "",
    checkboxes: {
      companyType: [],
      sourceCat: [],
      techCat: [],
      lineOfBus: [],
      insightClass: [],
      organization: [],
    },
  };
  const sortObject = {
    sortBy: "created_at",
    orderBy: "desc",
  };

  const searchParams = new URLSearchParams(window.location.search);
  const eventSlug = searchParams.get("name");

  let userFollowingAndFavourite: UserFollowingAndFavourite | null = null;
  let xanoToken: string | null = null;

  const eventCards = qsa("[dev-target=event-card]");
  const cardSkeletons = qsa("[dev-target=card-skeleton]");
  const insightsSkeleton = qs("[dev-target=skeleton-insights]");
  const eventDetails = qsa("[dev-event-details]");

  const insightSearchInput = qs<HTMLInputElement>("[dev-search-target]");
  const searchLoadingSpinner = qs<HTMLDivElement>(
    "[dev-target=search-loading-spinner]"
  );
  const insightFilterForm = qs<HTMLFormElement>("[dev-target=filter-form]");
  const insightClearFilters = qs<HTMLFormElement>("[dev-target=clear-filters]");
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });

  const insightTemplate = qs(`[dev-template="insight-item"]`);
  const insightTagTemplate = qs(`[dev-template="insight-tag"]`);
  const checkboxItemTemplate = qs(`[dev-template="checkbox-item"]`);

  const allTabsTarget = qs(`[dev-target="insight-all"]`);

  const filterCompanyTypeTarget = qs(`[dev-target="filter-company-type"]`);
  const filterSourceCatTarget = qs(`[dev-target="filter-source-cat"]`);
  const filterTechCatTarget = qs(`[dev-target="filter-tech-cat"]`);
  // const filterLineOfBusTarget = qs(`[dev-target="filter-line-of-business"]`);
  const filterInsightClassTarget = qs(`[dev-target="filter-insight-class"]`);

  const paginationTemplate = qs(`[dev-target=pagination-wrapper]`);

  const memberStackUserToken = localStorage.getItem("_ms-mid");
  if (!memberStackUserToken) {
    return console.error("No memberstack token");
  }

  const lsUserFollowingFavourite = localStorage.getItem(
    "user-following-favourite"
  );
  // const lsXanoAuthToken = localStorage.getItem("AuthToken");
  // if (lsXanoAuthToken) {
  //   xanoToken = lsXanoAuthToken;
  // }
  if (lsUserFollowingFavourite) {
    userFollowingAndFavourite = JSON.parse(lsUserFollowingFavourite);
  }

  if (!eventSlug) {
    return console.error(
      "add event name in the url eg /event/58th-annual-edison-electric-institute-financial-conference"
    );
  }

  if (xanoToken) {
    xano_userFeed.setAuthToken(xanoToken);
    xano_individual_pages.setAuthToken(xanoToken);
    getXanoAccessToken(memberStackUserToken);
  } else {
    await getXanoAccessToken(memberStackUserToken);
  }
  lsUserFollowingFavourite
    ? getUserFollowingAndFavourite()
    : await getUserFollowingAndFavourite();
  eventPageInit(eventSlug);

  async function getXanoAccessToken(memberstackToken: string) {
    try {
      const res = await xano_wmx.post("/auth-user", {
        memberstack_token: memberstackToken,
      });
      const xanoAuthToken = res.getBody().authToken as string;
      xano_userFeed.setAuthToken(xanoAuthToken);
      xano_individual_pages.setAuthToken(xanoAuthToken);
      return xanoAuthToken;
    } catch (error) {
      console.log("getXanoAccessToken_error", error);
      return null;
    }
  }

  async function getUserFollowingAndFavourite() {
    try {
      const res = await xano_userFeed.get("/user-following-and-favourite");
      const followingAndFavourite = res.getBody() as UserFollowingAndFavourite;
      // const { user_following } = followingAndFavourite;
      userFollowingAndFavourite = followingAndFavourite;
      localStorage.setItem(
        "user-following-favourite",
        JSON.stringify(followingAndFavourite)
      );

      return followingAndFavourite;
    } catch (error) {
      console.error(`getUserFollowingAndFavourite_error`, error);
      return null;
    }
  }

  async function eventPageInit(eventSlug: string) {
    getEventInsights(eventSlug, {});
    getEvent(eventSlug);
    insightFilterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    insightSearchInput.addEventListener("input", () => {
      searchObject.search = insightSearchInput.value;
      searchDebounce(
        eventSlug,
        () => {
          searchLoadingSpinner.classList.remove("hide");
        },
        () => {
          searchLoadingSpinner.classList.add("hide");
        }
      );
    });
    insightClearFilters.addEventListener("click", () => {
      const checkedFilters = qsa<HTMLInputElement>(
        "[dev-input-checkbox]:checked"
      );

      insightSearchInput.value = "";
      insightSearchInput.dispatchEvent(inputEvent);
      checkedFilters.forEach((input) => {
        input.click();
      });
    });
    getFilters(
      "/company_type",
      {},
      "companyType",
      filterCompanyTypeTarget,
      eventSlug
    );
    getFilters(
      "/source_category",
      {},
      "sourceCat",
      filterSourceCatTarget,
      eventSlug
    );
    getFilters(
      "/technology_category",
      {},
      "techCat",
      filterTechCatTarget,
      eventSlug
    );
    // getFilters(
    //   "/line_of_business",
    //   {},
    //   "lineOfBus",
    //   filterLineOfBusTarget,
    //   eventSlug
    // );
    getFilters(
      "/insight_classification",
      {},
      "insightClass",
      filterInsightClassTarget,
      eventSlug
    );
    sortLogicInit(eventSlug);
  }

  async function getEventInsights(slug: string, payload: InsightPayload) {
    const { page = 0, perPage = 0, offset = 0 } = payload;
    try {
      const res = await xano_individual_pages.get("/event_insights", {
        slug,
        page,
        perPage,
        offset,
        sortBy: sortObject.sortBy,
        orderBy: sortObject.orderBy,
        filtering: searchObject,
      });
      const eventInsightResponse = res.getBody() as PersonInsightResponse;
      allTabsTarget.innerHTML = "";

      paginationLogic(eventInsightResponse, slug);

      userFollowingAndFavourite &&
        initInsights(
          eventInsightResponse,
          allTabsTarget,
          userFollowingAndFavourite
        );
      insightsSkeleton.remove();
      console.log("eventInsightResponse", eventInsightResponse);
      return eventInsightResponse;
    } catch (error) {
      console.log("getEventInsights_error", error);
      return null;
    }
  }

  function paginationLogic(insight: PersonInsightResponse, eventSlug: string) {
    const paginationTarget = qs(`[dev-target="all-tab-pagination_wrapper"]`);

    const { curPage, nextPage, prevPage, itemsReceived } = insight;
    const paginationWrapper = paginationTarget.closest(
      `[dev-target="insight-pagination-wrapper"]`
    );
    const pagination = paginationTemplate.cloneNode(true) as HTMLDivElement;
    const prevBtn = pagination.querySelector(
      `[dev-target=pagination-previous]`
    ) as HTMLButtonElement;
    const nextBtn = pagination.querySelector(
      `[dev-target=pagination-next]`
    ) as HTMLButtonElement;
    const pageItemWrapper = pagination.querySelector(
      `[dev-target=pagination-number-wrapper]`
    ) as HTMLDivElement;
    // const pageItem = pagination
    //   .querySelector(`[dev-target=page-number-temp]`)
    //   ?.cloneNode(true) as HTMLButtonElement;

    paginationTarget.innerHTML = "";
    pageItemWrapper.innerHTML = "";

    if (itemsReceived === 0) {
      paginationTarget?.classList.add("hide");
      paginationWrapper
        ?.querySelector(`[dev-tab-empty-state]`)
        ?.classList.remove("hide");
    } else {
      paginationTarget?.classList.remove("hide");
      paginationWrapper
        ?.querySelector(`[dev-tab-empty-state]`)
        ?.classList.add("hide");
    }

    // if (pageTotal <= 6) {
    //   for (let i = 1; i <= pageTotal; i++) {
    //     const pageNumItem = pageItem.cloneNode(true) as HTMLDivElement;
    //     pageNumItem.textContent = i.toString();
    //     pageNumItem.classList[curPage === i ? "add" : "remove"]("active");
    //     pageNumItem.addEventListener("click", () => {
    //       paginationWrapper?.scrollTo({
    //         top: 0,
    //         behavior: "smooth",
    //       });
    //       window.scrollTo({
    //         top: 0,
    //         behavior: "smooth",
    //       });
    //       getEventInsights(eventSlug, { page: i });
    //       //   getInsights(endPoint, { page: i }, tagTarget);
    //     });
    //     pageItemWrapper.appendChild(pageNumItem);
    //   }
    // } else {
    //   const firstPageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
    //   firstPageNumItem.textContent = "1";
    //   firstPageNumItem.classList[curPage === 1 ? "add" : "remove"]("active");
    //   firstPageNumItem.addEventListener("click", () => {
    //     paginationWrapper?.scrollTo({
    //       top: 0,
    //       behavior: "smooth",
    //     });
    //     window.scrollTo({
    //       top: 0,
    //       behavior: "smooth",
    //     });
    //     getEventInsights(eventSlug, { page: 1 });
    //     // getInsights(endPoint, { page: 1 }, tagTarget);
    //   });
    //   pageItemWrapper.appendChild(firstPageNumItem);

    //   if (curPage > 3) {
    //     const pagItemDots = pageItem.cloneNode(true) as HTMLButtonElement;
    //     pagItemDots.textContent = "...";
    //     pagItemDots.classList["add"]("not-allowed");
    //     pageItemWrapper.appendChild(pagItemDots);
    //   }

    //   for (
    //     let i = Math.max(2, curPage - 1);
    //     i <= Math.min(curPage + 1, pageTotal - 1);
    //     i++
    //   ) {
    //     const pageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
    //     pageNumItem.classList[curPage === i ? "add" : "remove"]("active");
    //     pageNumItem.textContent = i.toString();
    //     pageNumItem.addEventListener("click", () => {
    //       paginationWrapper?.scrollTo({
    //         top: 0,
    //         behavior: "smooth",
    //       });
    //       window.scrollTo({
    //         top: 0,
    //         behavior: "smooth",
    //       });
    //       getEventInsights(eventSlug, { page: i });
    //       //   getInsights(endPoint, { page: i }, tagTarget);
    //     });
    //     pageItemWrapper.appendChild(pageNumItem);
    //   }

    //   if (curPage < pageTotal - 2) {
    //     const pagItemDots = pageItem.cloneNode(true) as HTMLButtonElement;
    //     pagItemDots.textContent = "...";
    //     pagItemDots.classList["add"]("not-allowed");
    //     pageItemWrapper.appendChild(pagItemDots);
    //   }

    //   const pageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
    //   pageNumItem.textContent = pageTotal.toString();
    //   pageNumItem.classList[curPage === pageTotal ? "add" : "remove"]("active");
    //   pageNumItem.addEventListener("click", () => {
    //     paginationWrapper?.scrollTo({
    //       top: 0,
    //       behavior: "smooth",
    //     });
    //     window.scrollTo({
    //       top: 0,
    //       behavior: "smooth",
    //     });
    //     getEventInsights(eventSlug, { page: 1 });
    //   });
    //   pageItemWrapper.appendChild(pageNumItem);
    // }

    prevBtn.classList[prevPage ? "remove" : "add"]("disabled");
    nextBtn.classList[nextPage ? "remove" : "add"]("disabled");

    nextPage &&
      nextBtn.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getEventInsights(eventSlug, { page: curPage + 1 });
      });
    prevPage &&
      prevBtn.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getEventInsights(eventSlug, { page: curPage - 1 });
        // getInsights(endPoint, { page: curPage - 1 }, tagTarget);
      });
    // pagination.style.display = pageTotal === 1 ? "none" : "flex";

    if (nextPage === null && prevPage === null) {
      paginationTarget?.classList.add("hide");
    }
    paginationTarget.appendChild(pagination);
  }

  function initInsights(
    insights: PersonInsightResponse,
    target: HTMLDivElement,
    userFollowingAndFavourite: UserFollowingAndFavourite
  ) {
    insights.items.forEach((insight) => {
      const newInsight = insightTemplate.cloneNode(true) as HTMLDivElement;

      const insightDateWrap = newInsight.querySelector<HTMLDivElement>(
        `[dev-target=insight-date-wrap]`
      );
      const searchTextDiv = newInsight.querySelector<HTMLDivElement>(
        `[dev-target=search-text]`
      );
      const searchListWrap = newInsight.querySelector<HTMLDivElement>(
        `[dev-target=search-list-wrap]`
      );
      const searchCount = searchListWrap!.querySelector<HTMLDivElement>(
        `[dev-target=search-count]`
      );
      const searchResultList = searchListWrap!.querySelector<HTMLDivElement>(
        `[dev-target=search-result-list]`
      );
      const searchResultListWrapper =
        searchListWrap!.querySelector<HTMLDivElement>(
          `[dev-target="search-result-list-wrapper"]`
        );
      const searchResultItem = searchListWrap!.querySelector<HTMLDivElement>(
        `[dev-template=search-result-item]`
      );

      const tagsWrapperTarget = newInsight.querySelector<HTMLDivElement>(
        `[dev-target=tags-container]`
      );

      const companyLink = newInsight.querySelector(`[dev-target=company-link]`);
      const companyImage = newInsight.querySelector<HTMLImageElement>(
        `[dev-target=company-image]`
      );
      const insightNameTarget = newInsight.querySelector(
        `[dev-target=insight-name]`
      );
      const insightLink = newInsight.querySelector(`[dev-target=insight-link]`);
      const curatedDateTargetWrapper = newInsight.querySelector(
        `[dev-target="curated-date-wrapper"]`
      );
      const curatedDateTarget = newInsight.querySelector(
        `[dev-target="curated-date"]`
      );
      const publishedDateTargetWrapper = newInsight.querySelectorAll(
        `[dev-target="published-date-wrapper"]`
      );
      const publishedDateTarget = newInsight.querySelector(
        `[dev-target="published-date"]`
      );
      const sourceTargetWrapper = newInsight.querySelector(
        `[dev-target="source-name-link-wrapper"]`
      );
      const sourceTarget = newInsight.querySelector(
        `[dev-target="source-name-link"]`
      );
      const sourceAuthorTargetWrapper = newInsight.querySelectorAll(
        `[dev-target="source-author-wrapper"]`
      );
      const sourceAuthorTarget = newInsight.querySelector(
        `[dev-target="source-author"]`
      );

      const curatedDate = insight.curated
        ? formatCuratedDate(insight.curated)
        : "";
      const publishedDate = insight["source-publication-date"]
        ? formatPublishedDate(insight["source-publication-date"])
        : "";
      const sourceCatArray = insight.source_category_id;
      const companyTypeArray = insight.company_type_id;
      const insightClassArray = insight.insight_classification_id;
      // const lineOfBusArray = insight.line_of_business_id;
      const techCatArray = insight.technology_category_id;

      if (insightDateWrap) insightDateWrap.style.display = "flex";
      if (searchTextDiv) searchTextDiv.style.display = "none";
      if (searchListWrap) searchListWrap.style.display = "none";

      const searchList = getHighlightedSentences(
        insight["insight-detail"] ?? "",
        searchObject.search,
        5,
        30,
        true
      );
      searchResultList!.innerHTML = "";
      searchCount!.textContent = `${searchList.length}`;
      if (searchList.length > 0) {
        if (searchListWrap) searchListWrap.style.display = "flex";
        searchList.forEach((item) => {
          const newSearchResultItem = searchResultItem!.cloneNode(
            true
          ) as HTMLDivElement;
          const searchResultCount = newSearchResultItem.querySelector(
            "[dev-template-number]"
          ) as HTMLDivElement;
          const searchResultText = newSearchResultItem.querySelector(
            "[dev-template-text]"
          ) as HTMLDivElement;
          searchResultCount!.textContent = `${searchList.indexOf(item) + 1}`;
          searchResultText.innerHTML = highlightQueryInText(
            item,
            searchObject.search
          );
          searchResultText.setAttribute(
            "href",
            `${route}/insight/${insight.slug}`
          );
          searchResultText.setAttribute("target", "_blank");
          searchResultList!.appendChild(newSearchResultItem);
        });
      }
      if (searchResultListWrapper) searchResultListWrapper.style.height = "0px";
      if (searchListWrap) searchAccordionLogic(searchListWrap);

      const companyInputs = newInsight.querySelectorAll<HTMLInputElement>(
        `[dev-target=company-input]`
      );
      companyInputs.forEach((companyInput) => {
        fakeCheckboxToggle(companyInput!);
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
        companyInput && followFavouriteLogic(companyInput);
        companyInput &&
          setCheckboxesInitialState(
            companyInput,
            convertArrayOfObjToNumber(
              userFollowingAndFavourite.user_following.company_id
            )
          );
      });
      const favouriteInputs = newInsight.querySelectorAll<HTMLInputElement>(
        `[dev-target=favourite-input]`
      );
      favouriteInputs.forEach((favouriteInput) => {
        fakeCheckboxToggle(favouriteInput!);

        favouriteInput?.setAttribute("dev-input-type", "favourite");
        favouriteInput?.setAttribute("dev-input-id", insight.id.toString());

        favouriteInput && followFavouriteLogic(favouriteInput);

        favouriteInput &&
          setCheckboxesInitialState(
            favouriteInput,
            userFollowingAndFavourite.user_favourite.insight_id
          );
      });

      addTagsToInsight(
        searchObject.search,
        sourceCatArray,
        tagsWrapperTarget!,
        false
      );
      addTagsToInsight(
        searchObject.search,
        companyTypeArray,
        tagsWrapperTarget!,
        false
      );
      addTagsToInsight(
        searchObject.search,
        insightClassArray,
        tagsWrapperTarget!,
        false
      );
      // addTagsToInsight(lineOfBusArray, tagsWrapperTarget!, false);
      addTagsToInsight(
        searchObject.search,
        techCatArray,
        tagsWrapperTarget!,
        true,
        "technology_category_id"
      );

      if (insight.company_details && insight.company_details.company_logo) {
        companyImage!.src = insight.company_details.company_logo.url;
      } else if (
        insight.company_details &&
        insight.company_details["company-website"]
      ) {
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
      insightNameTarget!.innerHTML = highlightQueryInText(
        insight.name,
        searchObject.search
      );
      curatedDateTargetWrapper?.classList[curatedDate ? "remove" : "add"](
        "hide"
      );
      curatedDateTarget!.textContent = curatedDate ?? "";
      publishedDateTarget!.textContent = publishedDate ?? "";
      publishedDateTargetWrapper.forEach((item) =>
        item.classList[publishedDate ? "remove" : "add"]("hide")
      );
      insightLink!.setAttribute("href", `${route}/insight/` + insight.slug);
      sourceTarget!.setAttribute("href", insight["source-url"]);
      sourceTargetWrapper?.classList[insight["source-url"] ? "remove" : "add"](
        "hide"
      );
      companyLink!.setAttribute(
        "href",
        `${route}/company/` + insight.company_details.slug
      );
      sourceTarget!.textContent = insight.source;
      sourceAuthorTargetWrapper.forEach((item) =>
        item.classList[insight.source_author ? "remove" : "add"]("hide")
      );
      sourceAuthorTarget!.textContent = insight.source_author;
      target.appendChild(newInsight);
    });
  }

  const searchDebounce = debounce(insightSearch, 500);

  function insightSearch(
    eventSlug: string,
    cb1?: () => void,
    cb2?: () => void
  ) {
    cb1 && cb1();
    getEventInsights(eventSlug, {
      orderBy: sortObject.orderBy,
      sortBy: sortObject.sortBy,
    }).then((res) => {
      cb2 && cb2();
    });
  }

  function followFavouriteLogic(input: HTMLInputElement) {
    input.addEventListener("change", async () =>
      followFavouriteDebounce(input)
    );
  }

  const followFavouriteDebounce = debounce(followFavouriteListener, 300);

  async function followFavouriteListener(input: HTMLInputElement) {
    const type = input.getAttribute("dev-input-type")!;
    const id = input.getAttribute("dev-input-id")!;
    const endPoint =
      type === "favourite" ? "/toggle-favourite" : "/toggle-follow";
    try {
      await xano_userFeed.get(endPoint, {
        id: Number(id),
        target: type,
      });
      await getUserFollowingAndFavourite();
      // run function to updated all-tab inputs

      allTabsTarget.childNodes.forEach((insight) => {
        updateInsightsInputs(insight as HTMLDivElement);
      });
    } catch (error) {
      console.error(`followFavouriteLogic${endPoint}_error`, error);
      return null;
    }
  }

  function sortLogicInit(eventSlug: string) {
    const sortItems = qsa<HTMLLinkElement>(`[dev-target="sort"]`);
    sortItems.forEach((item) => {
      item.addEventListener("click", () => {
        sortItems.forEach((sortItem) => {
          sortItem.classList.remove("active");
        });
        item.classList.add("active");
        const value = item.textContent;
        qs(`[dev-target=sorted-item-name]`).textContent = value;
        const orderBy = item.getAttribute("dev-orderby");
        const sortBy = item.getAttribute("dev-sortby");

        if (sortBy && orderBy) {
          sortObject.sortBy = sortBy;
          sortObject.orderBy = orderBy;
        }

        getEventInsights(eventSlug, {});
      });
    });
  }

  async function getFilters(
    endPoint:
      | "/company_type"
      | "/insight_classification"
      | "/line_of_business"
      | "/source_category"
      | "/technology_category",
    payload: { page?: number; perPage?: number; offset?: number },
    type:
      | "companyType"
      | "sourceCat"
      | "techCat"
      | "lineOfBus"
      | "insightClass",
    targetWrapper: HTMLDivElement,
    eventSlug: string
  ) {
    const { page = 0, perPage = 0, offset = 0 } = payload;
    try {
      const res = await xano_individual_pages.get(endPoint, {
        page,
        perPage,
        offset,
        type: {
          event: {
            slug: eventSlug,
            value: true,
          },
        },
      });
      const filters = res.getBody() as FilterResponse[];
      filters.forEach((filter) => {
        const newFilter = checkboxItemTemplate.cloneNode(
          true
        ) as HTMLDivElement;
        const input =
          newFilter.querySelector<HTMLInputElement>("[dev-target=input]");
        input && fakeCheckboxToggle(input);
        input?.addEventListener("change", () => {
          if (input.checked) {
            searchObject.checkboxes[type].push(filter.id);
          } else {
            searchObject.checkboxes[type] = searchObject.checkboxes[
              type
            ].filter((item) => item != filter.id);
          }
          searchDebounce(eventSlug);
        });
        newFilter.querySelector("[dev-target=name]")!.textContent = filter.name;
        targetWrapper.appendChild(newFilter);
      });
      return filters;
    } catch (error) {
      console.error(`getFilters_${endPoint}_error`, error);
      return null;
    }
  }

  function updateInsightsInputs(insight: HTMLDivElement) {
    const companyInputs = insight.querySelectorAll<HTMLInputElement>(
      `[dev-input-type="company_id"]`
    );
    companyInputs.forEach((companyInput) => {
      companyInput &&
        setCheckboxesInitialState(
          companyInput,
          convertArrayOfObjToNumber(
            userFollowingAndFavourite?.user_following.company_id!
          )
        );
    });
    const favorites = insight.querySelectorAll<HTMLInputElement>(
      `[dev-input="fav-insight"]`
    );
    favorites.forEach((favourite) => {
      favourite &&
        setCheckboxesInitialState(
          favourite,
          userFollowingAndFavourite?.user_favourite.insight_id!
        );
    });
    const tagInputs = insight.querySelectorAll<HTMLInputElement>(
      `[dev-input-type="technology_category_id"]`
    );

    tagInputs?.forEach((tag) => {
      setCheckboxesInitialState(
        tag,
        convertArrayOfObjToNumber(
          userFollowingAndFavourite?.user_following.technology_category_id!
        )
      );
    });
  }

  async function getEvent(slug: string) {
    try {
      const res = await xano_individual_pages.get("/event", {
        slug,
      });
      const event = res.getBody() as Event;
      if (event === null) {
        window.location.href = "/404";
        return null;
      }
      qs("title").textContent = event.name;
      console.log("event", event);

      eventCards.forEach((eventCard) => {
        const eventName = eventCard.querySelector<HTMLHeadingElement>(
          `[dev-target=event-name]`
        );
        const eventDatesWrapper = eventCard.querySelector<HTMLHeadingElement>(
          `[dev-target=dates-wrapper]`
        );
        const eventVenueWrapper = eventCard.querySelector<HTMLHeadingElement>(
          `[dev-target=venue-wrapper]`
        );
        const eventCityWrapper = eventCard.querySelector<HTMLHeadingElement>(
          `[dev-target=city-wrapper]`
        );
        const eventDesc = eventCard.querySelector(`[dev-target=richtext]`);

        const eventImageWrapper = eventCard.querySelector(
          `[dev-target=event-image-wrapper]`
        );
        // const eventImageLink =
        //   eventImageWrapper?.querySelector<HTMLLinkElement>(
        //     `[dev-target=event-picture-link]`
        //   );
        const eventImage = eventImageWrapper?.querySelector<HTMLImageElement>(
          `[dev-target=event-image]`
        );
        const eventInput = eventImageWrapper?.querySelector<HTMLInputElement>(
          `[dev-target=event-input]`
        );

        eventName!.textContent = event.name;
        eventDesc!.innerHTML = event["event-description"];

        if (event.image && event.image.url && eventImage) {
          eventImage.src = event.image.url;
        }

        if (event["event-start-date"]) {
          const eventStartDate = new Date(event["event-start-date"]);
          const month = eventStartDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const day = eventStartDate.getUTCDate().toString();
          eventDatesWrapper!.querySelector("[dev-start-month]")!.textContent =
            month;
          eventDatesWrapper!.querySelector("[dev-start-day]")!.textContent =
            day;
        } else {
          eventVenueWrapper?.classList.add("hide");
        }
        if (event["event-end-date"]) {
          const eventEndDate = new Date(event["event-end-date"]);
          const month = eventEndDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const day = eventEndDate.getUTCDate().toString();
          const year = eventEndDate.toLocaleDateString("en-US", {
            year: "numeric",
          });
          eventDatesWrapper!.querySelector("[dev-end-month]")!.textContent =
            month;
          eventDatesWrapper!.querySelector("[dev-end-day]")!.textContent = day;
          eventDatesWrapper!.querySelector("[dev-end-year]")!.textContent =
            year;
        } else {
          // eventVenueWrapper?.classList.add("hide")
        }
        if (event["event-venue-name"]) {
          eventVenueWrapper!.querySelector(
            `[dev-target=venue-name]`
          )!.textContent = event["event-venue-name"];
        } else {
          eventVenueWrapper?.classList.add("hide");
        }
        if (event["event-city-state"]) {
          eventCityWrapper!.querySelector(
            `[dev-target=city-name]`
          )!.textContent = event["event-city-state"];
        } else {
          eventCityWrapper?.classList.add("hide");
        }

        cardSkeletons.forEach((cardSkeleton) => cardSkeleton.remove());
        eventCard.classList.remove("dev-hide");

        fakeCheckboxToggle(eventInput!);
        eventInput?.setAttribute("dev-input-type", "event_id");
        eventInput?.setAttribute("dev-input-id", event.id.toString());
        eventInput && followFavouriteLogic(eventInput);
        eventInput &&
          setCheckboxesInitialState(
            eventInput,
            convertArrayOfObjToNumber(
              userFollowingAndFavourite!.user_following.event_id
            )
          );
      });
      eventDetails.forEach((item) => {
        item.classList.remove("opacity-hide");
      });

      return event;
    } catch (error) {
      console.log("getEvent_error", error);
      return null;
    }
  }

  function setCheckboxesInitialState(
    input: HTMLInputElement,
    slugArray: number[]
  ) {
    const inputId = input.getAttribute("dev-input-id");

    if (slugArray.includes(Number(inputId))) {
      input.checked = true;
      input
        .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
        ?.classList.add("checked");
    } else {
      input.checked = false;
      input
        .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
        ?.classList.remove("checked");
    }
  }

  function addTagsToInsight(
    query: string,
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
        showCheckbox && tagInput && fakeCheckboxToggle(tagInput);
        showCheckbox &&
          type &&
          tagInput &&
          tagInput.setAttribute("dev-input-type", type);
        showCheckbox &&
          tagInput &&
          tagInput.setAttribute("dev-input-id", item.id.toString());
        showCheckbox && tagInput && followFavouriteLogic(tagInput);
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
          anchor.href = `${route}/technology/${item.slug}`;
          anchor.innerHTML = highlightQueryInText(tagSpan!.textContent!, query);
          anchor.style.cursor = "pointer";
          anchor.classList.add("tag-span-name");
          tagSpan?.replaceWith(anchor);
        }

        if (tagCheckbox && !showCheckbox) {
          tagCheckbox.style.display = "none";
        }
        if (showCheckbox && tagInput && userFollowingAndFavourite) {
          setCheckboxesInitialState(
            tagInput,
            convertArrayOfObjToNumber(
              userFollowingAndFavourite?.user_following.technology_category_id
            )
          );
        }

        targetWrapper?.appendChild(newTag);
      }
    });
  }

  function formatPublishedDate(inputDate: Date) {
    const date = new Date(inputDate);
    return `${date.toLocaleString("default", {
      month: "long",
      timeZone: "UTC",
    })} ${date.getUTCDate()}, ${date.getFullYear()}`;
  }

  // Function to toggle fake checkboxes
  function fakeCheckboxToggle(input: HTMLInputElement) {
    input.addEventListener("change", () => {
      const inputWrapper = input.closest(
        "[dev-fake-checkbox-wrapper]"
      ) as HTMLDivElement;
      inputWrapper.classList[input.checked ? "add" : "remove"]("checked");
    });
  }

  function convertArrayOfObjToNumber(data: { id: number }[]) {
    return data.map((item) => item.id);
  }

  function getHighlightedSentences(
    text: string,
    query: string,
    maxSentences: number,
    maxWords?: number,
    stripHtml: boolean = false
  ): string[] {
    if (
      !text ||
      !query ||
      typeof text !== "string" ||
      typeof query !== "string"
    ) {
      return [];
    }

    if (stripHtml) {
      text = text.replace(/<[^>]+>/g, "");
    }

    let sentences = text.match(/[^.!?]+[.!?]/g);
    if (!sentences) {
      sentences = [text];
    }

    // Extract quoted phrases and unquoted words
    const phraseRegex = /(["'])(.*?)\1/g;
    const phrases: string[] = [];
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      if (match[2]) phrases.push(match[2]);
    }

    // Remove quoted phrases from query
    const queryWithoutQuotes = query.replace(phraseRegex, "");
    const individualWords = queryWithoutQuotes.split(/\s+/).filter(Boolean);

    const allQueryParts = [...phrases, ...individualWords];

    const escapedQueryWords = allQueryParts.map((word) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()
    );

    const regex = new RegExp(`(${escapedQueryWords.join("|")})`, "gi");
    const highlighted: string[] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (escapedQueryWords.some((word) => lowerSentence.includes(word))) {
        let snippet = sentence.trim();

        if (maxWords) {
          const words = snippet.split(/\s+/);
          const matchIndex = words.findIndex((word) =>
            escapedQueryWords.some((q) => word.toLowerCase().includes(q))
          );

          let snippetStart = 0;
          if (matchIndex !== -1) {
            snippetStart = Math.max(0, matchIndex - Math.floor(maxWords / 2));
          }

          const snippetWords = words.slice(
            snippetStart,
            snippetStart + maxWords
          );
          snippet = snippetWords.join(" ");
          if (snippetStart + maxWords < words.length) {
            snippet += "...";
          }
        }

        const highlightedSnippet = snippet.replace(
          regex,
          "<mark class='highlight'>$1</mark>"
        );

        highlighted.push(highlightedSnippet);

        if (highlighted.length === maxSentences) break;
      }
    }

    return highlighted;
  }
  function highlightQueryInText(text: string, query: string): string {
    if (
      !text ||
      !query ||
      typeof text !== "string" ||
      typeof query !== "string"
    ) {
      return text;
    }

    // Extract quoted phrases
    const phraseRegex = /(["'])(.*?)\1/g;
    const phrases: string[] = [];
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      if (match[2]) phrases.push(match[2]);
    }

    // Remove quoted phrases from query string
    const queryWithoutQuotes = query.replace(phraseRegex, "");
    const individualWords = queryWithoutQuotes
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean);

    // Combine all query parts
    const allQueryParts = [...phrases, ...individualWords];

    if (allQueryParts.length === 0) return text;

    // Escape special characters for regex
    const escapedParts = allQueryParts.map((word) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    // Create regex for whole words/phrases
    const regex = new RegExp(`(${escapedParts.join("|")})`, "gi");

    // Replace matches with <mark>
    return text.replace(regex, "<mark class='highlight'>$1</mark>");
  }
  function searchAccordionLogic(item: HTMLDivElement) {
    const trigger = item.querySelector<HTMLDivElement>(
      '[dev-target="search-list-trigger"]'
    );
    const triggerIcon = trigger?.querySelector(`svg`)!;
    const wrapper = item.querySelector<HTMLDivElement>(
      '[dev-target="search-result-list-wrapper"]'
    );
    const content = item.querySelector<HTMLDivElement>(
      '[dev-target="search-result-list"]'
    );
    // const defaultHeight = content?.scrollHeight ?? 100;
    // if (wrapper) wrapper.style.height = defaultHeight + "px";
    if (wrapper) wrapper.style.height = "0px";
    triggerIcon.style.rotate = "180deg";

    let isOpen = false;

    trigger?.addEventListener("click", function () {
      if (!isOpen) {
        const fullHeight = content?.scrollHeight ?? 100;
        if (wrapper) wrapper.style.height = fullHeight + "px";
        triggerIcon.style.rotate = "0deg";
        isOpen = true;
      } else {
        if (wrapper) wrapper.style.height = "0px";
        triggerIcon.style.rotate = "180deg";
        isOpen = false;
      }
    });
  }
}

interface Event {
  id: number;
  created_at: string;
  name: string;
  slug: string;
  "event-start-date": string;
  "event-end-date": string;
  "event-city-state": string;
  "event-venue-name": string;
  people_id: number[];
  "event-description": string;
  image: null | { url: string };
}
