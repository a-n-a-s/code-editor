"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import signInButton from "./LogoutButton";
import { getCurrentUser } from "../hooks/use-current-hook";
import LogoutButton from "./LogoutButton";

const UserButton = () => {
  const user = getCurrentUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className={cn("relative rounded-full")}>
          <Avatar>
            <AvatarImage src={user?.image!} alt={user?.name!} />
            <AvatarFallback className="bg-red-500">
              <User className="text-white" />
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="mr-4">
        <DropdownMenuItem>
          <span>{user?.email}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <LogoutButton>
            <DropdownMenuItem>

                <LogOut  className="h-4 w-4 mr-2"/>
                Logout
            </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
