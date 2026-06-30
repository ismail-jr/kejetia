/** True when the signed-in user is the provider who listed this service. */
export function isOwnService(
  userId: string | undefined | null,
  providerId: string,
): boolean {
  return !!userId && userId === providerId;
}
