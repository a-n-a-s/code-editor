
import React from "react";
import AddNewButton from "@/features/dashboard/components/AddNewButton";
import AddRepoButton from "@/features/dashboard/components/AddRepoButton";
import EmptyState from "@/components/ui/emptyState";
import {
  getAllPlaygroundForUser,
  onDeleteProject,
  onDuplicateProject,
  onUpdateProject,
} from "@/features/dashboard/actions";
import ProjectTable from "@/features/dashboard/components/ProjectTable";

const Page = async () => {
  const playgrounds: any[] = await getAllPlaygroundForUser();
  console.log(playgrounds)
  return (
    <>
      <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <AddNewButton />
          <AddRepoButton />
        </div>

        <div className="mt-10 flex flex-col justify-start items-center w-full">
          {playgrounds && playgrounds.length === 0 ? (
            <EmptyState
              title="No Playgrounds"
              description="Create a new playground to get started"
              image="/no-playground.svg"
            />
          ) : (
            <p>
              <ProjectTable
                projects={playgrounds || []}
                //@ts-ignore
                onDeleteProject={onDeleteProject}
                //@ts-ignore
                onUpdateProject={onUpdateProject}
                onDuplicateProject={onDuplicateProject}
              />
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
