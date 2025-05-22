import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export function getUserIdFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = verify(token, process.env.JWT_SECRET!) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}
