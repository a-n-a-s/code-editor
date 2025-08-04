import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TemplateFolder } from "../lib/path-to-json";
import { getplaygroundById, SaveUpdatedCode } from "../actions";

interface PlaygroundData {
  id: string;
  title?: string;
  [key: string]: any;
}

interface UserPlaygroundData {
  playground: PlaygroundData;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlaygroundData: () => Promise<void>;

  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UserPlaygroundData => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>();
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getplaygroundById(id);
      
      setPlaygroundData(data);
      const rawContent = data?.templateFiles[0]?.content;
      if (typeof rawContent === "string") {
        const parsedOCntent = JSON.parse(rawContent);
        setTemplateData(parsedOCntent);
        toast.success("Playground Loaded Successfully");
        return;
      }

      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch template data");
      }
      const templateRes = await res.json();
      console.log(templateRes);
      if (
        templateRes.templateJson &&
        Array.isArray(templateRes.templateJson.items)
      ) {
        setTemplateData({
          folderName: "Root",
          items: templateRes.templateJson.items,
        });
      } else {
        setTemplateData(
          templateRes.templateJson || {
            folderName: "Root",
            items: {},
          }
        );
      }
      
      toast.success("Playground Loaded Successfully");
    } catch (error) {
      console.log(error);
      setError("Failed to load playground data");
      toast.error("Failed to load playground data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await SaveUpdatedCode(id, data);
        setTemplateData(data);
        toast.success("Changes saved successfully");
      } catch (error) {
        console.error("Error saving template data:", error);
        toast.error("Failed to save changes");
        throw error;
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);
  console.log(playgroundData)
  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
