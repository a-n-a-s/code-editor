"use server";

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import { TemplateFolder } from "../lib/path-to-json";
import { revalidatePath } from "next/cache";

export const getplaygroundById = async (id: string) => {
  try {
    const playground = await db.playground.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        description: true,
        templateFiles: {
          select: {
            content: true,
          },
        },
      },
    });

    return playground;
  } catch (error) {
    console.log("Error fetching playground", error);
  }
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId,
      },
      update: {
        content: JSON.stringify(data),
      },
      create: {
        playgroundId,
        content: JSON.stringify(data),
      },
    });
    // revalidatePath(`/playground/${playgroundId}`);
  } catch (error) {
    console.log("Error updating playground", error);
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  try {
    await db.playground.update({
      where: { id },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const duplicateProjectById = async (id: string) => {
  try {
    // Fetch the original playground data
    const originalPlayground = await db.playground.findUnique({
      where: { id },
      include: {
        templateFiles: true, // Include related template files
      },
    });

    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    // Create a new playground with the same data but a new ID
    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,
        templateFiles: {
          // @ts-ignore
          create: originalPlayground.templateFiles.map((file) => ({
            content: file.content,
          })),
        },
      },
    });

    // Revalidate the dashboard path to reflect the changes
    revalidatePath("/dashboard");

    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating project:", error);
  }
};
