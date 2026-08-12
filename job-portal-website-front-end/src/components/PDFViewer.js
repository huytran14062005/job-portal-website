import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";


pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

const PDFViewer = ({ pdfUrl }) => {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.5);
  const [htmlDocument, setHtmlDocument] = useState("");

  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;
    let blobUrl = "";

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError("");
        setPdf(null);
        setHtmlDocument("");
        setCurrentPage(1);
        setTotalPages(0);

        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const header = new TextDecoder("utf-8").decode(bytes.slice(0, 1024)).trimStart();

        
        
        if (/^<!doctype html|^<html/i.test(header)) {
          if (!cancelled) {
            setHtmlDocument(new TextDecoder("utf-8").decode(buffer));
            setLoading(false);
          }
          return;
        }

        if (!header.startsWith("%PDF")) {
          throw new Error("Định dạng CV này không phải PDF có thể xem trước.");
        }

        blobUrl = URL.createObjectURL(blob);

        const loadingTask = pdfjsLib.getDocument({
          url: blobUrl,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdfDoc = await loadingTask.promise;

        if (!cancelled) {
          setPdf(pdfDoc);
          setTotalPages(pdfDoc.numPages);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading CV:", err);
          setError(`Không thể xem CV: ${err.message}`);
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdf) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.5);
  };

  if (loading) {
    return (
      <div className="pdf-loading">
        <div className="spinner"></div>
        <p>Đang tải PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-error">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p>{error}</p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-fallback-link"
        >
          Mở PDF trong tab mới
        </a>
      </div>
    );
  }

  if (htmlDocument) {
    return (
      <div className="html-cv-viewer">
        <iframe
          title="Nội dung CV"
          srcDoc={htmlDocument}
          sandbox=""
          className="html-cv-frame"
        />
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      
      <div className="pdf-controls">
        <div className="pdf-page-controls">
          <button
            className="pdf-control-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            title="Trang trước"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <span className="pdf-page-info">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            className="pdf-control-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            title="Trang sau"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="pdf-zoom-controls">
          <button
            className="pdf-control-btn"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Thu nhỏ"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <span className="pdf-zoom-info">{Math.round(scale * 100)}%</span>

          <button
            className="pdf-control-btn pdf-control-btn-text"
            onClick={handleResetZoom}
            title="Đặt lại zoom"
          >
            Đặt lại
          </button>

          <button
            className="pdf-control-btn"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            title="Phóng to"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      
      <div className="pdf-canvas-container">
        <canvas ref={canvasRef} className="pdf-canvas" />
      </div>
    </div>
  );
};

export default PDFViewer;
