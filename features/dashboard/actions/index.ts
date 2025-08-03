"use server"

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import { Templates } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createPlayground = async (data: {
  title: string;
  description: string;
  template: Templates;
  userId: string;
}) => {
  const { template, description, title } = data;

  const user = await currentUser();

  try {
    const playground = await db.playground.create({
      data: {
        title,
        description,
        template,
        userId: user?.id,
      },
    });
    return playground;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();
  try {
    const playgrounds = await db.playground.findMany({
      where: {
        userId: user?.id,
      },
      include: {
        user: true,
        StarMark: {
          where: {
            userId: user?.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });
    return playgrounds;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const onDeleteProject = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const onUpdateProject = async (
  id: string,
  data: {
    title: string;
    description: string;
  }
) => {
  try {
    await db.playground.update({
      where: {
        id,
      },
      data,
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const onDuplicateProject = async (id: string) => {
  try {
    const originalProject = await db.playground.findUnique({
      where: {
        id,
      },
    });
    if (!originalProject) {
      throw new Error("Project not found");
    }

    const duplicateProject = await db.playground.create({
      data: {
        title: `${originalProject.title} (Copy)`,
        description: originalProject.description,
        template: originalProject.template,
        userId: originalProject.userId,
      },
    });
    revalidatePath("/dashboard");
    console.log("Duplicate project created:", duplicateProject);
    return duplicateProject;
  } catch (error) {
    console.log(error);
    return null;
  }
};
