import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getKeyFromUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const travelId = searchParams.get("travel_id");

  let query = supabaseAdmin
    .from("travel_photos")
    .select("*")
    .order("sort_order", { ascending: true });

  if (travelId) {
    query = query.eq("travel_id", travelId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("travel_photos")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const { id, ...body } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("travel_photos")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  const { data: photo } = await supabaseAdmin
    .from("travel_photos")
    .select("url")
    .eq("id", id)
    .single();

  if (photo) {
    const key = getKeyFromUrl(photo.url);
    if (key) {
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const { r2Client } = await import("@/lib/r2");
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET || "photo-album",
            Key: key,
          }),
        );
      } catch (err) {
        console.error("Delete R2 file error:", err);
      }
    }
  }

  const { error } = await supabaseAdmin
    .from("travel_photos")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
