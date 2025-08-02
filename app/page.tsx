import { Button } from "@/components/ui/button";
import UserButton from "@/features/auth/components/UserButton";

export default function Home() {
  return (
    <div>
      <h1 className="text-rose-500 font-bold text-3xl">Home</h1>
      <UserButton />
    </div>
  );
}
