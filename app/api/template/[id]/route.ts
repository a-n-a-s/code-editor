import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/features/playground/lib/path-to-json";
import { templatePaths } from "@/lib/template";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs";
import { NextRequest } from "next/server";
import { success } from "zod";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data));
    return true;
  } catch (error) {
    console.log("Invalid Json Structure", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new Response("Playground not found", {
      status: 400,
    });
  }

  const playground = await db.playground.findUnique({
    where: {
      id,
    },
  });
  console.log(playground);

  if (!playground) {
    return new Response("Playground not found", {
      status: 404,
    });
  }

  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey];

  if (!templatePath) {
    return new Response("Template not found", {
      status: 404,
    });
  }

  try {
    const inputFile = path.join(process.cwd(), templatePath);
    const outputFile = path.join(process.cwd(), `/output/${templateKey}.json`);

    await saveTemplateStructureToJson(inputFile, outputFile);

    const result = await readTemplateStructureFromJson(outputFile);

    if (!validateJsonStructure(result)) {
      return new Response("Invalid template structure", {
        status: 500,
      });
    }

    await fs.promises.unlink(outputFile);

    return Response.json(
      { success: true, templateJson: result, templateKey },
      {
        status: 200,
      }
    );
  } catch (error) {
    return new Response("Internal server error", {
      status: 500,
    });
  }
}
