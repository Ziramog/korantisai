import { v2 as cloudinary } from 'cloudinary';

type CloudinaryEnv = NodeJS.ProcessEnv & {
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
};

export function validateCloudinaryEnv(env: CloudinaryEnv = process.env) {
  const missing = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ].filter((key) => !env[key as keyof CloudinaryEnv]);

  return {
    ok: missing.length === 0,
    missing,
  };
}

export function configureCloudinary(env: CloudinaryEnv = process.env) {
  const validation = validateCloudinaryEnv(env);

  if (!validation.ok) {
    return validation;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return validation;
}

configureCloudinary();

export { cloudinary };
