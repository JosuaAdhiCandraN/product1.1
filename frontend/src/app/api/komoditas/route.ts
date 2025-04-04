import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const komoditas = await prisma.komoditas.findMany();
    return NextResponse.json({ success: true, data: komoditas });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
