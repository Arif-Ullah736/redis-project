// Get pagination parameters
const getPagination = (page, size) => {
    const limit = size ? +size : 10;
    // page is expected to be 1-based; offset should be (page - 1) * limit
    const pageNum = page ? +page : 1;
    const offset = (pageNum - 1) * limit;

    return { limit, offset };
};

// Get paging data for response
const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        items,
        pagination: {
            totalItems,
            totalPages,
            currentPage,
            pageSize: limit,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
        },
    };
};

module.exports = {
    getPagination,
    getPagingData
};