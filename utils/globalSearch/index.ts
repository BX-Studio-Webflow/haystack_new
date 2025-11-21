import { XanoClient } from '@xano/js-sdk';
import { debounce, qs } from '../../utils';

export async function searchCode({ dataSource }: { dataSource: 'live' | 'dev' }) {
  const route = dataSource === 'dev' ? '/dev' : '';
  const xano_global_search = new XanoClient({
    apiGroupBaseUrl: 'https://xhka-anc3-3fve.n7c.xano.io/api:G4uo48hy',
  }).setDataSource(dataSource);
  const xano_wmx = new XanoClient({
    apiGroupBaseUrl: 'https://xhka-anc3-3fve.n7c.xano.io/api:6Ie7e140',
  }).setDataSource(dataSource);

  const memberStackUserToken = localStorage.getItem('_ms-mid');
  const lsXanoAuthToken = localStorage.getItem('AuthToken');

  const searchForm = qs<HTMLFormElement>('[dev-search-form]');
  const searchInput = qs<HTMLInputElement>('[dev-global-search]');
  const searchResultWrapper = qs('[dev-global-search-result-wrapper]');
  const companySearchItem = qs<HTMLLinkElement>('[dev-template=company-search-item]');
  const insightSearchItem = qs<HTMLLinkElement>('[dev-template=insight-search-item]');
  const personSearchItem = qs<HTMLLinkElement>('[dev-template=person-search-item]');
  const eventSearchItem = qs<HTMLLinkElement>('[dev-template=event-search-item]');
  // const searchResult = qs("[dev-global-search-result]");
  const companiesResultsWrapper = qs('[dev-target=companies-results-wrapper]');
  const insightsResultsWrapper = qs('[dev-target=insights-results-wrapper]');
  const peopleResultsWrapper = qs('[dev-target=people-results-wrapper]');
  const eventsResultsWrapper = qs('[dev-target=events-results-wrapper]');
  const companiesResults = qs('[dev-companies-result]');
  const peopleResults = qs('[dev-people-result]');
  const eventsResults = qs('[dev-events-result]');
  const insightsResults = qs('[dev-insights-result]');
  // const emptyState = qs("[dev-no-search-results]");
  console.log('searchInput', searchInput);

  if (!memberStackUserToken) {
    return console.error('No memberstack token');
  }

  if (lsXanoAuthToken) {
    xano_global_search.setAuthToken(lsXanoAuthToken);
  } else {
    await getXanoAccessToken(memberStackUserToken);
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      searchResultWrapper.style.height = '0px';
    }, 500);
  });
  searchInput.addEventListener('focus', () => {
    if (searchInput.value) {
      searchResultWrapper.style.height = '500px';
    }
  });
  searchInput.addEventListener('input', () => {
    const inputValue = searchInput.value;
    console.log('inputValue', inputValue);

    searchDebounce(inputValue);
  });

  async function searchFunction(inputValue: string) {
    if (inputValue && inputValue.trim()) {
      searchInsight(inputValue);
      searchCompany(inputValue);
      searchPerson(inputValue);
      searchEvent(inputValue);
      searchResultWrapper.style.height = '500px';
    } else {
      searchResultWrapper.style.height = '0px';
    }
  }

  async function searchCompany(searchQuery: string) {
    try {
      const res = await xano_global_search.get('/company', {
        search_query: searchQuery,
      });
      const companies = res.getBody() as Company[];

      companiesResults.innerHTML = '';
      if (companies.length === 0) {
        companiesResultsWrapper.classList.add('hide');
      } else {
        companiesResultsWrapper.classList.remove('hide');
      }

      companies.forEach((company) => {
        const companyItem = companySearchItem.cloneNode(true) as HTMLLinkElement;
        const name = companyItem.querySelector(`[dev-target=name]`);
        const about = companyItem.querySelector(`[dev-target=about]`);
        const smallDesc = companyItem.querySelector(`[dev-target=small-desc]`);

        companyItem!.href = `${route}/company/` + company.slug;
        name!.textContent = company.name;
        about!.textContent = removeHTMLTags(company.about);
        smallDesc!.textContent = company['description-small'];

        name!.innerHTML = highlightSearchQuery(name!.innerHTML, searchQuery);
        about!.innerHTML = highlightSearchQuery(about!.innerHTML, searchQuery);
        smallDesc!.innerHTML = highlightSearchQuery(smallDesc!.innerHTML, searchQuery);

        about?.classList[
          about!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');
        smallDesc?.classList[
          smallDesc!.textContent.toLowerCase().includes(searchQuery.toLowerCase())
            ? 'remove'
            : 'add'
        ]('hide');

        companiesResults.appendChild(companyItem);
      });

      console.log('companies', companies);
    } catch (error) {
      console.error('searchCompany_error', error);
    }
  }
  async function searchInsight(searchQuery: string) {
    try {
      const res = await xano_global_search.get('/insight', {
        search_query: searchQuery,
      });
      const insights = res.getBody() as Insight[];

      insightsResults.innerHTML = '';
      if (insights.length === 0) {
        insightsResultsWrapper.classList.add('hide');
      } else {
        insightsResultsWrapper.classList.remove('hide');
      }

      insights.forEach((insight) => {
        const insightItem = insightSearchItem.cloneNode(true) as HTMLLinkElement;
        const name = insightItem.querySelector(`[dev-target=name]`);
        const moreContentIndicator = insightItem.querySelector(
          `[dev-target=more-content-indicator]`,
        );
        const source = insightItem.querySelector(`[dev-target=source]`);
        const insightDetails = insightItem.querySelector(`[dev-target=insight-detail]`);
        const description = insightItem.querySelector(`[dev-target=description]`);

        insightItem!.href = `${route}/insight/` + insight.slug;
        name!.textContent = insight.name;
        insightDetails!.textContent = removeHTMLTags(insight['insight-detail']);
        description!.textContent = insight.description;
        source!.textContent = insight.source;

        name!.innerHTML = highlightSearchQuery(name!.innerHTML, searchQuery);
        // insightDetails!.innerHTML = highlightSearchQuery(
        //   insightDetails!.innerHTML,
        //   searchQuery
        // );
        source!.innerHTML = highlightSearchQuery(source!.innerHTML, searchQuery);
        // description!.innerHTML = highlightSearchQuery(
        //   description!.innerHTML,
        //   searchQuery
        // );

        insightDetails?.classList.add('hide');
        description?.classList.add('hide');

        if (
          insightDetails!.textContent.toLocaleLowerCase().includes(searchQuery.toLowerCase()) ||
          insightDetails!.textContent.toLocaleLowerCase().includes(searchQuery.toLowerCase())
        ) {
          moreContentIndicator?.classList.remove('hide');
        } else {
          moreContentIndicator?.classList.add('hide');
        }

        // insightDetails?.classList[
        //   insightDetails!.textContent
        //     .toLowerCase()
        //     .includes(searchQuery.toLowerCase())
        //     ? "remove"
        //     : "add"
        // ]("hide");
        // description?.classList[
        //   description!.textContent
        //     .toLowerCase()
        //     .includes(searchQuery.toLowerCase())
        //     ? "remove"
        //     : "add"
        // ]("hide");
        source?.classList[
          source!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');

        insightsResults.appendChild(insightItem);
      });
      console.log('insights', insights);
    } catch (error) {
      console.error('searchInsight_error', error);
    }
  }
  async function searchPerson(searchQuery: string) {
    try {
      const res = await xano_global_search.get('/person', {
        search_query: searchQuery,
      });
      const people = res.getBody() as Person[];

      peopleResults.innerHTML = '';
      if (people.length === 0) {
        peopleResultsWrapper.classList.add('hide');
      } else {
        peopleResultsWrapper.classList.remove('hide');
      }

      people.forEach((person) => {
        const personItem = personSearchItem.cloneNode(true) as HTMLLinkElement;
        const name = personItem.querySelector(`[dev-target=name]`);
        const title = personItem.querySelector(`[dev-target=title]`);
        const bio = personItem.querySelector(`[dev-target=bio]`);

        personItem!.href = `${route}/person/` + person.slug;
        name!.textContent = person.name;
        title!.textContent = person.title;
        bio!.textContent = person.bio;

        name!.innerHTML = highlightSearchQuery(name!.innerHTML, searchQuery);
        title!.innerHTML = highlightSearchQuery(title!.innerHTML, searchQuery);
        bio!.innerHTML = highlightSearchQuery(bio!.innerHTML, searchQuery);

        title?.classList[
          title!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');
        bio?.classList[
          bio!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');

        peopleResults.appendChild(personItem);
      });
      console.log('people', people);
    } catch (error) {
      console.error('searchPerson_error', error);
    }
  }
  async function searchEvent(searchQuery: string) {
    try {
      const res = await xano_global_search.get('/event', {
        search_query: searchQuery,
      });
      const events = res.getBody() as Event[];

      eventsResults.innerHTML = '';
      if (events.length === 0) {
        eventsResultsWrapper.classList.add('hide');
      } else {
        eventsResultsWrapper.classList.remove('hide');
      }

      events.forEach((event) => {
        const eventItem = eventSearchItem.cloneNode(true) as HTMLLinkElement;
        const name = eventItem.querySelector(`[dev-target=name]`);
        const city = eventItem.querySelector(`[dev-target=city]`);
        const venue = eventItem.querySelector(`[dev-target=venue]`);
        const description = eventItem.querySelector(`[dev-target=description]`);

        eventItem!.href = `${route}/event/` + event.slug;
        name!.textContent = event.name;
        city!.textContent = event['event-city-state'];
        venue!.textContent = event['event-venue-name'];
        description!.textContent = removeHTMLTags(event['event-description']);

        name!.innerHTML = highlightSearchQuery(name!.innerHTML, searchQuery);
        city!.innerHTML = highlightSearchQuery(city!.innerHTML, searchQuery);
        venue!.innerHTML = highlightSearchQuery(venue!.innerHTML, searchQuery);
        description!.innerHTML = highlightSearchQuery(description!.innerHTML, searchQuery);

        city?.classList[
          city!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');
        venue?.classList[
          venue!.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ? 'remove' : 'add'
        ]('hide');
        description?.classList[
          description!.textContent.toLowerCase().includes(searchQuery.toLowerCase())
            ? 'remove'
            : 'add'
        ]('hide');

        eventsResults.appendChild(eventItem);
      });
      console.log('events', events);
    } catch (error) {
      console.error('searchEvent_error', error);
    }
  }

  async function getXanoAccessToken(memberstackToken: string) {
    try {
      const res = await xano_wmx.post('/auth-user', {
        memberstack_token: memberstackToken,
      });
      const xanoAuthToken = res.getBody().authToken as string;
      xano_global_search.setAuthToken(xanoAuthToken);
      return xanoAuthToken;
    } catch (error) {
      console.log('getXanoAccessToken_error', error);
      return null;
    }
  }

  function highlightSearchQuery(paragraph: string, searchQuery: string) {
    const regex = new RegExp(`(${searchQuery.split(/\s+/).join('|')})`, 'gi');
    const highlightedText = paragraph.replace(regex, '<span class="highlight">$1</span>');
    return highlightedText;
  }

  function removeHTMLTags(rawHTML: string) {
    return rawHTML.replace(/<[^>]*>/g, '');
  }

  const searchDebounce = debounce(searchFunction, 500);
  // Function to debounce a given function
  // function debounce(func: (...args: any[]) => void, delay: number) {
  //   let debounceTimer: ReturnType<typeof setTimeout>;
  //   return function (this: any, ...args: any[]) {
  //     const context = this;
  //     clearTimeout(debounceTimer);
  //     debounceTimer = setTimeout(() => func.apply(context, args), delay);
  //   };
  // }
  // Function for querying a single element by selector
  // function qs<T extends HTMLElement = HTMLDivElement>(selector: string): T {
  //   return document.querySelector(selector) as T;
  // }
}

interface Company {
  id: number;
  name: string;
  slug: string;
  about: string;
  'description-small': string;
}
interface Insight {
  id: number;
  name: string;
  slug: string;
  description: string;
  source: string;
  'insight-detail': string;
}
interface Person {
  id: number;
  name: string;
  slug: string;
  title: string;
  bio: string;
}
interface Event {
  id: number;
  name: string;
  slug: string;
  'event-description': string;
  'event-venue-name': string;
  'event-city-state': string;
}
