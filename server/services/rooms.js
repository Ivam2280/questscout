const { UserInputError } = require("../utils/errors");

const genres = ["Horror", "Detective", "Adventure", "Fantasy", "Crime", "Sci-Fi", "Historical", "Comedy"];
const MAX_IMAGE_BYTES = 256 * 1024;

function validateImage(value) {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 50) throw new UserInputError("Images must be no larger than 256 KB after compression.");
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)) return value;
  if (value.startsWith("/images/") && !value.includes("..")) return value;
  try { if (new URL(value).protocol === "https:") return value; } catch {}
  throw new UserInputError("Use an HTTPS image URL or a JPEG, PNG or WebP image.");
}

function validateRoom(input) {
  const result = { ...input, theme: input.theme.trim(), genre: input.genre.trim(), description: input.description.trim() };
  if (!result.theme || result.theme.length > 80 || !result.description || result.description.length > 4000) throw new UserInputError("Enter a room name and description.");
  if (!genres.includes(result.genre)) throw new UserInputError("Select a valid genre.");
  for (const key of ["playersMin", "playersMax", "price", "duration"]) {
    if (!Number.isSafeInteger(result[key])) throw new UserInputError(`${key} must be an integer.`);
  }
  if (result.playersMin < 1 || result.playersMax < result.playersMin || result.playersMax > 20) throw new UserInputError("Choose a valid player range between 1 and 20.");
  if (result.price < 0 || result.price > 1000000) throw new UserInputError("Choose a valid price.");
  if (result.duration < 15 || result.duration > 240) throw new UserInputError("Duration must be between 15 and 240 minutes.");
  result.image_url = validateImage(result.image_url);
  if (!Array.isArray(result.gallery || []) || (result.gallery || []).length > 6) throw new UserInputError("Use up to six gallery images.");
  result.gallery = (result.gallery || []).map(validateImage);
  return result;
}

module.exports = { validateRoom, validateImage };
