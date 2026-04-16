export const uploadToMinio = async (file: File): Promise<string> => {
  // Simulasi delay upload
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create object URL as mock signed URL for testing, or return static mock
  return URL.createObjectURL(file);
};
