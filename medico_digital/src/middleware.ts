import { NextRequest, NextResponse } from "next/server";
import { handleApiGuard } from "@/guards/api-guard";
import { handlePageGuard } from "@/guards/page-guard";

export function middleware(request: NextRequest) {
  const apiGuardResponse = handleApiGuard(request);
  if (apiGuardResponse) {
    return apiGuardResponse;
  }

  const pageGuardResponse = handlePageGuard(request);
  if (pageGuardResponse) {
    return pageGuardResponse;
  }

  return NextResponse.next();
}
