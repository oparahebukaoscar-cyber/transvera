export const generateTrackingNumber = () => {
  const prefix = "GX"; // Google-X Logistics style
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomStr}-${timestamp}`;
};
