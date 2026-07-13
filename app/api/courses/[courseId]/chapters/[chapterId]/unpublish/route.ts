import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const { userId } = await auth();
    const { courseId, chapterId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      },
    });
    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const unpublishedChapter = await db.chapter.update({
      where: {
        id: chapterId,
        courseId,
      },
      data: {
        isPublished: false,
      },
    });

    // If this chapter is the only chapter published in the course, unpublish the course as well
    const publishedChaptersInCourse = await db.chapter.findMany({
      where: {
        courseId,
        isPublished: true,
      },
    });
    if (!publishedChaptersInCourse.length) {
      await db.course.update({
        where: { id: courseId },
        data: { isPublished: false },
      });
    }

    return NextResponse.json(unpublishedChapter);
  } catch (error) {
    console.log("[CHAPTER_UNPUBLISH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
