"use client"

/**
 * Small same-origin JSON client — the storefront's CallApi helper minus the
 * cross-origin plumbing ITSMIFY doesn't have: every auth call shares this
 * origin, so the session cookie rides along by itself.
 */

export class ApiError extends Error {
   /** Field errors from a 422 — `{ username: "این نام کاربری..." }`. */
   errors?: Record<string, string>
   /** `code` marks protocol-level failures (rate limit, account states). */
   code?: string

   constructor(message: string, init?: { errors?: Record<string, string>; code?: string; status?: number }) {
      super(message)
      this.name = "ApiError"
      this.errors = init?.errors
      this.code = init?.code
      this.status = init?.status
   }

   status?: number
}

async function parseBody(res: Response): Promise<Record<string, unknown>> {
   try {
      return (await res.json()) as Record<string, unknown>
   } catch {
      return {}
   }
}

export async function postJson<T = Record<string, unknown>>(
   url: string,
   body: unknown,
   signal?: AbortSignal,
): Promise<T> {
   const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal,
   })

   const data = await parseBody(res)
   if (!res.ok) throw errorFrom(res, data)
   return data as T
}

export async function getJson<T = Record<string, unknown>>(url: string, signal?: AbortSignal): Promise<T> {
   const res = await fetch(url, { signal })
   const data = await parseBody(res)
   if (!res.ok) throw errorFrom(res, data)
   return data as T
}

export async function patchJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
   const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
   })
   const data = await parseBody(res)
   if (!res.ok) throw errorFrom(res, data)
   return data as T
}

export async function deleteJson<T = Record<string, unknown>>(url: string): Promise<T> {
   const res = await fetch(url, { method: "DELETE" })
   const data = await parseBody(res)
   if (!res.ok) throw errorFrom(res, data)
   return data as T
}

function errorFrom(res: Response, data: Record<string, unknown>): ApiError {
   if (res.status === 422 && (data.fields || data.error === "validation")) {
      return new ApiError("validation", {
         errors: (data.fields as Record<string, string>) ?? {},
         status: 422,
      })
   }
   return new ApiError(String(data.error ?? data.message ?? `request failed (${res.status})`), {
      code: typeof data.code === "string" ? data.code : undefined,
      status: res.status,
   })
}
