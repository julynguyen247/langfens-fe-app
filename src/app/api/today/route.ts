import { NextResponse } from "next/server";
import todayData from "@/data/today.json";

export async function GET() {
  return NextResponse.json(todayData);
}
