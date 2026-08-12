import React from "react";


const Pagination = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  maxVisible = 5,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  
  const getPageNumbers = () => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    const pages = [];

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("start-ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("end-ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const handleClick = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    onPageChange(newPage);
  };

  return (
    <div className="jobs-pagination">
      <button
        className="jobs-page-btn jobs-page-nav"
        onClick={() => handleClick(page - 1)}
        disabled={page === 1 || disabled}
        title="Trang trước"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <polyline
            points="15 18 9 12 15 6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Trước
      </button>

      {getPageNumbers().map((p) =>
        typeof p === "number" ? (
          <button
            key={p}
            className={`jobs-page-btn ${p === page ? "active" : ""}`}
            onClick={() => handleClick(p)}
            disabled={disabled}
          >
            {p}
          </button>
        ) : (
          <span key={p} className="jobs-page-ellipsis">
            ...
          </span>
        ),
      )}

      <button
        className="jobs-page-btn jobs-page-nav"
        onClick={() => handleClick(page + 1)}
        disabled={page >= totalPages || disabled}
        title="Trang sau"
      >
        Sau
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <polyline
            points="9 18 15 12 9 6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
