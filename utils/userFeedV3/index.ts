import {
  CompanyItem,
  InsightItem,
  MergedResult,
  PersonItem,
  SortOrder,
  UserFeedResponse,
  UserOrganizations,
  type FilterResponse,
  type InsightPayload,
  type SearchObject,
  type UserFollowingAndFavourite,
} from "../../types/index";
import { XanoClient } from "@xano/js-sdk";
import { debounce, formatCuratedDate, qs, qsa, slugify, toTitleCase } from "..";
export async function userFeedCode({
  dataSource,
}: {
  dataSource: "live" | "dev";
}) {
  // Classes
  type DropdownOption = {
    label: string;
    sortBy: string;
    orderBy: "asc" | "desc";
  };

  class CustomDropdown {
    private wrapper: HTMLElement;
    private trigger: HTMLElement;
    private placeholder: HTMLElement;
    private list: HTMLElement;
    private itemTemplate: HTMLElement;
    private items: NodeListOf<HTMLElement> = [] as any;
    private selectedOption: DropdownOption | null = null;
    private tab: Tab;

    constructor(
      wrapper: HTMLElement,
      options: DropdownOption[] = [],
      tab: Tab
    ) {
      this.wrapper = wrapper;
      this.trigger = wrapper.querySelector(
        '[dev-target="custom-dropdown_trigger"]'
      )!;
      this.placeholder = wrapper.querySelector(
        '[dev-target="custom-dropdown_trigger_placeholder"]'
      )!;
      this.list = wrapper.querySelector('[dev-target="custom-dropdown_list"]')!;
      this.itemTemplate = wrapper.querySelector(
        '[dev-target="custom-dropdown_list-item"]'
      )!;
      this.tab = tab;

      if (options.length > 0) {
        this.setOptions(options);
      } else {
        this.items = this.wrapper.querySelectorAll(
          '[dev-target="custom-dropdown_list-item"]'
        );
      }

      this._attachEvents();
    }

    private _attachEvents() {
      this.trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.wrapper.classList.toggle("open");
      });

      this.list.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest(
          '[dev-target="custom-dropdown_list-item"]'
        ) as HTMLElement;
        if (target) {
          const label = target.textContent?.trim() || "";
          const sortBy = target.getAttribute("data-sortby")!;
          const orderBy = target.getAttribute("data-orderby") as "asc" | "desc";
          const option: DropdownOption = { label, sortBy, orderBy };
          this._select(option);
          this.tab
            .geFeedFromServer({
              type: "all",
              orderBy: orderBy,
              sortBy: sortBy,
            })
            .then((res) => {
              if (res && userFollowingAndFavourite) {
                console.log({
                  res,
                  tab: this.tab,
                  label,
                  sortBy,
                  orderBy,
                  option,
                });
                this.tab.setFeedData(res);
                this.tab.updateFeedContainer(res, userFollowingAndFavourite);
                this.tab.filterFeed();
              }
            });
        }
      });

      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!this.wrapper.contains(target)) {
          this.wrapper.classList.remove("open");
        }
      });
    }

    private _select(option: DropdownOption) {
      this.selectedOption = option;
      this.placeholder.textContent = option.label;
      this.wrapper.classList.remove("open");

      const event = new CustomEvent("dropdown:change", {
        detail: option,
      });
      this.wrapper.dispatchEvent(event);
    }

    public setOptions(options: DropdownOption[]) {
      this.list.innerHTML = ""; // Clear current items
      options.forEach((opt) => {
        const item = this.itemTemplate.cloneNode(true) as HTMLElement;
        item.style.display = ""; // Ensure visible
        item.textContent = opt.label;
        item.setAttribute("data-sortby", opt.sortBy);
        item.setAttribute("data-orderby", opt.orderBy);
        this.list.appendChild(item);
      });

      this.items = this.list.querySelectorAll(
        '[dev-target="custom-dropdown_list-item"]'
      );
    }

    public getValue(): DropdownOption | null {
      return this.selectedOption;
    }

    public setValue(value: DropdownOption): void {
      const match = Array.from(this.items).find((item) => {
        return (
          item.getAttribute("data-sortby") === value.sortBy &&
          item.getAttribute("data-orderby") === value.orderBy
        );
      });

      if (match) {
        this._select(value);
      }
    }
  }

  class Tab {
    name: string;
    localStorageKey: string;
    endpoint: string;
    sortContainer: HTMLDivElement;
    menuItem: HTMLDivElement;
    filterModalTrigger: HTMLDivElement;
    contentItem: HTMLDivElement;
    feedSearch: HTMLInputElement;
    feedSearchLoader: HTMLInputElement;
    filtersWrap: HTMLDivElement;
    feedSortWrap: HTMLDivElement;
    feedContainer: HTMLDivElement;
    paginationContainer: HTMLDivElement;
    emptyStateContainer: HTMLDivElement;
    organizationFilter: number[];
    items: MergedResult | null = null;
    customDropdown: CustomDropdown;
    subFilter: "all" | "insight" | "company" | "people" = "all";

    constructor(
      name: string,
      endpoint: string,
      menuItemTemplate: HTMLDivElement,
      contentItemTemplate: HTMLDivElement,
      organizationFilter?: number[]
    ) {
      this.menuItem = menuItemTemplate.cloneNode(true) as HTMLDivElement;
      this.contentItem = contentItemTemplate.cloneNode(true) as HTMLDivElement;
      this.filterModalTrigger = this.contentItem.querySelector(
        `[dev-target=filter-modal-trigger]`
      ) as HTMLDivElement;
      this.sortContainer = this.contentItem.querySelector(
        `[dev-target=custom-dropdown_wrap]`
      ) as HTMLDivElement;
      this.feedContainer = this.contentItem.querySelector(
        "[dev-target=insight-all]"
      ) as HTMLDivElement;
      this.feedSortWrap = this.contentItem.querySelector(
        "[dev-target=feed-sort-wrap]"
      ) as HTMLDivElement;
      this.filtersWrap = this.contentItem.querySelector(
        "[dev-filter-wrap]"
      ) as HTMLDivElement;
      this.feedSearch = this.contentItem.querySelector(
        "[dev-target=user-feed-search]"
      ) as HTMLInputElement;
      this.feedSearchLoader = this.contentItem.querySelector(
        "[dev-target=search-loading-spinner]"
      ) as HTMLInputElement;
      this.emptyStateContainer = this.contentItem.querySelector(
        `[dev-tab-empty-state]`
      ) as HTMLDivElement;
      this.paginationContainer = this.contentItem.querySelector(
        "[dev-target=all-tab-pagination_wrapper]"
      ) as HTMLDivElement;
      this.organizationFilter = organizationFilter ?? [];
      this.name = toTitleCase(name);
      this.localStorageKey = `userFeedData_${slugify(this.name)}`;
      this.endpoint = endpoint;
      this.menuItem.textContent = this.name;
      this.contentItem.classList["remove"]("active");
      this.filterModalTrigger.addEventListener("click", () => {
        qs(`[dev-target=filter-modal-target]`).click();
      });
      this.filterWrapInit();
      this.lsInit();
      this.customDropdown = new CustomDropdown(
        this.sortContainer,
        [
          {
            label: "Curated Date (Latest)",
            orderBy: "desc",
            sortBy: "curated",
          },
          {
            label: "Curated Date (Oldest)",
            orderBy: "asc",
            sortBy: "curated",
          },
          {
            label: "Source Published Date (Latest)",
            orderBy: "desc",
            sortBy: "source-publication-date",
          },
          {
            label: "Source Published Date (Oldest)",
            orderBy: "asc",
            sortBy: "source-publication-date",
          },
        ],
        this
      );
    }

    async lsInit() {
      this.items = this.getFeedFromLocalStorage();
      if (this.items && userFollowingAndFavourite) {
        this.updateFeedContainer(this.items, userFollowingAndFavourite);
        this.filterFeed();
      }
    }
    async serverInit(
      payload?: InsightPayload & {
        type: "all" | "insight" | "company" | "people";
      }
    ) {
      this.items = await this.geFeedFromServer({ type: "all", ...payload });
      if (this.items && userFollowingAndFavourite) {
        this.updateFeedContainer(this.items, userFollowingAndFavourite);
        this.filterFeed();
      }
      this.feedSearch.addEventListener("input", () => {
        searchObject.search = this.feedSearch.value;
        searchDebounce(
          () => {
            this.feedSearchLoader.classList.remove("hide");
          },
          () => {
            this.feedSearchLoader.classList.add("hide");
          }
        );
        insightSearchInput.value = "";
        customTab.tabs.forEach((tab) => {
          if (tab === this) return;
          tab.feedSearch.value = this.feedSearch.value;
        });
      });
    }

    tabIsActive(value: boolean) {
      this.menuItem.classList[value ? "add" : "remove"]("active");
      this.contentItem.classList[value ? "add" : "remove"]("active");
    }

    getFeedFromLocalStorage() {
      const localStorageData = localStorage.getItem(this.localStorageKey);
      if (localStorageData) {
        const parsedData = JSON.parse(localStorageData) as MergedResult;
        return parsedData;
      }
      return null;
    }

    async geFeedFromServer(
      payload: InsightPayload & {
        type: "all" | "insight" | "company" | "people";
      }
    ) {
      const {
        page = 0,
        perPage = 0,
        offset = 0,
        type,
        sortBy = "created_at",
        orderBy = "desc",
      } = payload;
      try {
        const res = await xano_userFeed_v2.get(this.endpoint, {
          page,
          perPage,
          offset,
          sortBy: sortBy,
          orderBy: orderBy,
          filtering: {
            search: searchObject.search,
            checkboxes: {
              companyType: searchObject.checkboxes.companyType,
              sourceCat: searchObject.checkboxes.sourceCat,
              techCat: searchObject.checkboxes.techCat,
              lineOfBus: searchObject.checkboxes.lineOfBus,
              insightClass: searchObject.checkboxes.insightClass,
              organization: this.organizationFilter,
            },
          },
          // filtering: searchObject,
          type: type,
        });
        const userFeedData = res.getBody() as UserFeedResponse[];
        const mergedResults = mergePages(userFeedData);

        if (
          page === 0 &&
          perPage === 0 &&
          offset === 0 &&
          searchObject.search === "" &&
          searchObject.checkboxes?.companyType?.length === 0 &&
          searchObject.checkboxes?.sourceCat?.length === 0 &&
          searchObject.checkboxes?.techCat?.length === 0 &&
          searchObject.checkboxes?.lineOfBus?.length === 0 &&
          searchObject.checkboxes?.insightClass?.length === 0 &&
          sortBy === "created_at" &&
          orderBy === "desc"
        ) {
          localStorage.setItem(
            this.localStorageKey,
            JSON.stringify(mergedResults)
          );
        }
        return mergedResults;
      } catch (error) {
        console.error(`getUserFeedData_${this.endpoint}_error`, error);
        return null;
      }
    }

    filterWrapInit() {
      const filterItems = [...this.filtersWrap.children];

      filterItems.forEach((item) => {
        const tabFilterType = item.getAttribute("dev-tab-filter") as
          | "all"
          | "insight"
          | "people"
          | "company";
        item.addEventListener("click", () => {
          this.subFilter = tabFilterType;
          const scrollTopValue = window.innerWidth < 767 ? 220 : 130;
          // window.scrollTo({
          //   top: scrollTopValue,
          //   behavior: "instant",
          // });
          removeActiveFromItems();
          item.classList.add("active");
          this.filterFeed();
        });
      });

      function removeActiveFromItems() {
        filterItems.forEach((item) => {
          item.classList.remove("active");
        });
      }
    }
    filterFeed() {
      if (this.subFilter === "all") {
        return this.showAllFeedItems();
      }
      if (this.items && userFollowingAndFavourite) {
        const itemsCopy = { ...this.items };
        itemsCopy.items = itemsCopy.items.filter(
          (item) => item.type === this.subFilter
        );
        itemsCopy.itemsReceived = itemsCopy.items.length;
        this.updateFeedContainer(itemsCopy, userFollowingAndFavourite);
        this.paginationLogic(itemsCopy);
      }
    }
    showAllFeedItems() {
      if (this.items && userFollowingAndFavourite) {
        this.updateFeedContainer(this.items, userFollowingAndFavourite);
        this.paginationLogic(this.items);
      }
    }

    setFeedData(data: MergedResult) {
      this.items = data;
    }

    updateFeedContainer(
      mergedData: MergedResult,
      userFollowingAndFavourite: UserFollowingAndFavourite
    ) {
      this.feedContainer.innerHTML = "";
      this.contentItem.querySelectorAll(`[tab-section]`).forEach((section) => {
        const countDiv = section.querySelector<HTMLDivElement>("[dev-count]");
        const filterType = section.getAttribute("dev-tab-filter") as
          | "all"
          | "insight"
          | "company"
          | "people";
        if (filterType === "all") {
          if (countDiv) {
            return (countDiv.textContent = this.feedSearch.value
              ? `(${Object.values(mergedData.totalReturnTypeCount).reduce(
                  (acc, value) => acc + value,
                  0
                )})`
              : "");
          }
        }
        if (countDiv) {
          countDiv.textContent = this.feedSearch.value
            ? `(${mergedData.totalReturnTypeCount[filterType].toString()})`
            : "";
        }
      });
      mergedData.items.forEach((data) => {
        const newInsight = insightTemplate.cloneNode(true) as HTMLDivElement;

        const tagsWrapperTarget = newInsight.querySelector<HTMLDivElement>(
          `[dev-target=tags-container]`
        );
        const userFeedType = newInsight.querySelector<HTMLDivElement>(
          `[dev-target=user-feed-type]`
        );
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

        const companyLink = newInsight.querySelector(
          `[dev-target=company-link]`
        );
        const companyImage = newInsight.querySelector<HTMLImageElement>(
          `[dev-target=company-image]`
        );
        const insightNameTarget = newInsight.querySelector(
          `[dev-target=insight-name]`
        );
        const insightLink = newInsight.querySelector(
          `[dev-target=insight-link]`
        );
        const curatedDateTargetWrapper = newInsight.querySelector(
          `[dev-target="curated-date-wrapper"]`
        );
        const curatedDateTarget = newInsight.querySelector(
          `[dev-target="curated-date"]`
        );
        const curatedCompanyTargetWrapper = newInsight.querySelector(
          `[dev-target="curated-company-wrapper"]`
        );
        const curatedCompanyTarget = newInsight.querySelector(
          `[dev-target="curated-company"]`
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
        const personDetailsWrap = newInsight.querySelector(
          `[dev-target="person-details-wrap"]`
        );

        if (data.type === "insight") {
          if (insightDateWrap) insightDateWrap.style.display = "flex";
          if (searchTextDiv) searchTextDiv.style.display = "none";
          if (searchListWrap) searchListWrap.style.display = "none";

          const searchList = getHighlightedSentences(
            data["insight-detail"] ?? "",
            searchObject.search,
            5,
            30,
            true
          );
          searchResultList!.innerHTML = "";
          searchCount!.textContent = `${searchList.length}`;
          // if (searchList.length > 0) {
          //   if (searchTextDiv) searchTextDiv.innerHTML = searchList[0];
          //   if (searchTextDiv) searchTextDiv.style.display = "block";
          // }
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
              searchResultCount!.textContent = `${
                searchList.indexOf(item) + 1
              }`;
              searchResultText.innerHTML = highlightQueryInText(
                item,
                searchObject.search
              );
              searchResultText.setAttribute(
                "href",
                `${route}/insight/${data.slug}`
              );
              searchResultText.setAttribute("target", "_blank");
              searchResultList!.appendChild(newSearchResultItem);
            });
          }
          //userFeedType!.textContent = "insight";
          newInsight.setAttribute("dev-target", "insight-feed-item");
          const curatedDate = data.curated
            ? formatCuratedDate(data.curated)
            : "";
          const publishedDate = data["source-publication-date"]
            ? formatPublishedDate(data["source-publication-date"])
            : "";
          const sourceCatArray = data.source_category_id;
          const companyTypeArray = data.company_type_id;
          const insightClassArray = data.insight_classification_id;
          // const lineOfBusArray = data.line_of_business_id;
          const techCatArray = data.technology_category_id;

          const companyInputs = newInsight.querySelectorAll<HTMLInputElement>(
            `[dev-target=company-input]`
          );
          companyInputs.forEach((companyInput) => {
            fakeCheckboxToggle(companyInput!);
            companyInput?.setAttribute("dev-input-type", "company_id");
            if (data.company_id) {
              companyInput?.setAttribute(
                "dev-input-id",
                data.company_id.toString()
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

            favouriteInput?.setAttribute("dev-input-type", "insight_id");
            favouriteInput?.setAttribute("dev-input-action", "favourite");
            favouriteInput?.setAttribute("dev-input-feed-type", "insight_id");
            favouriteInput?.setAttribute("dev-input-id", data.id.toString());

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
          // addTagsToInsight(searchObject.search,lineOfBusArray, tagsWrapperTarget!, false);
          addTagsToInsight(
            searchObject.search,
            techCatArray,
            tagsWrapperTarget!,
            true,
            "technology_category_id"
          );

          if (data.company_details?.company_logo) {
            companyImage!.src = data.company_details.company_logo!.url;
          } else {
            if (
              data.company_details &&
              data.company_details["company-website"]
            ) {
              const imageUrl =
                "https://logo.clearbit.com/" +
                data.company_details["company-website"];

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

          insightNameTarget!.innerHTML = highlightQueryInText(
            data.name,
            searchObject.search
          );
          curatedCompanyTargetWrapper?.classList[data.company_details?.slug ? "remove" : "add"](
            "hide"
          );
          curatedCompanyTarget!.textContent = data.company_details?.name ?? "";
          curatedDateTargetWrapper?.classList[curatedDate ? "remove" : "add"](
            "hide"
          );
          curatedDateTarget!.textContent = curatedDate ?? "";
          publishedDateTarget!.textContent = publishedDate ?? "";
          publishedDateTargetWrapper.forEach((item) =>
            item.classList[publishedDate ? "remove" : "add"]("hide")
          );
          insightLink!.setAttribute("href", `${route}/insight/` + data.slug);
          sourceTarget!.setAttribute("href", data["source-url"]);
          sourceTargetWrapper?.classList[data["source-url"] ? "remove" : "add"](
            "hide"
          );
          data.company_details?.slug &&
            companyLink!.setAttribute(
              "href",
              `${route}/company/` + data.company_details?.slug
            );
          sourceTarget!.textContent = data.source;
          sourceAuthorTargetWrapper.forEach((item) =>
            item.classList[data.source_author ? "remove" : "add"]("hide")
          );
          sourceAuthorTarget!.textContent = data.source_author;
          this.feedContainer.appendChild(newInsight);
        } else if (data.type === "company") {
          if (insightDateWrap) insightDateWrap.style.display = "none";
          if (searchListWrap) searchListWrap.style.display = "none";
          if (searchTextDiv) searchTextDiv.style.display = "none";

          userFeedType!.textContent = "company";
          userFeedType!.classList.add("company");
          insightNameTarget!.innerHTML = highlightQueryInText(
            data.name,
            searchObject.search
          );
          newInsight.setAttribute("dev-target", "company-feed-item");
          insightLink!.setAttribute("href", `${route}/company/` + data.slug);
          companyLink!.setAttribute("href", `${route}/company/` + data.slug);
          const companyInputs = newInsight.querySelectorAll<HTMLInputElement>(
            `[dev-target=company-input]`
          );
          companyInputs.forEach((companyInput) => {
            fakeCheckboxToggle(companyInput!);
            companyInput?.setAttribute("dev-input-type", "company_id");
            companyInput?.setAttribute("dev-input-action", "follow");

            if (data.id) {
              companyInput?.setAttribute("dev-input-id", data.id.toString());
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

            favouriteInput?.setAttribute("dev-input-type", "company_id");
            favouriteInput?.setAttribute("dev-input-action", "favourite");
            favouriteInput?.setAttribute("dev-input-feed-type", "company_id");
            favouriteInput?.setAttribute("dev-input-id", data.id.toString());

            favouriteInput && followFavouriteLogic(favouriteInput);

            favouriteInput &&
              setCheckboxesInitialState(
                favouriteInput,
                userFollowingAndFavourite.user_favourite.company_id
              );
          });

          if (data.company_logo) {
            companyImage!.src = data.company_logo.url;
          } else {
            if (data["company-website"]) {
              const imageUrl =
                "https://logo.clearbit.com/" + data["company-website"];

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
          this.feedContainer.appendChild(newInsight);
        } else if (data.type === "people") {
          if (insightDateWrap) insightDateWrap.style.display = "none";
          if (searchListWrap) searchListWrap.style.display = "none";
          if (searchTextDiv) searchTextDiv.style.display = "none";

          if (personDetailsWrap && data.title && data._company) {
            personDetailsWrap.classList.remove("hide");
            personDetailsWrap.innerHTML = highlightQueryInText(
              `${data.title} | ${data._company.name}`,
              searchObject.search
            );
          }
          companyImage!.src = `https://cdn.prod.website-files.com/64a2a18ba276228b93b991d7/64e5ffe7398cb98da1effe5b_Frame%2011%20(1).webp`;
          insightNameTarget!.innerHTML = highlightQueryInText(
            data.name,
            searchObject.search
          );
          const searchList = getHighlightedSentences(
            data.title ?? "",
            searchObject.search,
            5
          );

          newInsight.setAttribute("dev-target", "people-feed-item");
          userFeedType!.textContent = "person";
          userFeedType!.classList.add("person");
          insightLink!.setAttribute("href", `${route}/person/` + data.slug);
          companyLink!.setAttribute("href", `${route}/person/` + data.slug);
          const peopleInputs = newInsight.querySelectorAll<HTMLInputElement>(
            `[dev-target=company-input]`
          );
          peopleInputs.forEach((peopleInput) => {
            fakeCheckboxToggle(peopleInput!);
            peopleInput?.setAttribute("dev-input-type", "people_id");
            peopleInput?.setAttribute("dev-input-action", "follow");

            if (data.id) {
              peopleInput?.setAttribute("dev-input-id", data.id.toString());
            } else {
              const inputForm = peopleInput.closest("form");
              if (inputForm) {
                inputForm.style.display = "none";
              }
            }
            // insight.company_id &&
            //   companyInput?.setAttribute(
            //     "dev-input-id",
            //     insight.company_id.toString()
            //   );
            peopleInput && followFavouriteLogic(peopleInput);
            peopleInput &&
              setCheckboxesInitialState(
                peopleInput,
                convertArrayOfObjToNumber(
                  userFollowingAndFavourite.user_following.people_id
                )
              );
            const favouriteInputs =
              newInsight.querySelectorAll<HTMLInputElement>(
                `[dev-target=favourite-input]`
              );
            favouriteInputs.forEach((favouriteInput) => {
              fakeCheckboxToggle(favouriteInput!);

              favouriteInput?.setAttribute("dev-input-type", "people_id");
              favouriteInput?.setAttribute("dev-input-action", "favourite");
              favouriteInput?.setAttribute("dev-input-feed-type", "people_id");
              favouriteInput?.setAttribute("dev-input-id", data.id.toString());

              favouriteInput && followFavouriteLogic(favouriteInput);

              favouriteInput &&
                setCheckboxesInitialState(
                  favouriteInput,
                  userFollowingAndFavourite.user_favourite.people_id
                );
            });
          });
          this.feedContainer.appendChild(newInsight);
        }
        if (searchResultListWrapper)
          searchResultListWrapper.style.height = "0px";
        if (searchListWrap) searchAccordionLogic(searchListWrap);
      });
    }
    paginationLogic(userFeedData: MergedResult) {
      const { curPage, nextPage, prevPage, itemsReceived } = userFeedData;
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

      this.paginationContainer.innerHTML = "";
      pageItemWrapper.innerHTML = "";

      if (itemsReceived === 0) {
        this.paginationContainer.classList.add("hide");
        this.emptyStateContainer.classList.remove("hide");
      } else {
        this.paginationContainer.classList.remove("hide");
        this.emptyStateContainer.classList.add("hide");
      }

      prevBtn.classList[prevPage ? "remove" : "add"]("disabled");
      nextBtn.classList[nextPage ? "remove" : "add"]("disabled");

      nextPage &&
        nextBtn.addEventListener("click", async () => {
          this.feedContainer.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          // const scrollTopValue = window.innerWidth < 767 ? 220 : 130;
          if (window.innerWidth > 767) {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
          this.items = await this.geFeedFromServer({
            type: "all",
            page: curPage + 1,
          });
          if (this.items && userFollowingAndFavourite) {
            this.updateFeedContainer(this.items, userFollowingAndFavourite);
            this.filterFeed();
            // this.paginationLogic(this.items);
          }
        });
      prevPage &&
        prevBtn.addEventListener("click", async () => {
          this.feedContainer.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          this.items = await this.geFeedFromServer({
            type: "all",
            page: curPage - 1,
          });
          if (this.items && userFollowingAndFavourite) {
            this.updateFeedContainer(this.items, userFollowingAndFavourite);
            this.filterFeed();
            // this.paginationLogic(this.items);
          }
        });
      // pagination.style.display = pageTotal === 1 ? "none" : "flex";

      if (nextPage === null && prevPage === null) {
        this.paginationContainer.classList.add("hide");
      }
      this.paginationContainer.appendChild(pagination);
    }

    setItems(items: MergedResult): void {
      this.items = items;
    }
  }
  // Manages all Tabs
  class TabManager {
    tabContainer: HTMLDivElement;
    tabContainerMenu: HTMLDivElement;
    tabContainerContent: HTMLDivElement;
    tabs: Tab[] = [];
    activeTab: Tab | null = null;
    constructor(tabContainer: HTMLDivElement) {
      this.tabContainer = tabContainer;
      this.tabContainerMenu = tabContainer.querySelector(
        "[dev-target=custom-tab_menu_wrap]"
      ) as HTMLDivElement;
      this.tabContainerContent = tabContainer.querySelector(
        "[dev-target=custom-tab_content]"
      ) as HTMLDivElement;
      this.tabContainerMenu.innerHTML = "";
      this.tabContainerContent.innerHTML = "";
    }

    addTab(tab: Tab): void {
      this.tabs.push(tab);
      this.tabs[0].tabIsActive(true);
      tab.menuItem.addEventListener("click", (e) => {
        this.tabs.forEach((tab) => {
          if (e.target === tab.menuItem) {
            tab.tabIsActive(true);
            this.activeTab = tab;
          } else {
            tab.tabIsActive(false);
          }
        });
      });
      this.tabContainerMenu.appendChild(tab.menuItem);
      this.tabContainerContent.appendChild(tab.contentItem);
      if (!this.activeTab) {
        this.activeTab = tab;
      }
    }

    // getActiveTabItems(): Item[] {
    //   return this.activeTab ? this.activeTab.items : [];
    // }
  }
  const pathName = window.location.pathname;
  const route =
    dataSource === "dev" ? "/dev" : pathName.includes("/demo") ? "/demo" : "";
  const xano_userFeed = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:Hv8ldLVU",
  }).setDataSource(dataSource);
  const xano_userFeed_v2 = new XanoClient({
    apiGroupBaseUrl: `https://xhka-anc3-3fve.n7c.xano.io/api:H45DA61G`,
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

  const customTabDiv = qs(`[dev-target="custom-tab"]`);
  const menuItemTemplate = customTabDiv.querySelector(
    `[dev-target="menu-button"]`
  ) as HTMLDivElement;
  const contentItemTemplate = customTabDiv.querySelector(
    `[dev-target="insight-pagination-wrapper"]`
  ) as HTMLDivElement;

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

  const lsUserFollowingFavourite = localStorage.getItem(
    "user-following-favourite-v2"
  );
  if (lsUserFollowingFavourite) {
    userFollowingAndFavourite = JSON.parse(lsUserFollowingFavourite);
  }
  const customTab = new TabManager(customTabDiv!);
  const allTab = new Tab(
    "all",
    "/all-tab-insight-company-people_0",
    menuItemTemplate,
    contentItemTemplate
  );
  const followingTab = new Tab(
    "following",
    "/following-tab-insight-company-people_0",
    menuItemTemplate,
    contentItemTemplate
  );
  const favouriteTab = new Tab(
    "favorite",
    "/favourite-tab-insight-company-people_0",
    menuItemTemplate,
    contentItemTemplate
  );
  customTab.addTab(allTab);
  customTab.addTab(followingTab);
  customTab.addTab(favouriteTab);

  if (xanoToken) {
    xano_userFeed.setAuthToken(xanoToken);
    xano_userFeed_v2.setAuthToken(xanoToken);
    getXanoAccessToken(memberStackUserToken);
  } else {
    await getXanoAccessToken(memberStackUserToken);
  }
  lsUserFollowingFavourite
    ? getUserFollowingAndFavourite()
    : await getUserFollowingAndFavourite();
  userFeedInit();

  async function userFeedInit() {
    insightFilterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    insightSearchInput.addEventListener("input", () => {
      searchObject.search = insightSearchInput.value;
      searchDebounce();
      customTab.tabs.forEach((tab) => {
        tab.feedSearch.value = "";
      });
    });
    insightClearFilters.addEventListener("click", () => {
      const checkedFilters = qsa<HTMLInputElement>(
        "[dev-input-checkbox]:checked"
      );

      insightSearchInput.value = "";
      insightSearchInput.dispatchEvent(inputEvent);
      customTab.tabs.forEach((tab) => {
        tab.feedSearch.value = "";
        tab.feedSearch.dispatchEvent(inputEvent);
      });
      checkedFilters.forEach((input) => {
        input.click();
      });
    });

    customTab.tabs.forEach((tab) => tab.serverInit());

    getFilters("/company_type", {}, "companyType", filterCompanyTypeTarget);
    getFilters("/source_category", {}, "sourceCat", filterSourceCatTarget);
    getFilters("/technology_category", {}, "techCat", filterTechCatTarget);
    getFilters(
      "/insight_classification",
      {},
      "insightClass",
      filterInsightClassTarget
    );

    const userOrganizations = await getUserOrganizations();
    if (userOrganizations) {
      userOrganizations.organization_id.forEach((org) => {
        const orgTab = new Tab(
          org.name,
          `/all-tab-insight-company-people_0`,
          menuItemTemplate,
          contentItemTemplate,
          [org.id]
        );
        orgTab.serverInit();
        customTab.addTab(orgTab);
      });
    }
  }

  async function getXanoAccessToken(memberstackToken: string) {
    try {
      const res = await xano_wmx.post("/auth-user", {
        memberstack_token: memberstackToken,
      });
      const xanoAuthToken = res.getBody().authToken as string;
      xano_userFeed.setAuthToken(xanoAuthToken);
      xano_userFeed_v2.setAuthToken(xanoAuthToken);
      return xanoAuthToken;
    } catch (error) {
      console.log("getXanoAccessToken_error", error);
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
      const res = await xano_userFeed_v2.get("/user-following-and-favourite_0");
      const followingAndFavourite = res.getBody() as UserFollowingAndFavourite;
      const { user_following } = followingAndFavourite;
      userFollowingAndFavourite = followingAndFavourite;
      localStorage.setItem(
        "user-following-favourite-v2",
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
  async function getUserOrganizations() {
    try {
      const res = await xano_userFeed_v2.get("/user_organizations");
      const userOrganizations = res.getBody() as UserOrganizations;
      return userOrganizations;
    } catch (error) {
      console.error(`getUserOrganizations_error`, error);
      return null;
    }
  }

  const followFavouriteDebounce = debounce(followFavouriteListener, 300);

  async function followFavouriteListener(input: HTMLInputElement) {
    const type = input.getAttribute("dev-input-type")!;
    const action = input.getAttribute("dev-input-action")!;
    const id = input.getAttribute("dev-input-id")!;
    const endPoint =
      action === "favourite" ? "/toggle-favourite_0" : "/toggle-follow_0";
    try {
      await xano_userFeed_v2.get(endPoint, {
        id: Number(id),
        target: type,
      });
      //   console.log("userFollowingAndFavourite-1", userFollowingAndFavourite);
      await getUserFollowingAndFavourite();
      // run function to updated all-tab inputs
      //   console.log("userFollowingAndFavourite-2", userFollowingAndFavourite);

      customTab.tabs.forEach((tab) => {
        if (tab.name.toLowerCase().trim() === "all") {
          tab.contentItem.childNodes.forEach((feedItem) => {
            updateInsightsInputs(feedItem as HTMLDivElement);
          });
        } else {
          tab.geFeedFromServer({ type: "all" }).then((res) => {
            if (res && userFollowingAndFavourite) {
              tab.setFeedData(res);
              tab.updateFeedContainer(res, userFollowingAndFavourite);
              tab.filterFeed();
              // tab.paginationLogic(res);
            }
          });
        }
      });
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
      const feedType = favourite.getAttribute("dev-input-feed-type") as
        | "company_id"
        | "insight_id"
        | "people_id";
      favourite &&
        setCheckboxesInitialState(
          favourite,
          userFollowingAndFavourite?.user_favourite[feedType]!
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

  function insightSearch(cb1?: () => void, cb2?: () => void) {
    cb1 && cb1();
    customTab.tabs.forEach((tab) => {
      tab
        .geFeedFromServer({
          type: "all",
        })
        .then((res) => {
          if (res && userFollowingAndFavourite) {
            tab.setFeedData(res);
            tab.updateFeedContainer(res, userFollowingAndFavourite);
            tab.filterFeed();
            cb2 && cb2();
          }
        });
    });
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

  function mergePages(data: UserFeedResponse[]) {
    const merged: MergedResult = {
      itemsReceived: 0,
      curPage: 0,
      nextPage: 0,
      prevPage: null,
      offset: 0,
      items: [],
      returnTypeCount: {},
      totalReturnTypeCount: {},
    };

    data.forEach((page) => {
      merged.itemsReceived += page.itemsReceived;
      merged.curPage = Math.max(merged.curPage, page.curPage);
      merged.nextPage = Math.max(merged.nextPage, page.nextPage);
      merged.prevPage =
        merged.prevPage === null
          ? page.prevPage
          : Math.max(merged.prevPage, page.prevPage || 0);
      merged.offset = Math.max(merged.offset, page.offset);

      if (page.type === "insight") {
        const typedItems: InsightItem[] = page.items.map((item) => ({
          ...item,
          type: "insight",
        }));
        merged.items.push(...typedItems);
      } else if (page.type === "company") {
        const typedItems: CompanyItem[] = page.items.map((item) => ({
          ...item,
          type: "company",
        }));
        merged.items.push(...typedItems);
      } else if (page.type === "people") {
        const typedItems: PersonItem[] = page.items.map((item) => ({
          ...item,
          type: "people",
        }));
        merged.items.push(...typedItems);
      }

      // Optimized returnTypeCount using page-level type and itemsReceived
      merged.returnTypeCount[page.type] =
        (merged.returnTypeCount[page.type] || 0) + page.itemsReceived;

      merged.totalReturnTypeCount[page.type] =
        (merged.totalReturnTypeCount[page.type] || 0) + page.itemsTotal;
    });

    // Sort merged.items
    // if (sortOrder === "asc") {
    //   merged.items.sort((a, b) => a.created_at - b.created_at);
    // } else if (sortOrder === "desc") {
    //   merged.items.sort((a, b) => b.created_at - a.created_at);
    // } else if (sortOrder === "random") {
    //   for (let i = merged.items.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [merged.items[i], merged.items[j]] = [merged.items[j], merged.items[i]];
    //   }
    // }

    return merged;
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
