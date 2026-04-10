import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IncidentFilters from "../IncidentFilters";

const defaultProps = {
  searchText: "",
  onSearchChange: vi.fn(),
  filterType: "Todos" as const,
  onFilterTypeChange: vi.fn(),
  filterUrgency: "Todas" as const,
  onFilterUrgencyChange: vi.fn(),
  filterCoordinator: "",
  onFilterCoordinatorChange: vi.fn(),
  filterFollowUp: false,
  onFilterFollowUpChange: vi.fn(),
};

describe("IncidentFilters", () => {
  it("renders search input with placeholder", () => {
    render(<IncidentFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Buscar por professor/)).toBeInTheDocument();
  });

  it("calls onSearchChange when typing in search", () => {
    const onSearchChange = vi.fn();
    render(<IncidentFilters {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar por professor/), { target: { value: "test" } });
    expect(onSearchChange).toHaveBeenCalledWith("test");
  });

  it("renders all problem type filter buttons", () => {
    render(<IncidentFilters {...defaultProps} />);
    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("Suporte")).toBeInTheDocument();
    expect(screen.getByText("Didático")).toBeInTheDocument();
  });

  it("calls onFilterTypeChange when clicking a type button", () => {
    const onFilterTypeChange = vi.fn();
    render(<IncidentFilters {...defaultProps} onFilterTypeChange={onFilterTypeChange} />);
    fireEvent.click(screen.getByText("Suporte"));
    expect(onFilterTypeChange).toHaveBeenCalledWith("Suporte");
  });

  it("renders urgency filter buttons", () => {
    render(<IncidentFilters {...defaultProps} />);
    expect(screen.getByText("Todas")).toBeInTheDocument();
    expect(screen.getByText("Baixa")).toBeInTheDocument();
    expect(screen.getByText("Média")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("calls onFilterUrgencyChange when clicking urgency", () => {
    const onFilterUrgencyChange = vi.fn();
    render(<IncidentFilters {...defaultProps} onFilterUrgencyChange={onFilterUrgencyChange} />);
    fireEvent.click(screen.getByText("Alta"));
    expect(onFilterUrgencyChange).toHaveBeenCalledWith("Alta");
  });

  it("calls onFilterCoordinatorChange on coordinator input", () => {
    const onFilterCoordinatorChange = vi.fn();
    render(<IncidentFilters {...defaultProps} onFilterCoordinatorChange={onFilterCoordinatorChange} />);
    fireEvent.change(screen.getByPlaceholderText("Filtrar..."), { target: { value: "João" } });
    expect(onFilterCoordinatorChange).toHaveBeenCalledWith("João");
  });

  it("toggles follow-up filter", () => {
    const onFilterFollowUpChange = vi.fn();
    render(<IncidentFilters {...defaultProps} onFilterFollowUpChange={onFilterFollowUpChange} />);
    fireEvent.click(screen.getByText(/Acompanhamento pendente/));
    expect(onFilterFollowUpChange).toHaveBeenCalledWith(true);
  });
});
