import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LenderDetailsForm } from "../lender";
import { initialLenderData } from "../types/lender.types";
import * as useVerifyDuplicateLenderModule from "../hooks/useVerifyDuplicateLender";

// Mock the module directly
vi.mock("../hooks/useVerifyDuplicateLender");

describe("PDE LenderDetailsForm Component", () => {
  const mockOnInputChange = vi.fn();
  const mockOnParentAsLenderChange = vi.fn();
  const mockOnEmailChange = vi.fn();
  const mockOnStatusChange = vi.fn();
  const mockOnVerifyDuplicateLender = vi.fn();
  const mockRenderRequiredLabel = (label: string) => {
    return (
      <span>
        {label}
        <span>*</span>
      </span>
    );
  };

  const defaultProps = {
    formData: { ...initialLenderData },
    validationErrors: {},
    onInputChange: mockOnInputChange,
    onParentAsLenderChange: mockOnParentAsLenderChange,
    onEmailChange: mockOnEmailChange,
    onStatusChange: mockOnStatusChange,
    renderRequiredLabel: mockRenderRequiredLabel,
    onVerifyDuplicateLender: mockOnVerifyDuplicateLender
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyFunction.mockClear();
  });

  test("renders all form fields correctly", () => {
    render(<LenderDetailsForm {...defaultProps} />);

    const requiredFields = [
      "Parent",
      "Lender",
      "Address",
      "Telephone",
      "Provider ID",
      "IFO Lender ID"
    ];

    requiredFields.forEach((field) => {
      expect(screen.getByLabelText(new RegExp(`${field}\\s*\\*`))).toBeInTheDocument();
    });

    expect(screen.getByText(/Email Addresses/i)).toBeInTheDocument();
    expect(screen.getByText(/Press Enter or comma/i)).toBeInTheDocument();
    expect(screen.getByTestId("status-dropdown")).toBeInTheDocument();
    expect(screen.getByText(/Use parent as lender/i)).toBeInTheDocument();
  });

  test("handles input changes correctly", () => {
    render(<LenderDetailsForm {...defaultProps} />);

    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "Test Parent" } });

    expect(mockOnInputChange).toHaveBeenCalledWith(expect.any(Object), "parentName");
  });

  test("handles parent as lender checkbox change", () => {
    render(<LenderDetailsForm {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnParentAsLenderChange).toHaveBeenCalledWith(
      expect.objectContaining({ checked: false }),
    );
  });

  test("disables lender input when useParentAsLender is true", () => {
    render(<LenderDetailsForm {...defaultProps} />);
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    expect(lenderInput).toBeDisabled();
  });

  test("enables lender input when useParentAsLender is false", () => {
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: false }}
      />
    );
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    expect(lenderInput).toBeEnabled();
  });

  test("renders in edit mode with readonly fields when isEditMode is true", () => {
    render(<LenderDetailsForm {...defaultProps} isEditMode={true} />);
    
    const providerIdInput = screen.getByLabelText(/Provider ID\s*\*/i);
    const ifoLenderIdInput = screen.getByLabelText(/IFO Lender ID\s*\*/i);
    
    expect(providerIdInput).toBeDisabled();
    expect(ifoLenderIdInput).toBeDisabled();
  });

  test("disables parent input and parent as lender checkbox when isAddingLender is true", () => {
    render(<LenderDetailsForm {...defaultProps} isAddingLender={true} />);
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    expect(parentInput).toBeDisabled();
    
    expect(parentInput).toHaveClass("p-disabled");
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    
    fireEvent.click(checkbox);
    expect(mockOnParentAsLenderChange).not.toHaveBeenCalled();
  });

  test("enables parent input and parent as lender checkbox when isAddingLender is false", () => {
    render(<LenderDetailsForm {...defaultProps} isAddingLender={false} />);
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    expect(parentInput).not.toBeDisabled();
    expect(parentInput).not.toHaveClass("disabledInput");
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeDisabled();
    
    const checkboxLabel = screen.getByText(/Use Parent as Lender name/i);
    expect(checkboxLabel).not.toHaveClass("disabledLabel");
    
    fireEvent.change(parentInput, { target: { value: "New Parent" } });
    expect(mockOnInputChange).toHaveBeenCalled();
    
    fireEvent.click(checkbox);
    expect(mockOnParentAsLenderChange).toHaveBeenCalled();
  });

  test("verifies lender name for duplicates when name input changes", () => {
    render(<LenderDetailsForm {...defaultProps} />);
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "Test Lender" } });
    
    expect(mockOnVerifyDuplicateLender).toHaveBeenCalled();
  });

  test("calls verifyDuplicateLender with same value for both parameters when useParentAsLender is true", () => {
    // Clear the mock
    mockVerifyDuplicateLender.mockClear();
    
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: true }}
      />
    );
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "ABC Bank" } });
    
    // Check that the function was called with the same value for both parameters
    expect(mockVerifyDuplicateLender).toHaveBeenCalledWith("ABC Bank", "ABC Bank");
  });

  test("calls verifyDuplicateLender with correct parameters when lender name changes", () => {
    // Clear the mock
    mockVerifyDuplicateLender.mockClear();
    
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: false, parentName: "Existing Parent" }}
      />
    );
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "New Lender" } });
    
    // Check that the function was called with the right parameters
    expect(mockVerifyDuplicateLender).toHaveBeenCalledWith("New Lender", "Existing Parent");
  });

  test("input changes with empty values don't trigger verification", () => {
    // Clear the mock
    mockVerifyDuplicateLender.mockClear();
    
    render(<LenderDetailsForm {...defaultProps} />);
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "" } });
    
    // Check that the function is not called
    expect(mockVerifyDuplicateLender).not.toHaveBeenCalled();
  });
});
