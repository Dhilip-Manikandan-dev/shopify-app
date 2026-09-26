import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { RuleService } from "@/server/services/rule/ruleService";
import { CreateRuleSchema } from "@/server/validators/ruleValidators";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const storeId = req.store.id;

  if (req.method === "GET") {
    const { status, search, page, pageSize } = req.query;
    const rules = await RuleService.getRules({
      storeId,
      status: status as any,
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      pageSize: pageSize ? parseInt(String(pageSize), 10) : 20,
    });

    return res.status(200).json({
      success: true,
      data: rules,
    });
  }

  if (req.method === "POST") {
    const validation = CreateRuleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid rule configuration",
          details: validation.error.flatten(),
        },
      });
    }

    const created = await RuleService.createRule(storeId, validation.data);
    return res.status(201).json({
      success: true,
      data: created,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: `Method ${req.method} not allowed`,
    },
  });
}

export default withAuth(handler);
