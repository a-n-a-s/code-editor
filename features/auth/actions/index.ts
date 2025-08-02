"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.account.findUnique({
      where: {
        userId,
      },
    });
    return account;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const currentUser = async () => {
  const user = await auth();
  return user?.user;
};
