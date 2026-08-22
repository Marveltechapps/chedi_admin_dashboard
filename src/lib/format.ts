export function fmt(n: number): string {
  return '₹' + Number(n).toLocaleString('en-IN');
}
