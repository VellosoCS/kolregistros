import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectionActionBar from "../SelectionActionBar";

const defaultProps = {
  count: 3,
  onExportPDF: vi.fn(),
  onExportDOCX: vi.fn(),
  onClear: vi.fn(),
};

describe("SelectionActionBar", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<SelectionActionBar {...defaultProps} count={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("displays selection count", () => {
    render(<SelectionActionBar {...defaultProps} />);
    expect(screen.getByText("3 selecionado(s)")).toBeInTheDocument();
  });

  it("calls onExportPDF when PDF button is clicked", () => {
    const onExportPDF = vi.fn();
    render(<SelectionActionBar {...defaultProps} onExportPDF={onExportPDF} />);
    fireEvent.click(screen.getByText("PDF"));
    expect(onExportPDF).toHaveBeenCalledOnce();
  });

  it("calls onExportDOCX when Word button is clicked", () => {
    const onExportDOCX = vi.fn();
    render(<SelectionActionBar {...defaultProps} onExportDOCX={onExportDOCX} />);
    fireEvent.click(screen.getByText("Word"));
    expect(onExportDOCX).toHaveBeenCalledOnce();
  });

  it("calls onClear when close button is clicked", () => {
    const onClear = vi.fn();
    render(<SelectionActionBar {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByTitle("Limpar seleção"));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
