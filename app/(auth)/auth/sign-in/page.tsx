import React from "react";
import Image from "next/image";
import SignInFormClient from "@/features/auth/components/SignInFormClient";

const SignInPage = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <Image src={"/logo.svg"} width={100} height={100} alt="logo" />
      <SignInFormClient />
    </div>
  );
};

export default SignInPage;
