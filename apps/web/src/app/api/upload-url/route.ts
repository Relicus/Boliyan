import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9.-]/g, "_");

export async function POST(request: Request) {
  try {
    // Check Config
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      NEXT_PUBLIC_R2_DOMAIN
    } = process.env;

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error("Missing R2 configuration env vars");
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 });
    }

    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from RSC
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Presign upload auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const fileName = typeof body?.fileName === "string" ? body.fileName : "image";
    const contentType = typeof body?.contentType === "string" ? body.contentType : "application/octet-stream";
    const sanitizedName = sanitizeFilename(fileName);
    const objectKey = `listings/${user.id}/${Date.now()}_${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });
    const publicBase = NEXT_PUBLIC_R2_DOMAIN || "";

    return NextResponse.json({
      uploadUrl,
      objectKey,
      publicUrl: publicBase ? `${publicBase}/${objectKey}` : objectKey,
    });
  } catch (error) {
    console.error("Presign upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
