import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

// Allow up to 10MB for profile picture uploads
export const config = {
    api: {
        bodyParser: false,
        sizeLimit: "10mb",
    },
};

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(user.id);

    const formData = await req.formData();
    const file = formData.get("profile_picture") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    let avatarUrl: string;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const result = await uploadToCloudinary(buffer, "profiles", `user_${userId}`);
        avatarUrl = result.url;
    } else {
        // In production without Cloudinary, store as base64 data URL (not ideal but functional)
        avatarUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, profilePicture: avatarUrl },
        update: { profilePicture: avatarUrl },
    });

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
}
