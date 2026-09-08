import { orderSizeLabel } from "@/lib/product-sizes";

export type CustomerDetails = {
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  specialRequest?: string;
};

export type ProductOrderLine = {
  productName: string;
  category?: string;
  size?: string;
  color?: string;
  quantity: number;
};

const DIVIDER = "━━━━━━━━━━━━━━";

function formatProductBlock(product: ProductOrderLine): string {
  const lines = [`Product Name: ${product.productName}`];

  if (product.category?.trim()) {
    lines.push(`Category: ${product.category.trim()}`);
  }
  if (product.size?.trim()) {
    lines.push(`${orderSizeLabel(product.size)}: ${product.size.trim()}`);
  }
  if (product.color?.trim()) {
    lines.push(`Color: ${product.color.trim()}`);
  }
  lines.push(`Quantity: ${product.quantity}`);

  return lines.join("\n");
}

export function buildWhatsAppOrderMessage(
  customer: CustomerDetails,
  products: ProductOrderLine[],
): string {
  const productBlocks = products.map(formatProductBlock).join("\n\n");
  const special = customer.specialRequest?.trim() || "None";
  const productWord = products.length === 1 ? "this product" : "these products";

  return `👗 SHOP ALBIE PRODUCT ORDER REQUEST

${DIVIDER}

👤 CUSTOMER DETAILS

Name: ${customer.customerName}
Phone: ${customer.customerPhone}
Location: ${customer.customerLocation}

${DIVIDER}

🛍️ PRODUCT DETAILS

${productBlocks}

${DIVIDER}

📝 SPECIAL REQUEST

${special}

${DIVIDER}

Thank you.

I am interested in ordering ${productWord} from Shop Albie.

Please contact me regarding measurements, pricing, availability, and delivery options.

Generated from Shop Albie Website.`;
}
