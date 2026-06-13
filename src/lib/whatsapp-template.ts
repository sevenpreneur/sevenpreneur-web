import GetPrismaClient from "./prisma";
import LogError from "./prisma-log-error";
import { WhatsAppTemplateComponentType } from "./whatsapp-types";

// https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview/?locale=en_US#parameter-formats
function whatsappReplaceParameter(
  text: string,
  parameters: Record<string, string>
) {
  const reParam = /\{\{([0-9a-z_]+)\}\}/gi;
  const matches = text.matchAll(reParam);

  let lastIndex = 0;
  let replaced = "";

  for (const match of matches) {
    replaced += text.substring(lastIndex, match.index);
    if (typeof parameters === "object" && parameters.hasOwnProperty(match[1])) {
      replaced += parameters[match[1]];
    } else {
      replaced += match[0];
    }
    lastIndex = match.index + match[0].length;
  }

  replaced += text.substring(lastIndex);

  return replaced;
}

export async function whatsappTemplateToText(
  prisma: ReturnType<typeof GetPrismaClient>,
  template_id: string,
  lang_code: string,
  parameters: Record<string, string>
) {
  const theTemplate = await prisma.wATemplate.findFirst({
    select: { components: true },
    where: { template_id: template_id, lang_code: lang_code },
  });
  if (!theTemplate) {
    await LogError(
      "whatsappTemplateToText",
      "Template not found.",
      template_id,
      lang_code
    );
    return "";
  }

  const components = theTemplate.components as WhatsAppTemplateComponentType;

  const textIndices = {
    HEADER: 0,
    BODY: 1,
    FOOTER: 2,
  };
  const texts = ["", "", ""];

  for (const component of components) {
    texts[textIndices[component.type]] +=
      whatsappReplaceParameter(component.text, parameters) + "\n";
  }

  return texts
    .map((entry) => entry.trim())
    .join("\n")
    .trim();
}
