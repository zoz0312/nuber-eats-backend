export const FIXED_PAGE = 25;
export const SKIP_PAGE = (page = 1, take) => (page - 1) * take;
export const TOTAL_PAGES = (result = 0, take = FIXED_PAGE) => Math.ceil(result / take);

export const PAGE_NATION = (page = 1, take = FIXED_PAGE) => {
  return {
    take,
    skip: SKIP_PAGE(page, take),
  }
}