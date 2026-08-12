import React, { useEffect, useMemo, useRef, useState } from "react";
import "../css/SearchableSelect.css";


const removeDiacritics = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");


const SearchableSelect = ({
  label,
  placeholder = "Tất cả",
  options = [],
  value = "",
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  const filteredOptions = useMemo(() => {
    if (!debouncedQuery.trim()) return options;

    const keyword = removeDiacritics(debouncedQuery.trim().toLowerCase());
    return options.filter((o) =>
      removeDiacritics(o.name.toLowerCase()).includes(keyword),
    );
  }, [options, debouncedQuery]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    onChange(String(option.id));
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  
  const inputValue = isOpen ? query : selectedOption?.name || "";

  return (
    <div className="select-field" ref={wrapperRef}>
      <label className="select-label">{label}</label>

      <div className={`select-control ${isOpen ? "open" : ""}`}>
        <input
          type="text"
          className="select-input"
          placeholder={disabled ? "Đang tải..." : placeholder}
          value={inputValue}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleOpen}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        {selectedOption && !isOpen ? (
          <button
            type="button"
            className="select-clear"
            onClick={handleClear}
            title="Bỏ chọn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
            </svg>
          </button>
        ) : (
          <svg
            className={`select-arrow ${isOpen ? "open" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polyline
              points="6 9 12 15 18 9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {isOpen && (
        <div className="select-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="select-empty">
              Không tìm thấy kết quả cho "{debouncedQuery}"
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`select-option ${!value ? "selected" : ""}`}
                onClick={() => handleSelect({ id: "" })}
              >
                {placeholder}
              </button>

              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`select-option ${
                    String(option.id) === String(value) ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
