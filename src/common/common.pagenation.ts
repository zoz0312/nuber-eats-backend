export const FIXED_PAGE = 25;
export const SKIP_PAGE = (page = 1) => (page - 1) * FIXED_PAGE;
export const TOTAL_PAGES = (result = 0) => Math.ceil(result / FIXED_PAGE);

export const PAGE_NATION = (page = 1) => {
  return {
    take: FIXED_PAGE,
    skip: SKIP_PAGE(page),
  }
}