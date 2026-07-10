export function formatMoney(amount) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}
