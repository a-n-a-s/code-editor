import { useSession } from "next-auth/react"

export const getCurrentUser = ()=>{
    const session = useSession();
    return session?.data?.user;
}