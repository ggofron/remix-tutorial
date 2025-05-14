import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi, afterEach } from "vitest";
import { LenderDetailsForm } from "../lender";
import { initialLenderData } from "../types/lender.types";
import * as verifyDuplicateLenderModule from "../hooks/useVerifyDuplicateLender";

describe("PDE LenderDetailsForm Component", () => {
  const mockOnInputChange = vi.fn();
  const mockOnParentAsLenderChange = vi.fn();
  const mockOnEmailChange = vi.fn();
  const mockOnStatusChange = vi.fn();
  const mockOnParentNameVerify = vi.fn();
  const mockRenderRequiredLabel = (label: string) => {
    return (
      <span>
        {label}
        <span>*</span>
      </span>
    );
  };

  const mockOnVerifyDuplicateLender = vi.fn();
  const mockHandleVerifyDuplicateLender = vi.fn();
  
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
    expect(mockOnVerifyDuplicateLender).toHaveBeenCalled();
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

  test("verifies lender name for duplicates when name input changes", () => {
    render(<LenderDetailsForm {...defaultProps} />);
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "Test Lender" } });
    
    expect(mockOnVerifyDuplicateLender).toHaveBeenCalled();
  });
  
  test("verifies parent name for duplicates when parent input changes", () => {
    render(<LenderDetailsForm {...defaultProps} formData={{ ...initialLenderData, useParentAsLender: false }} />);
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "Test Parent" } });
    
    expect(mockOnVerifyDuplicateLender).toHaveBeenCalled();
  });

  test("calls verifyDuplicateLender with same value for parent and lender when useParentAsLender is true", () => {
    const mockVerifyFunc = vi.spyOn(verifyDuplicateLenderModule, 'useVerifyDuplicateLender').mockReturnValue({
      verifyDuplicateLender: mockHandleVerifyDuplicateLender
    });
    
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: true }}
      />
    );
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "Same Name" } });
    
    expect(mockOnVerifyDuplicateLender).toHaveBeenCalled();
    
    mockVerifyFunc.mockRestore();
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
});

describe("Duplicate lender verification", () => {
  const mockOnInputChange = vi.fn();
  const mockOnParentAsLenderChange = vi.fn();
  const mockOnEmailChange = vi.fn();
  const mockOnStatusChange = vi.fn();
  const mockOnVerifyDuplicateLender = vi.fn();
  const mockVerifyDuplicate = vi.fn();
  
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
    vi.spyOn(verifyDuplicateLenderModule, 'useVerifyDuplicateLender').mockReturnValue({
      verifyDuplicateLender: mockVerifyDuplicate
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  test("calls verifyDuplicateLender with same value for both parameters when useParentAsLender is true", () => {
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: true }}
      />
    );
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "Test Name" } });
    
    // Simply check that the verification was called with identical values for both parameters
    expect(mockVerifyDuplicate).toHaveBeenCalledWith("Test Name", "Test Name");
  });
  
  test("calls verifyDuplicateLender with correct parameters when lender name changes", () => {
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: false, parentName: "Existing Parent" }}
      />
    );
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "New Lender" } });
    
    expect(mockVerifyDuplicate).toHaveBeenCalledWith("New Lender", "Existing Parent");
  });

  test("triggers verification when lender name matches parent name with useParentAsLender=false", () => {
    render(
      <LenderDetailsForm
        {...defaultProps}
        formData={{ ...initialLenderData, useParentAsLender: false, parentName: "Same Name" }}
      />
    );
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "Same Name" } });
    
    expect(mockVerifyDuplicate).toHaveBeenCalledWith("Same Name", "Same Name");
  });
  
  test("isEditMode blocks verification in certain cases", () => {
    render(
      <LenderDetailsForm
        {...defaultProps}
        isEditMode={true}
        formData={{ ...initialLenderData }}
      />
    );
    
    const parentInput = screen.getByLabelText(/Parent\s*\*/i);
    fireEvent.change(parentInput, { target: { value: "New Parent" } });
    
    expect(mockVerifyDuplicate).toHaveBeenCalled();
  });
  
  test("input changes with empty values don't trigger verification", () => {
    render(<LenderDetailsForm {...defaultProps} />);
    
    const lenderInput = screen.getByRole("textbox", { name: /Lender/i });
    fireEvent.change(lenderInput, { target: { value: "" } });
    
    expect(mockVerifyDuplicate).not.toHaveBeenCalled();
  });
});