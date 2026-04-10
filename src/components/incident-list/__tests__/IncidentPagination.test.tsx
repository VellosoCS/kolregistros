import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IncidentPagination from "../IncidentPagination";

const defaultProps = {
  filteredCount: 50,
  totalCount: 100,
  pageSize: 10,
  currentPage: 1,
  totalPages: 5,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe("IncidentPagination", () => {
  it("displays record counts", () => {
    render(<IncidentPagination {...defaultProps} />);
    expect(screen.getByText("50 de 100 registros")).toBeInTheDocument();
  });

  it("renders page size select with options", () => {
    render(<IncidentPagination {...defaultProps} />);
    const select = screen.getByDisplayValue("10");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Todos")).toBeInTheDocument();
  });

  it("calls onPageSizeChange when selecting a new size", () => {
    const onPageSizeChange = vi.fn();
    render(<IncidentPagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);
    fireEvent.change(screen.getByDisplayValue("10"), { target: { value: "25" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it("renders page buttons for totalPages <= 7", () => {
    render(<IncidentPagination {...defaultProps} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it("calls onPageChange when clicking a page number", () => {
    const onPageChange = vi.fn();
    render(<IncidentPagination {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText("3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous buttons on first page", () => {
    render(<IncidentPagination {...defaultProps} currentPage={1} />);
    expect(screen.getByText("«")).toBeDisabled();
  });

  it("disables next buttons on last page", () => {
    render(<IncidentPagination {...defaultProps} currentPage={5} />);
    expect(screen.getByText("»")).toBeDisabled();
  });

  it("hides pagination buttons when totalPages is 1", () => {
    render(<IncidentPagination {...defaultProps} totalPages={1} />);
    expect(screen.queryByText("«")).not.toBeInTheDocument();
  });
});
