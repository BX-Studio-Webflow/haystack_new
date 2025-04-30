import {
  type FilterResponse,
  type Insight,
  type InsightPayload,
  type SearchObject,
  type UserFollowingAndFavourite,
} from "../../types/index";
import { XanoClient } from "@xano/js-sdk";
import { debounce, formatCuratedDate, qs, qsa } from "../../utils";
export async function userFeedCode({
  dataSource,
}: {
  dataSource: "live" | "dev";
}) {
  const route = dataSource === "dev" ? "/dev" : "";
  const xano_userFeed = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:Hv8ldLVU",
  }).setDataSource(dataSource);
  const xano_wmx = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:6Ie7e140",
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

  let userFollowingAndFavourite: UserFollowingAndFavourite | null = null;
  let xanoToken: string | null = null;

  const insightSearchInput = qs<HTMLInputElement>("[dev-search-target]");
  const insightFilterForm = qs<HTMLFormElement>("[dev-target=filter-form]");
  const insightClearFilters = qs<HTMLFormElement>("[dev-target=clear-filters]");
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });

  const insightTemplate = qs(`[dev-template="insight-item"]`);
  const insightTagTemplate = qs(`[dev-template="insight-tag"]`);
  const checkboxItemTemplate = qs(`[dev-template="checkbox-item"]`);
  const followingItemTemplate = qs(`[dev-template="following-item"]`);

  const allTabsTarget = qs(`[dev-target="insight-all"]`);
  const followingTabsTarget = qs(`[dev-target="insight-following"]`);
  const favouriteTabsTarget = qs(`[dev-target="insight-favourite"]`);

  const followingCompanyTarget = qsa(`[dev-target="following-companies"]`);
  const followingTechCatTarget = qsa(`[dev-target="following-tech-cat"]`);
  const followingPeopleTarget = qsa(`[dev-target="following-people"]`);
  const followingEventsTarget = qsa(`[dev-target="following-events"]`);

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

  const lsInsights = localStorage.getItem("insights");
  const lsFollowingInsights = localStorage.getItem("insightsFollowing");
  const lsFavouriteInsights = localStorage.getItem("insightsFavourite");
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
  if (lsInsights) {
    userFollowingAndFavourite &&
      initInsights(
        JSON.parse(lsInsights) as Insight,
        allTabsTarget,
        userFollowingAndFavourite
      );
    paginationLogic(JSON.parse(lsInsights) as Insight, "all");
  }
  if (lsFollowingInsights) {
    userFollowingAndFavourite &&
      initInsights(
        JSON.parse(lsFollowingInsights) as Insight,
        followingTabsTarget,
        userFollowingAndFavourite
      );
    paginationLogic(JSON.parse(lsFollowingInsights) as Insight, "following");
  }
  if (lsFavouriteInsights) {
    userFollowingAndFavourite &&
      initInsights(
        JSON.parse(lsFavouriteInsights) as Insight,
        favouriteTabsTarget,
        userFollowingAndFavourite
      );
    paginationLogic(JSON.parse(lsFavouriteInsights) as Insight, "favourite");
  }

  if (xanoToken) {
    xano_userFeed.setAuthToken(xanoToken);
    getXanoAccessToken(memberStackUserToken);
  } else {
    await getXanoAccessToken(memberStackUserToken);
  }
  lsUserFollowingFavourite
    ? getUserFollowingAndFavourite()
    : await getUserFollowingAndFavourite();
  userFeedInit();

  function userFeedInit() {
    insightFilterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    insightSearchInput.addEventListener("input", () => {
      searchObject.search = insightSearchInput.value;
      searchDebounce();
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

    getInsights("/insight-all-tab", {}, allTabsTarget);
    getInsights("/insight-following-tab", {}, followingTabsTarget);
    getInsights("/insight-favourite-tab", {}, favouriteTabsTarget);

    getFilters("/company_type", {}, "companyType", filterCompanyTypeTarget);
    getFilters("/source_category", {}, "sourceCat", filterSourceCatTarget);
    getFilters("/technology_category", {}, "techCat", filterTechCatTarget);
    // getFilters("/line_of_business", {}, "lineOfBus", filterLineOfBusTarget);
    getFilters(
      "/insight_classification",
      {},
      "insightClass",
      filterInsightClassTarget
    );

    sortLogicInit();
  }

  // async function getUser

  async function getXanoAccessToken(memberstackToken: string) {
    try {
      const res = await xano_wmx.post("/auth-user", {
        memberstack_token: memberstackToken,
      });
      const xanoAuthToken = res.getBody().authToken as string;
      xano_userFeed.setAuthToken(xanoAuthToken);
      return xanoAuthToken;
    } catch (error) {
      console.log("getXanoAccessToken_error", error);
      return null;
    }
  }
  async function getInsights(
    endPoint:
      | "/insight-all-tab"
      | "/insight-favourite-tab"
      | "/insight-following-tab",
    payload: InsightPayload,
    target: HTMLDivElement
  ) {
    const { page = 0, perPage = 0, offset = 0 } = payload;
    try {
      const res = await xano_userFeed.get(endPoint, {
        page,
        perPage,
        offset,
        sortBy: sortObject.sortBy,
        orderBy: sortObject.orderBy,
        filtering: searchObject,
      });
      const insights = res.getBody() as Insight;
      target.innerHTML = "";

      if (
        endPoint === "/insight-all-tab" &&
        page === 0 &&
        perPage === 0 &&
        offset === 0 &&
        searchObject.search === "" &&
        searchObject.checkboxes?.companyType?.length === 0 &&
        searchObject.checkboxes?.sourceCat?.length === 0 &&
        searchObject.checkboxes?.techCat?.length === 0 &&
        searchObject.checkboxes?.lineOfBus?.length === 0 &&
        searchObject.checkboxes?.insightClass?.length === 0 &&
        sortObject.sortBy === "created_at" &&
        sortObject.orderBy === "desc"
      ) {
        localStorage.setItem("insights", JSON.stringify(insights));
      }
      if (
        endPoint === "/insight-following-tab" &&
        page === 0 &&
        perPage === 0 &&
        offset === 0 &&
        searchObject.search === "" &&
        searchObject.checkboxes?.companyType?.length === 0 &&
        searchObject.checkboxes?.sourceCat?.length === 0 &&
        searchObject.checkboxes?.techCat?.length === 0 &&
        searchObject.checkboxes?.lineOfBus?.length === 0 &&
        searchObject.checkboxes?.insightClass?.length === 0 &&
        sortObject.sortBy === "created_at" &&
        sortObject.orderBy === "desc"
      ) {
        localStorage.setItem("insightsFollowing", JSON.stringify(insights));
      }
      if (
        endPoint === "/insight-favourite-tab" &&
        page === 0 &&
        perPage === 0 &&
        offset === 0 &&
        searchObject.search === "" &&
        searchObject.checkboxes?.companyType?.length === 0 &&
        searchObject.checkboxes?.sourceCat?.length === 0 &&
        searchObject.checkboxes?.techCat?.length === 0 &&
        searchObject.checkboxes?.lineOfBus?.length === 0 &&
        searchObject.checkboxes?.insightClass?.length === 0 &&
        sortObject.sortBy === "created_at" &&
        sortObject.orderBy === "desc"
      ) {
        localStorage.setItem("insightsFavourite", JSON.stringify(insights));
      }
      userFollowingAndFavourite &&
        initInsights(insights, target, userFollowingAndFavourite);

      endPoint === "/insight-all-tab" && paginationLogic(insights, "all");
      endPoint === "/insight-following-tab" &&
        paginationLogic(insights, "following");
      endPoint === "/insight-favourite-tab" &&
        paginationLogic(insights, "favourite");

      return insights;
    } catch (error) {
      console.error(`getInsights_${endPoint}_error`, error);
      return null;
    }
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
    targetWrapper: HTMLDivElement
  ) {
    const { page = 0, perPage = 0, offset = 0 } = payload;
    try {
      const res = await xano_userFeed.get(endPoint, {
        page,
        perPage,
        offset,
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
          searchDebounce();
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

  async function getUserFollowingAndFavourite() {
    try {
      const res = await xano_userFeed.get("/user-following-and-favourite");
      const followingAndFavourite = res.getBody() as UserFollowingAndFavourite;
      const { user_following } = followingAndFavourite;
      userFollowingAndFavourite = followingAndFavourite;
      localStorage.setItem(
        "user-following-favourite",
        JSON.stringify(followingAndFavourite)
      );

      followingSectionInit(
        user_following.company_id,
        "company_id",
        convertArrayOfObjToNumber(user_following.company_id),
        followingCompanyTarget
      );
      followingSectionInit(
        user_following.technology_category_id,
        "technology_category_id",
        convertArrayOfObjToNumber(user_following.technology_category_id),
        followingTechCatTarget
      );
      followingSectionInit(
        user_following.people_id,
        "people_id",
        convertArrayOfObjToNumber(user_following.people_id),
        followingPeopleTarget
      );
      followingSectionInit(
        user_following.event_id,
        "event_id",
        convertArrayOfObjToNumber(user_following.event_id),
        followingEventsTarget
      );
      return followingAndFavourite;
    } catch (error) {
      console.error(`getUserFollowingAndFavourite_error`, error);
      return null;
    }
  }

  function initInsights(
    insights: Insight,
    target: HTMLDivElement,
    userFollowingAndFavourite: UserFollowingAndFavourite
  ) {
    insights.items.forEach((insight) => {
      const newInsight = insightTemplate.cloneNode(true) as HTMLDivElement;

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
        // insight.company_id &&
        //   companyInput?.setAttribute(
        //     "dev-input-id",
        //     insight.company_id.toString()
        //   );
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

      addTagsToInsight(sourceCatArray, tagsWrapperTarget!, false);
      addTagsToInsight(companyTypeArray, tagsWrapperTarget!, false);
      addTagsToInsight(insightClassArray, tagsWrapperTarget!, false);
      // addTagsToInsight(lineOfBusArray, tagsWrapperTarget!, false);
      addTagsToInsight(
        techCatArray,
        tagsWrapperTarget!,
        true,
        "technology_category_id"
      );

      if (insight.company_details?.company_logo) {
        companyImage!.src = insight.company_details.company_logo.url;
      } else {
        if (
          insight.company_details &&
          insight.company_details["company-website"]
        ) {
          const imageUrl =
            "https://logo.clearbit.com/" +
            insight.company_details["company-website"];

          fetch(imageUrl)
            .then((response) => {
              if (response.ok) {
                companyImage!.src = imageUrl;
              } else {
                throw new Error("Failed to fetch company logo");
              }
            })
            .catch(() => {
              companyImage!.src =
                "https://uploads-ssl.webflow.com/64a2a18ba276228b93b991d7/64c7c26d6639a8e16ee7797f_Frame%20427318722.webp";
            });
        } else {
          companyImage!.src = "";
        }
      }

      insightNameTarget!.textContent = insight.name;
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
      insight.company_details?.slug &&
        companyLink!.setAttribute(
          "href",
          `${route}/company/` + insight.company_details?.slug
        );
      sourceTarget!.textContent = insight.source;
      sourceAuthorTargetWrapper.forEach((item) =>
        item.classList[insight.source_author ? "remove" : "add"]("hide")
      );
      sourceAuthorTarget!.textContent = insight.source_author;
      target.appendChild(newInsight);
    });
  }

  function sortLogicInit() {
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

        getInsights("/insight-all-tab", {}, allTabsTarget);
        getInsights("/insight-following-tab", {}, followingTabsTarget);
        getInsights("/insight-favourite-tab", {}, favouriteTabsTarget);
      });
    });
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
      //   console.log("userFollowingAndFavourite-1", userFollowingAndFavourite);
      await getUserFollowingAndFavourite();
      // run function to updated all-tab inputs
      //   console.log("userFollowingAndFavourite-2", userFollowingAndFavourite);

      allTabsTarget.childNodes.forEach((insight) => {
        // console.log("insights",insight)
        updateInsightsInputs(insight as HTMLDivElement);
      });

      // refetch following and favourite tabs
      getInsights("/insight-following-tab", {}, followingTabsTarget);
      getInsights("/insight-favourite-tab", {}, favouriteTabsTarget);
    } catch (error) {
      console.error(`followFavouriteLogic${endPoint}_error`, error);
      return null;
    }
  }

  function formatPublishedDate(inputDate: Date) {
    const date = new Date(inputDate);
    return `${date.toLocaleString("default", {
      month: "long",
      timeZone: "UTC",
    })} ${date.getUTCDate()}, ${date.getFullYear()}`;
  }

  function followFavouriteLogic(input: HTMLInputElement) {
    input.addEventListener("change", async () =>
      followFavouriteDebounce(input)
    );
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

  function updateInsightsInputs(insight: HTMLDivElement) {
    const tagInputs = insight.querySelectorAll<HTMLInputElement>(
      `[dev-input-type="technology_category_id"]`
    );
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

    tagInputs?.forEach((tag) => {
      setCheckboxesInitialState(
        tag,
        convertArrayOfObjToNumber(
          userFollowingAndFavourite?.user_following.technology_category_id!
        )
      );
    });
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
    tagArray?.forEach((item) => {
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
          anchor.textContent = tagSpan!.textContent;
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

  function paginationLogic(
    insight: Insight,
    target: "all" | "following" | "favourite"
  ) {
    let endPoint:
      | "/insight-all-tab"
      | "/insight-following-tab"
      | "/insight-favourite-tab";
    let paginationTarget: HTMLDivElement;
    let tagTarget: HTMLDivElement;
    if (target === "all") {
      endPoint = "/insight-all-tab";
      paginationTarget = qs(`[dev-target="all-tab-pagination_wrapper"]`);
      tagTarget = allTabsTarget;
    } else if (target === "following") {
      endPoint = "/insight-following-tab";
      paginationTarget = qs(`[dev-target="following-tab-pagination_wrapper"]`);
      tagTarget = followingTabsTarget;
    } else {
      endPoint = "/insight-favourite-tab";
      paginationTarget = qs(`[dev-target="favourite-tab-pagination_wrapper"]`);
      tagTarget = favouriteTabsTarget;
    }

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
    //       getInsights(endPoint, { page: i }, tagTarget);
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
    //     getInsights(endPoint, { page: 1 }, tagTarget);
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
    //       getInsights(endPoint, { page: i }, tagTarget);
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
    //     getInsights(endPoint, { page: pageTotal }, tagTarget);
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
        getInsights(endPoint, { page: curPage + 1 }, tagTarget);
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
        getInsights(endPoint, { page: curPage - 1 }, tagTarget);
      });
    // pagination.style.display = pageTotal === 1 ? "none" : "flex";

    if (nextPage === null && prevPage === null) {
      paginationTarget?.classList.add("hide");
    }
    paginationTarget.appendChild(pagination);
  }

  function insightSearch() {
    getInsights(
      "/insight-all-tab",
      {
        orderBy: sortObject.orderBy,
        sortBy: sortObject.sortBy,
      },
      allTabsTarget
    );
    getInsights(
      "/insight-following-tab",
      {
        orderBy: sortObject.orderBy,
        sortBy: sortObject.sortBy,
      },
      followingTabsTarget
    );
    getInsights(
      "/insight-favourite-tab",
      {
        orderBy: sortObject.orderBy,
        sortBy: sortObject.sortBy,
      },
      favouriteTabsTarget
    );
  }

  const searchDebounce = debounce(insightSearch, 500);

  function followingSectionInit(
    userFollowing: {
      id: number;
      name: string;
      slug: string;
    }[],
    inputType:
      | "company_id"
      | "technology_category_id"
      | "people_id"
      | "event_id",
    slugArray: number[],
    followingTargets: NodeListOf<HTMLDivElement>
  ) {
    followingTargets.forEach((followingTarget) => {
      followingTarget.innerHTML = "";
      userFollowing
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
        .forEach((item) => {
          const newFollowingItem = followingItemTemplate.cloneNode(
            true
          ) as HTMLDivElement;
          if (inputType === "company_id") {
            newFollowingItem
              .querySelector("[dev-target=link]")
              ?.setAttribute("href", `${route}/company/` + item.slug);
          }
          if (inputType === "event_id") {
            newFollowingItem
              .querySelector("[dev-target=link]")
              ?.setAttribute("href", `${route}/event/` + item.slug);
          }
          if (inputType === "people_id") {
            newFollowingItem
              .querySelector("[dev-target=link]")
              ?.setAttribute("href", `${route}/person/` + item.slug);
          }
          if (inputType === "technology_category_id") {
            newFollowingItem
              .querySelector("[dev-target=link]")
              ?.setAttribute("href", `${route}/technology/` + item.slug);
          }
          newFollowingItem.querySelector("[dev-target=name]")!.textContent =
            item.name;
          const newFollowingItemInput =
            newFollowingItem.querySelector<HTMLInputElement>(
              "[dev-target=input]"
            );
          newFollowingItemInput?.setAttribute("dev-input-type", inputType);
          newFollowingItemInput?.setAttribute(
            "dev-input-id",
            item.id.toString()
          );
          newFollowingItemInput && followFavouriteLogic(newFollowingItemInput);
          newFollowingItemInput &&
            userFollowingAndFavourite &&
            setCheckboxesInitialState(newFollowingItemInput, slugArray);
          newFollowingItemInput && fakeCheckboxToggle(newFollowingItemInput);
          followingTarget.appendChild(newFollowingItem);
        });
    });
  }

  function convertArrayOfObjToNumber(data: { id: number }[]) {
    return data.map((item) => item?.id);
  }
}
