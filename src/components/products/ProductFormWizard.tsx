import React from "react";
import { ProductFormLayout, type ProductFormLayoutProps } from "./ProductFormLayout";

export type ProductFormWizardProps = ProductFormLayoutProps & {
  isModal?: boolean;
};

/**
 * ProductFormWizard alias forwarding to the modern 2-Column ProductFormLayout
 * for full backward compatibility.
 */
export const ProductFormWizard: React.FC<ProductFormWizardProps> = (props) => {
  return <ProductFormLayout {...props} />;
};

export default ProductFormWizard;
