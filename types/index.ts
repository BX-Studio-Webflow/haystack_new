declare global {
  interface Window {
    Webflow: any;
  }
}

export interface InsightPayload {
  page?: number;
  perPage?: number;
  offset?: number;
  orderBy?: string;
  sortBy?: string;
  filtering?: {
    search?: string;
    checkboxes?: {
      companyType?: number[];
      sourceCat?: number[];
      techCat?: number[];
      lineOfBus?: number[];
      insightClass?: number[];
      organization?: number[];
    };
  };
}

export interface Insight {
  itemsReceived: number;
  curPage: number;
  nextPage: number | null;
  prevPage: number | null;
  offset: number;
  itemsTotal: number;
  pageTotal: number;
  items: {
    id: number;
    created_at: number;
    name: string;
    slug: string;
    company_id: number | null;
    description: string;
    "insight-detail": string;
    curated: Date | null;
    source_author: string;
    source: string;
    "source-url": string;
    "source-publication-date": Date | null;
    source_category_id: (
      | { id: number; name: string; slug: string }
      | null
      | 0
    )[];
    company_type_id: ({ id: number; name: string; slug: string } | null | 0)[];
    insight_classification_id: (
      | { id: number; name: string; slug: string }
      | null
      | 0
    )[];
    line_of_business_id: (
      | { id: number; name: string; slug: string }
      | null
      | 0
    )[];
    technology_category_id: (
      | { id: number; name: string; slug: string }
      | null
      | 0
    )[];
    "companies-mentioned": number[];
    companies_mentioned: number[];
    people_id: number[];
    event_id: number;
    company_details: {
      id: number;
      name: string;
      slug: string;
      "company-website": string;
      company_logo: null | { url: string };
    };
    published: boolean;
  }[];
}

export interface UserFollowingAndFavourite {
  user_following: {
    id: number;
    created_at: number;
    xano_user_id: number;
    company_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    technology_category_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    people_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    event_id: {
      id: number;
      name: string;
      slug: string;
    }[];
  };
  user_favourite: {
    id: number;
    xano_user_id: number;
    insight_id: number[];
    company_id: number[];
    people_id: number[];
  };
}
export interface UserOrganizations {
  id: number;
  organization_id: {
    id: number;
    name: string;
    slug: string;
    email_domain: string;
  }[];
}

export interface FilterResponse {
  id: number;
  created_at: number;
  name: string;
  slug: string;
  published: boolean;
}

export interface SearchObject {
  search: string;
  checkboxes: {
    companyType: number[];
    sourceCat: number[];
    techCat: number[];
    lineOfBus: number[];
    insightClass: number[];
    organization: number[];
  };
}

export interface Person {
  id: number;
  name: string;
  slug: string;
  title: string;
  bio: string;
  company_id: number;
  email: string;
  linkedin: string;
  picture: null;
  company_details: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface PersonInsightResponse {
  itemsReceived: number;
  curPage: number;
  nextPage: null;
  prevPage: null;
  offset: number;
  itemsTotal: number;
  pageTotal: number;
  items: {
    id: number;
    created_at: number;
    name: string;
    slug: string;
    company_id: number;
    description: string;
    "insight-detail": string;
    curated: Date;
    source_author: string;
    source: string;
    "source-url": string;
    "source-publication-date": Date;
    source_category_id: any[];
    company_type_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    insight_classification_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    line_of_business_id: any[];
    technology_category_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    "companies-mentioned": any[];
    people_id: number[];
    event_id: number;
    published: boolean;
    company_details: {
      id: number;
      name: string;
      slug: string;
      "company-website": string;
      company_logo: null | { url: string };
    };
  }[];
}

export interface InsightResponse {
  id: number;
  created_at: number;
  name: string;
  slug: string;
  company_id: number;
  description: string;
  "insight-detail": string;
  curated: Date;
  source_author: string;
  source: string;
  "source-url": string;
  "source-publication-date": Date;
  source_category_id: {
    id: number;
    name: string;
    slug: string;
  }[];
  company_type_id: {
    id: number;
    name: string;
    slug: string;
  }[];
  insight_classification_id: {
    id: number;
    name: string;
    slug: string;
  }[];
  line_of_business_id: {
    id: number;
    name: string;
    slug: string;
  }[];
  technology_category_id: {
    id: number;
    name: string;
    slug: string;
  }[];
  "companies-mentioned": {
    id: number;
    name: string;
    slug: string;
    "company-website": string;
    company_logo: null | { url: string };
  }[];
  companies_mentioned: ({
    id: number;
    name: string;
    slug: string;
    "company-website": string;
    company_logo: null | { url: string };
  } | null)[];
  people_id: ({
    id: number;
    name: string;
    title: string;
    slug: string;
    company_id: number;
    _company?: {
      id: number;
      name: string;
      slug: string;
    };
  } | null)[];
  event_id: number;
  source_document_id: ({
    id: number;
    name: string;
    slug: string;
    document_url: string;
    document: { url: string };
  } | null)[];
  published: boolean;
  company_details: {
    id: number;
    name: string;
    slug: string;
    "company-website": string;
    company_logo: null | { url: string };
  };
  event_details: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Company {
  id: number;
  created_at: number;
  name: string;
  slug: string;
  "company-linkedin-profile-link": string;
  "company-website": string;
  location: string;
  "company-size": string;
  business_entity_id: number;
  business_entity_details: { id: number; name: string; slug: string } | null;
  company_type_id: number;
  company_type_details: { id: number; name: string; slug: string } | null;
  "company-revenue": string;
  "fiscal-year": string;
  "description-small": string;
  about: string;
  people_id: ({ id: number; name: string; slug: string } | null)[];
  event_id: { id: number; name: string; slug: string };
  state_local_regulator_id: [];
  "related-business-entities":
    | ({
        id: number;
        name: string;
        slug: string;
        "description-small": string;
      } | null)[]
    | null;
  key_documents: ({
    id: number;
    name: string;
    slug: string;
    document_url: string;
    document: { url: string };
  } | null)[];
  company_logo: null | { url: string };
}
export interface CompanyV2 {
  id: number;
  created_at: number;
  name: string;
  slug: string;
  "company-linkedin-profile-link": string;
  "company-website": string;
  company_type_id: number;
  "description-small": string;
  company_logo: null | { url: string };
  published: boolean;
}
export interface InsightV2 {
  id: number;
  created_at: number;
  name: string;
  slug: string;
  company_id: number | null;
  description: string;
  "insight-detail": string;
  curated: Date | null;
  source_author: string;
  source: string;
  "source-url": string;
  "source-publication-date": Date | null;
  source_category_id: ({ id: number; name: string; slug: string } | null | 0)[];
  company_type_id: ({ id: number; name: string; slug: string } | null | 0)[];
  insight_classification_id: (
    | { id: number; name: string; slug: string }
    | null
    | 0
  )[];
  line_of_business_id: (
    | { id: number; name: string; slug: string }
    | null
    | 0
  )[];
  technology_category_id: (
    | { id: number; name: string; slug: string }
    | null
    | 0
  )[];
  "companies-mentioned": number[];
  companies_mentioned: number[];
  people_id: number[];
  event_id: number;
  company_details: {
    id: number;
    name: string;
    slug: string;
    "company-website": string;
    company_logo: null | { url: string };
  };
  published: boolean;
}
export interface PersonV2 {
  id: number;
  name: string;
  created_at: number;
  slug: string;
  title: string;
  bio: string;
  _company: { name: string; slug: string };
  company_id: number;
  email: string;
  linkedin: string;
  picture: null;
  company_details: {
    id: number;
    name: string;
    slug: string;
  };
  published: boolean;
}

export interface UserShares {
  id: number;
  shared_to: string;
}

export type UserFeedResponse = {
  itemsReceived: number;
  curPage: number;
  nextPage: number;
  prevPage: null;
  offset: number;
  itemsTotal: number;
} & (
  | { items: InsightV2[]; type: "insight" }
  | { items: CompanyV2[]; type: "company" }
  | { items: PersonV2[]; type: "people" }
);

export type SortOrder = "asc" | "desc" | "random";
export type InsightItem = InsightV2 & { type: "insight" };
export type CompanyItem = CompanyV2 & { type: "company" };
export type PersonItem = PersonV2 & { type: "people" };
export type MergedItem = InsightItem | CompanyItem | PersonItem;

export type MergedResult = {
  itemsReceived: number;
  curPage: number;
  nextPage: number;
  prevPage: number | null;
  offset: number;
  items: MergedItem[];
  returnTypeCount: Record<string, number>;
  totalReturnTypeCount: Record<string, number>;
};
