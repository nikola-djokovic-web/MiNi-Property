export async function apiGet<T>(url: string, tenantId: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    
    // Try to parse as JSON first
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch (parseError) {
      // errorMessage is already set to errorText
    }
    
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: any,
  tenantId: string
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    
    // Try to parse as JSON first
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch (parseError) {
      // errorMessage is already set to errorText
    }
    
    throw new Error(errorMessage);
  }
  
  return res.json();
}
