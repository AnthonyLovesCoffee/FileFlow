export async function checkServiceHealth(serviceUrl: string): Promise<boolean> {
  try {
    const healthUrl = `${serviceUrl}/actuator/health`;
    const response = await fetch(healthUrl);
    if (!response.ok) {
      return false;
    }
    const health = await response.json();
    return health.status === "UP";
  } catch (error) {
    return false;
  }
}