export const buildImageUrl = (request, relativePath) => {
  if (!relativePath) return null;
  return `${request.protocol}://${request.hostname}/uploads${relativePath}`;
};
